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

// British Neural voices — Ryan (male) and Sonia (female).
// Restored as the default per user preference.
const VOICE_MALE   = "en-GB-RyanNeural";
const VOICE_FEMALE = "en-GB-SoniaNeural";

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

// buildInput — always returns plain text.
// SSML <prosody rate> was trialled for Multilingual Neural voices but the
// Edge TTS service returns 0-byte audio intermittently; plain text is reliable.
function buildInput(_voice: string, text: string, _rate: string): string {
  return text;
}

async function synthesize(voice: string, input: string): Promise<Buffer> {
  const tts = await acquireConnection(voice);
  const { audioStream } = tts.toStream(input);
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

async function getAudio(voice: string, input: string): Promise<Buffer> {
  const key = cacheKey(voice, input);
  const cached = cacheGet(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = synthesize(voice, input)
    .then((buf) => { cachePut(key, buf); return buf; })
    .finally(() => { inflight.delete(key); });
  inflight.set(key, promise);
  return promise;
}

// ── Shared stream helper ─────────────────────────────────────────────────────
// Strategy:
//   1. Cache hit  → send buffer immediately with Content-Length (instant).
//   2. Inflight   → wait for the coalesced promise, then send (avoids double
//                   synthesis when two requests arrive for the same text).
//   3. Cache miss → pipe chunks to the response AS THEY ARRIVE from Edge TTS,
//                   so the browser <audio> starts playing on the very first
//                   chunk (~200-400 ms) instead of waiting for full synthesis
//                   (~2-5 s). Chunks are also collected and stored in the LRU
//                   cache for instant serving on the next request.

async function streamTTS(
  text: string,
  voice: string,
  req: Request,
  res: Response,
  rate = "",
): Promise<void> {
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  // Build synthesis input — SSML when rate is requested, plain text otherwise
  const input = buildInput(voice, text, rate);
  const key = cacheKey(voice, input);

  // ── 1. Cache hit ─────────────────────────────────────────────────────────
  const hit = cacheGet(key);
  if (hit) {
    req.log?.info({ voice, len: text.length, bytes: hit.length, cached: true, rate }, "Edge TTS served");
    res.setHeader("Content-Length", String(hit.length));
    res.end(hit);
    return;
  }

  // ── 2. Inflight dedup ────────────────────────────────────────────────────
  const pending = inflight.get(key);
  if (pending) {
    try {
      const buf = await pending;
      res.setHeader("Content-Length", String(buf.length));
      res.end(buf);
    } catch (err) {
      req.log?.error({ err }, "Edge TTS inflight failed");
      if (!res.headersSent) res.status(502).json({ error: "Edge TTS failed." });
      else if (!res.writableEnded) res.end();
    }
    return;
  }

  // ── 3. True streaming ────────────────────────────────────────────────────
  let tts: MsEdgeTTS;
  try {
    tts = await acquireConnection(voice);
  } catch (err) {
    req.log?.error({ err }, "Edge TTS connection failed");
    if (!res.headersSent) res.status(502).json({ error: "Edge TTS failed." });
    return;
  }

  const t0 = Date.now();
  const chunks: Buffer[] = [];
  let done = false;

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    const { audioStream } = tts.toStream(input);

    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      if (!res.writableEnded) res.write(chunk);
    });

    const finish = () => {
      if (done) return;
      done = true;
      if (chunks.length === 0) {
        reject(new Error("audio stream produced no data"));
        if (!res.writableEnded) res.end();
        return;
      }
      const buf = Buffer.concat(chunks);
      cachePut(key, buf);
      req.log?.info(
        { voice, len: text.length, bytes: buf.length, ms: Date.now() - t0 },
        "Edge TTS stream done",
      );
      resolve(buf);
      if (!res.writableEnded) res.end();
    };

    audioStream.on("end",   finish);
    audioStream.on("close", finish);
    audioStream.on("error", (err: Error) => {
      if (done) return;
      done = true;
      req.log?.error({ err }, "Edge TTS audio stream error");
      reject(err);
      if (!res.writableEnded) res.end();
    });
  });

  inflight.set(key, bufferPromise);
  bufferPromise.catch(() => {}).finally(() => inflight.delete(key));
  // Intentionally NOT awaited — chunks are already flowing to `res` above.
}

// ── GET /api/edge-tts  ───────────────────────────────────────────────────────
// Browser <audio src="/api/edge-tts?text=...&voice=..."> plays progressively.

router.get("/edge-tts", async (req: Request, res: Response) => {
  const text = typeof req.query?.text === "string" ? req.query.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Missing 'text' query param." }); return; }

  const requestedVoice = typeof req.query?.voice === "string" ? req.query.voice.trim() : "";
  const gender = req.query?.gender === "female" ? "female" : "male";
  const voice  = requestedVoice || (gender === "female" ? VOICE_FEMALE : VOICE_MALE);
  const rate   = typeof req.query?.rate === "string" ? req.query.rate.trim() : "";

  await streamTTS(text, voice, req, res, rate);
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
