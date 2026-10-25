// @ts-nocheck
/**
 * edge-tts.ts — Microsoft Edge TTS Route (free, unlimited, no API key)
 *
 * GET  /api/edge-tts?text=...&voice=...&gender=...
 *   Returns audio (audio/mpeg or audio/wav depending on engine) so browser
 *   <audio src="..."> can play it.
 *
 * POST /api/edge-tts
 *   body: { text, voice?, gender? }
 *   Same as GET (kept for back-compat).
 *
 * GET  /api/edge-tts-warmup
 *   Kept for client compatibility; connections are created per-request now.
 *
 * ── Engine fallback chain ──────────────────────────────────────────────────
 * Microsoft changed its free read-aloud WebSocket endpoint in late 2025 and
 * now rejects the msedge-tts handshake ("Unexpected server response: 200").
 * Edge TTS is therefore UNRELIABLE and can vanish again any day, so every
 * request walks a free, unlimited fallback chain:
 *
 *   1. Microsoft Edge TTS   (primary when it works — best quality)
 *   2. Groq Orpheus         (needs GROQ_API_KEY — free tier, ~700 ms)
 *   3. Google Translate TTS (no key at all — always available)
 *
 * All three are free/no-cost, so no quota worries anywhere in the chain.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { edgeSynthesizeMp3 } from "./edge-ws";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"; // still used by /edge-tts-timed

const router: IRouter = Router();

// British Neural voices — Ryan (male) and Sonia (female).
// Restored as the default per user preference.
const VOICE_MALE   = "en-GB-RyanNeural";
const VOICE_FEMALE = "en-GB-SoniaNeural";

// ── In-memory LRU audio cache ────────────────────────────────────────────────
// Identical (voice, text) inputs always produce identical audio. We hold the
// full synthesized result in memory so any repeat request is served in ~1 ms
// (no network round-trip, no synthesis). Bounded by entry count + total bytes.

const AUDIO_CACHE_MAX_ENTRIES = 2000;
const AUDIO_CACHE_MAX_BYTES   = 64 * 1024 * 1024; // 64 MB
const audioCache = new Map<string, { buf: Buffer; type: string; engine?: string }>(); // insertion-order = LRU order
let   audioCacheBytes = 0;

const inflight = new Map<string, Promise<{ buf: Buffer; type: string; engine?: string }>>(); // dedupe concurrent requests

function cacheKey(voice: string, text: string): string {
  // "v2::" prefix: regenerate after switching to the revived Edge protocol so
  // results cached under the old (broken) engines can't shadow real Edge audio.
  return `v2::${voice}::${text}`;
}

function cacheGet(key: string): { buf: Buffer; type: string; engine?: string } | undefined {
  const hit = audioCache.get(key);
  if (!hit) return undefined;
  // bump to most-recently-used by re-inserting
  audioCache.delete(key);
  audioCache.set(key, hit);
  return hit;
}

function cachePut(key: string, value: { buf: Buffer; type: string; engine?: string }): void {
  if (audioCache.has(key)) {
    audioCacheBytes -= audioCache.get(key)!.buf.length;
    audioCache.delete(key);
  }
  audioCache.set(key, value);
  audioCacheBytes += value.buf.length;
  while (
    (audioCache.size > AUDIO_CACHE_MAX_ENTRIES || audioCacheBytes > AUDIO_CACHE_MAX_BYTES) &&
    audioCache.size > 0
  ) {
    const oldestKey = audioCache.keys().next().value as string;
    audioCacheBytes -= audioCache.get(oldestKey)!.buf.length;
    audioCache.delete(oldestKey);
  }
}

// buildInput — always returns plain text.
// SSML <prosody rate> was trialled for Multilingual Neural voices but the
// Edge TTS service returns 0-byte audio intermittently; plain text is reliable.
function buildInput(_voice: string, text: string, _rate: string): string {
  return text;
}

// ── 1. Microsoft Edge TTS (priority engine) ──────────────────────────────────
// Native client speaking the current protocol (edge-ws.ts + edge-drm.ts,
// ported from rany2/edge-tts 7.3.0 — the build Microsoft re-enabled in
// Oct 2026). Heartbeats/keep-alive pools proved unreliable; one fresh
// connection per chunk, exactly like the reference implementation.

async function edgeSynthesize(voice: string, text: string): Promise<Buffer> {
  return await edgeSynthesizeMp3(voice, text, 8000);
}

// ── 2. Groq Orpheus (free tier, needs GROQ_API_KEY) ─────────────────────────
// All 8 voices are male/female × US/UK archetypes. Any requested Edge voice is
// resolved to the closest-accent Orpheus voice so "female US" really sounds
// American and "male UK" really sounds British, no matter which Edge voice id
// the frontend sends (incl. Multilingual variants from any app section).
// Arabic text is synthesized with the separate Orpheus Saudi Arabic model,
// which has real male (fahad, sultan, abdullah) and female (noura, lulwa,
// aisha) voices instead of a robotic fallback.
const GROQ_MODEL = "canopylabs/orpheus-v1-english";
const GROQ_MODEL_AR = "canopylabs/orpheus-arabic-saudi";

const EDGE_TO_GROQ: Record<string, string> = {
  // British
  "en-GB-RyanNeural":              "daniel",
  "en-GB-SoniaNeural":             "diana",
  "en-GB-ThomasNeural":            "daniel",
  "en-GB-LibbyNeural":             "diana",
  "en-GB-MaisieNeural":            "diana",
  "en-GB-NoahNeural":              "daniel",
  "en-GB-OliverNeural":            "daniel",
  "en-GB-AmberNeural":             "diana",
  // American
  "en-US-BrianMultilingualNeural": "troy",
  "en-US-AndrewMultilingualNeural": "troy",
  "en-US-EmmaMultilingualNeural":  "hannah",
  "en-US-AvaMultilingualNeural":   "hannah",
  "en-US-AriaNeural":              "hannah",
  "en-US-JennyNeural":             "hannah",
  "en-US-MichelleNeural":          "hannah",
  "en-US-ChristopherNeural":       "troy",
  "en-US-GuyNeural":               "troy",
  "en-US-EricNeural":              "troy",
  "en-US-RogerNeural":             "troy",
  "en-US-AnaNeural":               "hannah",
};

// Fallback resolver for Edge voice ids not in the table: parse the standard
// "en-XX-NameMaleNeural" / "en-XX-NameFemaleNeural" naming convention and pick
// the matching Orpheus archetype by region + gender.
function resolveGroqVoice(edgeVoice: string): string {
  const direct = EDGE_TO_GROQ[edgeVoice];
  if (direct) return direct;
  const isUK = /(^|-)GB-/.test(edgeVoice) || edgeVoice.includes("en-GB");
  const isFemale = /female/i.test(edgeVoice);
  if (isUK) return isFemale ? "diana" : "daniel";
  return isFemale ? "hannah" : "troy";
}

function splitForGroq(text: string, max = 200): string[] {
  const parts = text.match(/[^.!?؟\n]+[.!?؟]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length <= max) { cur += p; continue; }
    if (cur.trim()) out.push(cur.trim());
    let rest = p;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(" ", max);
      if (cut < 40) cut = max;
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut);
    }
    cur = rest;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean).slice(0, 6);
}

function wavPcm(buf: Buffer) { // returns { fmt: Buffer(first fmt chunk), pcm: Buffer }
  let o = 12, fmtChunk = null;
  while (o + 8 <= buf.length) {
    const id = buf.toString("ascii", o, o + 4);
    let size = buf.readUInt32LE(o + 4);
    if (id === "fmt ") fmtChunk = buf.subarray(o + 8, o + 8 + size);
    if (id === "data") {
      if (size > buf.length - o - 8) size = buf.length - o - 8;
      return { fmt: fmtChunk, pcm: buf.subarray(o + 8, o + 8 + size) };
    }
    o += 8 + size + (size % 2);
  }
  throw new Error("Bad WAV from Groq");
}

// Arabic male/female Orpheus voices (model: orpheus-arabic-saudi)
async function groqSynthesize(text: string, edgeVoice: string): Promise<Buffer> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("GROQ_API_KEY not configured");

  if (Date.now() < groq429Until) throw new Error("Groq rate-limited (breaker open)");
  if (Date.now() < groqDownUntil) throw new Error("Groq marked down (breaker open)");

  const isArabic = /[\u0600-\u06FF]/.test(text);
  const model = isArabic ? GROQ_MODEL_AR : GROQ_MODEL;
  const isFemaleVoice = /female/i.test(edgeVoice);
  const groqVoice = isArabic
    ? (isFemaleVoice ? "noura" : "fahad")
    : resolveGroqVoice(edgeVoice);

  const pieces = splitForGroq(text);
  const wavs = await Promise.all(pieces.map(async (piece) => {
    const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ input: piece, voice: groqVoice, model, response_format: "wav" }),
    });
    if (!r.ok) {
      const errTxt = (await r.text()).slice(0, 150);
      // Free-tier TTS quota exhausts fast — remember it so future requests
      // skip Groq instantly instead of paying the 429 round-trip each time.
      if (r.status === 429) groq429Until = Date.now() + GROQ_429_MS;
      else if (r.status === 400 || r.status === 401) groqDownUntil = Date.now() + GROQ_DOWN_MS;
      throw new Error(`Groq ${r.status}: ${errTxt}`);
    }
    return Buffer.from(await r.arrayBuffer());
  }));
  if (wavs.length === 1) return wavs[0];

  // Multi-piece: decode PCM from each WAV and re-wrap in one WAV
  const parsed = wavs.map(wavPcm);
  const pcm = Buffer.concat(parsed.map((p) => p.pcm));
  const fmt = parsed[0].fmt;
  const header = Buffer.alloc(20 + fmt.length + 8);
  header.write("RIFF", 0);
  header.writeUInt32LE(4 + 8 + fmt.length + 8 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(fmt.length, 16);
  fmt.copy(header, 20);
  header.write("data", 20 + fmt.length);
  header.writeUInt32LE(pcm.length, 24 + fmt.length);
  return Buffer.concat([header, pcm]);
}

// ── 3. Google Translate TTS (no key, always available) ──────────────────────
// translate_tts only accepts ~200 chars per call → split on word boundaries
// and concatenate the MP3 payloads. MP3 frame concatenation is playable by
// every browser <audio> element. The requested Edge voice also decides the
// Google accent (en = American, en-GB = British, en-AU = Australian) and the
// Arabic voice id keeps Arabic rendering even though Orpheus is English-only.

function detectGoogleLang(text: string, voice: string): string {
  if (/[\u0600-\u06FF]/.test(text) || voice.includes("ar-")) return "ar";
  if (voice.includes("en-GB")) return "en-GB";
  if (voice.includes("en-AU")) return "en-AU";
  if (voice.includes("en-IN")) return "en-IN";
  return "en";
}

function splitForGoogle(text: string, max = 190): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= max) { cur = (cur + " " + w).trim(); continue; }
    if (cur) out.push(cur);
    cur = w.slice(0, max);
  }
  if (cur) out.push(cur);
  // 24 pieces ≈ 4.5 KB of text — enough for any paragraph the app sends
  // without truncating the reading mid-sentence.
  return out.filter(Boolean).slice(0, 24);
}

async function googleFetchOne(piece: string, i: number, total: number, lang: string): Promise<Buffer> {
  const url =
    "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob" +
    `&tl=${lang}&q=${encodeURIComponent(piece)}&total=${total}&idx=${i}` +
    `&textlen=${piece.length}&ttsspeed=1`;
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
    },
  });
  if (!r.ok) throw new Error(`Google TTS ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function googleFetchChunks(text: string, lang: string): Promise<Buffer> {
  const pieces = splitForGoogle(text);
  const buffers: Buffer[] = [];
  // Fetch in batches of 6 so long readings don't hammer Google with 20+
  // concurrent requests (which can trip their rate limiter and slow everyone).
  for (let i = 0; i < pieces.length; i += 6) {
    const batch = pieces.slice(i, i + 6);
    buffers.push(...await Promise.all(batch.map((piece, j) => googleFetchOne(piece, i + j, pieces.length, lang))));
  }
  const audio = Buffer.concat(buffers);
  if (audio.length < 500) throw new Error("Google TTS returned empty audio");
  return audio;
}

// ── 2b. Gemini TTS (free GEMINI_API_KEY, studio-grade voices) ────────────────
// Much better quality than Google Translate, but 2.5-3.5 s per utterance and
// rate-limited — so it's reserved for LONG readings (paragraphs), where the
// extra quality is worth the wait and the speed path isn't hurt.
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_429_MS  = 60_000;
const GEMINI_DOWN_MS = 60_000;
let gemini429Until  = 0;
let geminiDownUntil = 0;

function resolveGeminiVoice(voice: string, isArabic: boolean): string {
  const female = /female/i.test(voice);
  if (isArabic) return female ? "Kore" : "Puck";         // prebuilt voices are multilingual
  if (voice.includes("en-GB")) return female ? "Zephyr" : "Charon";
  if (voice.includes("en-AU")) return female ? "Aoede" : "Orbit";
  if (voice.includes("en-IN")) return female ? "Celestia" : "Charon";
  return female ? "Kore" : "Puck";                        // default American pair
}

function pcmToWavGemini(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16): Buffer {
  const dataSize   = pcm.length;
  const byteRate   = sampleRate * channels * bits / 8;
  const blockAlign = channels * bits / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + dataSize, 4);
  h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(byteRate, 28);
  h.writeUInt16LE(blockAlign, 32);
  h.writeUInt16LE(bits, 34);
  h.write("data", 36); h.writeUInt32LE(dataSize, 40);
  return Buffer.concat([h, pcm]);
}

async function geminiSynthesize(text: string, edgeVoice: string): Promise<Buffer> {
  if (Date.now() < gemini429Until) throw new Error("Gemini rate-limited (breaker open)");
  if (Date.now() < geminiDownUntil) throw new Error("Gemini marked down (breaker open)");
  const geminiKey = (process.env["GEMINI_API_KEY"] ?? "").trim();
  if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

  const isArabic = /[\u0600-\u06FF]/.test(text);
  const voiceName = resolveGeminiVoice(edgeVoice, isArabic);
  // Prebuilt voices default to a neutral/American delivery; a style prompt
  // nudges British/Australian pronunciation without any extra latency.
  const accentWord = edgeVoice.includes("en-GB") ? "British" : edgeVoice.includes("en-AU") ? "Australian" : "";
  const instruction = isArabic
    ? `Read this Arabic text aloud naturally: ${text}`
    : accentWord
      ? `Read this text aloud naturally with a ${accentWord} accent: ${text}`
      : `Read this text aloud naturally: ${text}`;

  const r = await fetch(
    `${GEMINI_ENDPOINT}/models/${GEMINI_TTS_MODEL}:generateContent?key=${encodeURIComponent(geminiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    },
  );

  if (!r.ok) {
    const errTxt = (await r.text()).slice(0, 150);
    if (r.status === 429) gemini429Until = Date.now() + GEMINI_429_MS;
    else geminiDownUntil = Date.now() + GEMINI_DOWN_MS;
    throw new Error(`Gemini ${r.status}: ${errTxt}`);
  }

  const data = await r.json();
  const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";
  if (!b64) {
    geminiDownUntil = Date.now() + GEMINI_DOWN_MS;
    throw new Error("Gemini returned no audio");
  }
  return pcmToWavGemini(Buffer.from(b64, "base64"));
}

async function googleSynthesize(text: string, voice: string): Promise<Buffer> {
  // Try the accent the caller asked for first; fall back to the generic
  // language code if Google rejects the regional variant.
  for (const lang of [detectGoogleLang(text, voice), /[\u0600-\u06FF]/.test(text) ? "ar" : "en"]) {
    try {
      return await googleFetchChunks(text, lang);
    } catch (err) {
      const last = detectGoogleLang(text, voice);
      if (last !== "en" && last !== "ar" && lang === last) continue; // accent rejected → retry generic
      if (lang === ( /[\u0600-\u06FF]/.test(text) ? "ar" : "en")) throw err;
      continue;
    }
  }
  throw new Error("Google TTS unavailable");
}

// ── Unified synthesis: engine fallback chain ────────────────────────────────

// Rubric: don't make the user pay Dead-Edge latency on every single request.
// After 2 consecutive Edge failures the breaker "opens" and skips Edge for
// 5 minutes (sounds like a cold caller, costs zero ms). One live request
// slips through occasionally to re-check whether Microsoft fixed things.
const edgeBreaker = { fails: 0, openUntil: 0 };
const EDGE_OPEN_MS   = 5 * 60_000; // 5-minute cooldown
const EDGE_MAX_FAILS = 2;

// Groq sub-breakers: free-tier TTS quota runs out quickly (HTTP 429), but the
// method still works hours later. On 429 we stay away 10 minutes so requests
// don't pay the rejection round-trip; on hard config/auth errors only 60 s.
const GROQ_429_MS  = 10 * 60_000;
const GROQ_DOWN_MS = 60_000;
let groq429Until  = 0;
let groqDownUntil = 0;

function edgeBlocked(): boolean {
  return Date.now() < edgeBreaker.openUntil;
}

function edgeRecordFailure(err: unknown): void {
  edgeBreaker.fails += 1;
  if (edgeBreaker.fails >= EDGE_MAX_FAILS) {
    edgeBreaker.openUntil = Date.now() + EDGE_OPEN_MS;
    edgeBreaker.fails = 0;
  }
}

function edgeRecordSuccess(): void {
  edgeBreaker.fails = 0;
  edgeBreaker.openUntil = 0;
}

async function getAudioAny(
  voice: string,
  input: string,
  log: (obj: unknown, msg: string) => void,
): Promise<{ buf: Buffer; type: string; engine: string }> {
  const key = cacheKey(voice, input);

  const cached = cacheGet(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    // 1. Edge TTS — best quality when the WS endpoint accepts us (breaker skips dead stretches)
    if (!edgeBlocked()) {
      try {
        const buf = await edgeSynthesize(voice, input);
        edgeRecordSuccess();
        const value = { buf, type: "audio/mpeg", engine: "microsoft-edge" };
        cachePut(key, value);
        log({ voice, len: input.length, bytes: buf.length, engine: value.engine }, "TTS via Edge");
        return value;
      } catch (edgeErr) {
        edgeRecordFailure();
        log(
          { err: edgeErr instanceof Error ? edgeErr.message : String(edgeErr), voice },
          "Edge TTS unavailable, trying Groq",
        );
      }
    }

    // 2. Groq Orpheus — free tier; premium English + Arabic voices when quota is available
    try {
      const buf = await groqSynthesize(input, voice);
      const value = { buf, type: "audio/wav", engine: "groq-orpheus" };
      cachePut(key, value);
      log({ voice, len: input.length, bytes: buf.length, engine: value.engine }, "TTS via Groq");
      return value;
    } catch (groqErr) {
      log({ err: groqErr instanceof Error ? groqErr.message : String(groqErr), voice }, "Groq TTS unavailable, trying Google");
    }

    // 2b. Gemini TTS — studio voices; only for long readings where the
    // extra 2-3 s is worth the quality jump over the translate voice.
    if (input.length > 140) {
      try {
        const buf = await geminiSynthesize(input, voice);
        const value = { buf, type: "audio/wav", engine: "gemini-tts" };
        cachePut(key, value);
        log({ voice, len: input.length, bytes: buf.length, engine: value.engine }, "TTS via Gemini");
        return value;
      } catch (gemErr) {
        log({ err: gemErr instanceof Error ? gemErr.message : String(gemErr), voice }, "Gemini TTS unavailable, trying Google");
      }
    }

    // 3. Google Translate TTS — keyless last resort
    try {
      const buf = await googleSynthesize(input, voice);
      const value = { buf, type: "audio/mpeg", engine: "google-translate" };
      cachePut(key, value);
      log({ voice, len: input.length, bytes: buf.length, engine: value.engine }, "TTS via Google");
      return value;
    } catch (gErr) {
      throw new Error(`All TTS engines failed: ${gErr instanceof Error ? gErr.message : String(gErr)}`);
    }
  })();

  inflight.set(key, promise);
  promise.catch(() => {}).finally(() => inflight.delete(key));
  return promise;
}

async function streamTTS(
  text: string,
  voice: string,
  req: Request,
  res: Response,
  rate = "",
): Promise<void> {
  // Build synthesis input — SSML when rate is requested, plain text otherwise
  const input = buildInput(voice, text, rate);

  try {
    const { buf, type, engine } = await getAudioAny(voice, input, (o, m) => req.log?.info(o as object, m));
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    if (engine) res.setHeader("X-TTS-Engine", engine);
    res.end(buf);
  } catch (err) {
    req.log?.error({ err }, "Edge TTS all engines failed");
    if (!res.headersSent) res.status(502).json({ error: "Edge TTS failed." });
    else if (!res.writableEnded) res.end();
  }
}

// ── GET /api/edge-tts  ───────────────────────────────────────────────────────
// Browser <audio src="/api/edge-tts?text=...&voice=..."> plays the audio.

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
// Force-probes Edge for the requested voice and opens the breaker instantly if
// the endpoint is dead. Called by the frontend on load.

router.get("/edge-tts-warmup", async (req: Request, res: Response) => {
  const voice = typeof req.query?.voice === "string"
    ? req.query.voice.trim()
    : VOICE_MALE;

  if (Date.now() < edgeBreaker.openUntil) {
    res.json({ ok: true, voice, edge: "breaker-open" });
    return;
  }

  try {
    const buf = await edgeSynthesize(voice, "Hello.");
    edgeRecordSuccess();
    res.json({ ok: true, voice, edge: "ok", bytes: buf.length });
  } catch (err) {
    edgeRecordFailure();
    res.json({ ok: true, voice, edge: "down" });
  }
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
              const parsed: any = JSON.parse(chunk.toString());
              const items: unknown[] = Array.isArray(parsed?.Metadata) ? parsed.Metadata : [];
              for (const item of items) {
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

// ── Startup self-probe ──────────────────────────────────────────────────────
// Learn immediately whether Microsoft's Edge endpoint accepts us. When it
// doesn't (it has been flaky since late 2025), the breaker opens before any
// real user request arrives — so the very first word of the session doesn't
// pay the dead-Edge latency tax.
let startupProbeDone = false;
async function probeEdgeOnce(): Promise<void> {
  if (startupProbeDone) return;
  startupProbeDone = true;
  try {
    await edgeSynthesize(VOICE_MALE, "Hello.");
    edgeRecordSuccess();
    console.log("[edge-tts] Edge endpoint healthy — will be used first");
  } catch (err) {
    edgeRecordFailure();
    console.log(
      `[edge-tts] Edge endpoint dead at startup (${
        err instanceof Error ? err.message : String(err)
      }) — requests will go straight to Groq/Google`,
    );
  }
}
setTimeout(() => { void probeEdgeOnce(); }, 2000);

export default router;
