/**
 * edge-tts.ts — Microsoft Edge TTS Route (free, unlimited, no API key)
 *
 * GET  /api/edge-tts?text=...&voice=...&gender=...
 *   Streams audio/mpeg directly — browser <audio src="..."> can play progressively.
 *
 * POST /api/edge-tts
 *   body: { text, voice?, gender? }
 *   Streams audio/mpeg (kept for back-compat).
 *
 * GET  /api/edge-tts-warmup
 *   Pre-warms the WS connection for the requested voice (fire-and-forget).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const router: IRouter = Router();

// Use Microsoft's "Multilingual Neural" voices — newer generation that sounds
// markedly more natural and conversational than the older Neural voices.
// "Brian" is the warm, confident American male (close cousin to ElevenLabs Brian).
const VOICE_MALE   = "en-US-BrianMultilingualNeural";
const VOICE_FEMALE = "en-US-AvaMultilingualNeural";

// ── Connection pool ──────────────────────────────────────────────────────────
// We keep one "warm" (already-handshaked) MsEdgeTTS promise per voice so
// callers skip the WebSocket setup latency (~200-500 ms per cold start).
// After consuming a warm connection we immediately start pre-warming the next.

const pool = new Map<string, Promise<MsEdgeTTS>>();

function prewarm(voice: string): Promise<MsEdgeTTS> {
  const p = (async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    return tts;
  })();
  pool.set(voice, p);
  p.catch(() => pool.delete(voice)); // evict on failure so next call retries
  return p;
}

async function acquireConnection(voice: string): Promise<MsEdgeTTS> {
  const existing = pool.get(voice) ?? prewarm(voice);
  // Immediately start warming a replacement so it's ready for the next caller
  prewarm(voice);
  return existing;
}

// Pre-warm the two most common voices as soon as the module loads
prewarm(VOICE_MALE);
prewarm(VOICE_FEMALE);

// ── In-memory LRU audio cache ────────────────────────────────────────────────
// Identical (voice, text) inputs always produce identical audio. We hold the
// full Buffer in memory so any repeat request is served in ~1 ms (no Edge TTS
// round-trip, no synthesis). Bounded by entry count + total bytes so we don't
// blow up memory on heavy traffic.

const AUDIO_CACHE_MAX_ENTRIES = 2000;
const AUDIO_CACHE_MAX_BYTES   = 64 * 1024 * 1024; // 64 MB
const audioCache = new Map<string, Buffer>(); // insertion-order = LRU order
let   audioCacheBytes = 0;

const inflight = new Map<string, Promise<Buffer>>(); // dedupe concurrent requests

function cacheKey(voice: string, text: string): string {
  return `${voice}::${text}`;
}

function cacheGet(key: string): Buffer | undefined {
  const buf = audioCache.get(key);
  if (!buf) return undefined;
  // bump to most-recently-used by re-inserting
  audioCache.delete(key);
  audioCache.set(key, buf);
  return buf;
}

function cachePut(key: string, buf: Buffer): void {
  if (audioCache.has(key)) {
    audioCacheBytes -= audioCache.get(key)!.length;
    audioCache.delete(key);
  }
  audioCache.set(key, buf);
  audioCacheBytes += buf.length;
  while (
    (audioCache.size > AUDIO_CACHE_MAX_ENTRIES || audioCacheBytes > AUDIO_CACHE_MAX_BYTES) &&
    audioCache.size > 0
  ) {
    const oldestKey = audioCache.keys().next().value as string;
    audioCacheBytes -= audioCache.get(oldestKey)!.length;
    audioCache.delete(oldestKey);
  }
}

async function synthesize(voice: string, text: string): Promise<Buffer> {
  const tts = await acquireConnection(voice);
  const { audioStream } = tts.toStream(text);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on("data",  (c: Buffer) => chunks.push(c));
    audioStream.on("end",   () => resolve(Buffer.concat(chunks)));
    audioStream.on("close", () => {
      if (chunks.length > 0) resolve(Buffer.concat(chunks));
      else reject(new Error("audio stream closed early"));
    });
    audioStream.on("error", reject);
  });
}

async function getAudio(voice: string, text: string): Promise<Buffer> {
  const key = cacheKey(voice, text);
  const cached = cacheGet(key);
  if (cached) return cached;

  // Coalesce concurrent requests for the same (voice, text) so we synthesize once
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = synthesize(voice, text)
    .then((buf) => { cachePut(key, buf); return buf; })
    .finally(() => { inflight.delete(key); });
  inflight.set(key, promise);
  return promise;
}

// ── Shared stream helper ─────────────────────────────────────────────────────

async function streamTTS(
  text: string,
  voice: string,
  req: Request,
  res: Response,
): Promise<void> {
  res.setHeader("Content-Type", "audio/mpeg");
  // Identical (text, voice) always produces identical audio, so let the browser
  // cache aggressively. Subsequent <audio> requests hit the HTTP cache and play
  // without any network round-trip.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  try {
    const t0 = Date.now();
    const buf = await getAudio(voice, text);
    const cached = audioCache.has(cacheKey(voice, text)) && Date.now() - t0 < 5;
    req.log?.info(
      { voice, len: text.length, bytes: buf.length, ms: Date.now() - t0, cached },
      "Edge TTS served",
    );
    res.setHeader("Content-Length", String(buf.length));
    res.end(buf);
  } catch (err) {
    req.log?.error({ err }, "Edge TTS synth failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Edge TTS failed." });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
}

// ── GET /api/edge-tts  ───────────────────────────────────────────────────────
// Browser <audio src="/api/edge-tts?text=...&voice=..."> plays progressively.

router.get("/edge-tts", async (req: Request, res: Response) => {
  const text = typeof req.query?.text === "string" ? req.query.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Missing 'text' query param." }); return; }

  const requestedVoice = typeof req.query?.voice === "string" ? req.query.voice.trim() : "";
  const gender = req.query?.gender === "female" ? "female" : "male";
  const voice  = requestedVoice || (gender === "female" ? VOICE_FEMALE : VOICE_MALE);

  await streamTTS(text, voice, req, res);
});

// ── POST /api/edge-tts  (back-compat) ────────────────────────────────────────

router.post("/edge-tts", async (req: Request, res: Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Missing 'text' in body." }); return; }

  const requestedVoice = typeof req.body?.voice === "string" ? req.body.voice.trim() : "";
  const gender = req.body?.gender === "female" ? "female" : "male";
  const voice  = requestedVoice || (gender === "female" ? VOICE_FEMALE : VOICE_MALE);

  await streamTTS(text, voice, req, res);
});

// ── GET /api/edge-tts-warmup  ────────────────────────────────────────────────
// Clients can hit this on page load to pre-warm their preferred voice.

router.get("/edge-tts-warmup", (req: Request, res: Response) => {
  const voice = typeof req.query?.voice === "string"
    ? req.query.voice.trim()
    : VOICE_MALE;
  prewarm(voice);
  res.json({ ok: true, voice });
});

// ── POST /api/edge-tts-timed  ────────────────────────────────────────────────
// Returns base64 audio + word-boundary timestamps.

router.post("/edge-tts-timed", async (req: Request, res: Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Missing 'text' in body." }); return; }

  const requestedVoice = typeof req.body?.voice === "string" ? req.body.voice.trim() : "";
  const gender = req.body?.gender === "female" ? "female" : "male";
  const voice  = requestedVoice || (gender === "female" ? VOICE_FEMALE : VOICE_MALE);

  req.log?.info({ voice, len: text.length }, "Edge TTS timed request");

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
      wordBoundaryEnabled: true,
    });

    const wordBoundaries: Array<{ word: string; offsetMs: number; durationMs: number }> = [];
    const audioChunks: Buffer[] = [];
    const { audioStream, metadataStream } = tts.toStream(text);

    const metaPromise = metadataStream
      ? new Promise<void>((resolve) => {
          metadataStream.on("data", (chunk: Buffer) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parsed: any = JSON.parse(chunk.toString());
              const items: unknown[] = Array.isArray(parsed?.Metadata) ? parsed.Metadata : [];
              for (const item of items) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = (item as any)?.Data ?? {};
                const wordText: string = d?.text?.Text ?? d?.Text ?? "";
                const offset   = Number(d?.Offset   ?? 0);
                const duration = Number(d?.Duration  ?? 0);
                if (wordText) {
                  wordBoundaries.push({
                    word: wordText,
                    offsetMs:  Math.round(offset   / 10000),
                    durationMs: Math.round(duration / 10000),
                  });
                }
              }
            } catch { /* ignore parse errors */ }
          });
          metadataStream.on("end",   resolve);
          metadataStream.on("close", resolve);
          metadataStream.on("error", resolve);
        })
      : Promise.resolve();

    const audioPromise = new Promise<void>((resolve, reject) => {
      audioStream.on("data",  (chunk: Buffer) => audioChunks.push(chunk));
      audioStream.on("end",   resolve);
      audioStream.on("close", () => { if (audioChunks.length > 0) resolve(); else reject(new Error("closed early")); });
      audioStream.on("error", reject);
    });

    await Promise.all([audioPromise, metaPromise]);

    const audioBase64 = Buffer.concat(audioChunks).toString("base64");
    req.log?.info({ voice, words: wordBoundaries.length }, "Edge TTS timed done");
    res.json({ audio: audioBase64, words: wordBoundaries });
  } catch (err) {
    req.log?.error({ err }, "Edge TTS timed failed");
    if (!res.headersSent) res.status(502).json({ error: "Edge TTS timed failed." });
  }
});

export default router;
