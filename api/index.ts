// @ts-nocheck
/**
 * api/index.ts — Vercel Serverless Function
 *
 * Self-contained handler. Does NOT import the full Express app (which uses
 * pino-http worker threads that crash Vercel's bundler). All AI provider
 * logic lives here directly.
 */
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Debug — reports which API keys are configured ─────────────────────────────
app.get("/api/debug", (_req, res) => {
  res.json({
    OPENROUTER_API_KEY:   !!(process.env.OPENROUTER_API_KEY),
    GEMINI_API_KEY:       !!(process.env.GEMINI_API_KEY),
    DEEPSEEK_API_KEY:     !!(process.env.DEEPSEEK_API_KEY),
    POLLINATIONS_API_KEY: !!(process.env.POLLINATIONS_API_KEY),
    GROQ_API_KEY:         !!(process.env.GROQ_API_KEY),
    NODE_ENV:             process.env.NODE_ENV,
  });
});

// ── AI clients ────────────────────────────────────────────────────────────────
const groqKey     = (process.env.GROQ_API_KEY         ?? "").trim();
const geminiKey   = (process.env.GEMINI_API_KEY        ?? "").trim();
const orKey       = (process.env.OPENROUTER_API_KEY    ?? "").trim();
const deepseekKey = (process.env.DEEPSEEK_API_KEY      ?? "").trim();
const pollKey     = (process.env.POLLINATIONS_API_KEY  ?? "").trim();

const groqClient = groqKey   ? new OpenAI({ apiKey: groqKey,   baseURL: "https://api.groq.com/openai/v1" }) : null;
const genAI      = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const orClient   = orKey     ? new OpenAI({
  apiKey: orKey, baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: { "HTTP-Referer": "https://venoxai.vercel.app", "X-Title": "Venoxa AI Platform" },
}) : null;
const dsClient   = deepseekKey ? new OpenAI({ apiKey: deepseekKey, baseURL: "https://api.deepseek.com" }) : null;
const pollClient = pollKey      ? new OpenAI({ apiKey: pollKey,     baseURL: "https://gen.pollinations.ai" }) : null;

const OR_MODELS = [
  "liquid/lfm-2.5-1.2b-instruct:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

function buildMessages(prompt) {
  const match = prompt.match(/^(.*?)\s*User said:\s*"([^"]*)"\s*(?:Output the reply text ONLY.*)?\s*$/s);
  if (match) return [{ role: "system", content: match[1].trim() }, { role: "user", content: match[2].trim() }];
  return [{ role: "user", content: prompt }];
}

async function streamFromAI(prompt, onChunk, maxTokens = 512) {
  const messages = buildMessages(prompt);

  // 1. Groq — fastest
  if (groqClient) {
    try {
      const stream = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile", messages, max_tokens: maxTokens, stream: true,
      });
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta?.content;
        if (d) onChunk(d);
      }
      return;
    } catch (e) { console.warn("Groq failed:", e.message); }
  }

  // 2. Gemini
  if (genAI) {
    try {
      const systemMsg = messages.find(m => m.role === "system");
      const userMsg   = messages[messages.length - 1].content;
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemMsg?.content,
      });
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: userMsg }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      });
      for await (const chunk of result.stream) {
        const t = chunk.text();
        if (t) onChunk(t);
      }
      return;
    } catch (e) { console.warn("Gemini failed:", e.message); }
  }

  // 3. OpenRouter — try each model
  if (orClient) {
    for (const model of OR_MODELS) {
      try {
        const stream = await orClient.chat.completions.create({
          model, messages, max_completion_tokens: maxTokens, stream: true, temperature: 0.7,
        });
        for await (const chunk of stream) {
          const d = chunk.choices?.[0]?.delta?.content;
          if (d) onChunk(d);
        }
        return;
      } catch (e) { console.warn(`OpenRouter ${model} failed:`, e.message); }
    }
  }

  // 4. DeepSeek
  if (dsClient) {
    try {
      const stream = await dsClient.chat.completions.create({
        model: "deepseek-chat", messages, max_tokens: maxTokens, stream: true,
      });
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta?.content;
        if (d) onChunk(d);
      }
      return;
    } catch (e) { console.warn("DeepSeek failed:", e.message); }
  }

  // 5. Pollinations
  if (pollClient) {
    try {
      const stream = await pollClient.chat.completions.create({
        model: "openai", messages, max_tokens: maxTokens, stream: true,
      });
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta?.content;
        if (d) onChunk(d);
      }
      return;
    } catch (e) { console.warn("Pollinations failed:", e.message); }
  }

  throw new Error("All AI providers failed or are unconfigured.");
}

// ── Response cache ────────────────────────────────────────────────────────────
const cache = new Map();
function getCached(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { cache.delete(key); return null; }
  return e.text;
}
function setCache(key, text) {
  if (cache.size >= 500) cache.delete(cache.keys().next().value);
  cache.set(key, { text, exp: Date.now() + 5 * 60000 });
}

// ── POST /api/chat/stream  (SSE) ──────────────────────────────────────────────
app.post("/api/chat/stream", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) { res.status(400).json({ error: "Missing 'prompt'" }); return; }
  const maxTokens = Math.min(typeof req.body?.maxTokens === "number" ? req.body.maxTokens : 256, 2048);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const hit = getCached(prompt);
  if (hit) { send("delta", hit); send("done", ""); res.end(); return; }

  try {
    let full = "";
    await streamFromAI(prompt, (d) => { full += d; send("delta", d); }, maxTokens);
    if (full.trim()) setCache(prompt, full);
    send("done", "");
  } catch (err) {
    console.error("Chat stream error:", err);
    send("error", "AI request failed. Please try again.");
  }
  res.end();
});

// ── POST /api/chat  (non-streaming) ──────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) { res.status(400).json({ error: "Missing 'prompt'" }); return; }
  const maxTokens = Math.min(typeof req.body?.maxTokens === "number" ? req.body.maxTokens : 256, 2048);

  const hit = getCached(prompt);
  if (hit) { res.json({ text: hit }); return; }

  try {
    let text = "";
    await streamFromAI(prompt, (d) => { text += d; }, maxTokens);
    if (!text.trim()) throw new Error("Empty response from AI.");
    setCache(prompt, text);
    res.json({ text });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(502).json({ error: "AI request failed. Please try again." });
  }
});

// ── GET /api/image ────────────────────────────────────────────────────────────
app.get("/api/image", async (req, res) => {
  const prompt = typeof req.query.prompt === "string" ? req.query.prompt.trim() : "";
  if (!prompt) { res.status(400).json({ error: "Missing 'prompt'" }); return; }
  const seed   = req.query.seed   ?? String(Math.floor(Math.random() * 1e6));
  const model  = req.query.model  ?? "flux";
  const width  = req.query.width  ?? "640";
  const height = req.query.height ?? "420";
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=${model}`;
  try {
    const r = await fetch(pollUrl, { signal: AbortSignal.timeout(25000) });
    if (!r.ok) throw new Error(`Pollinations ${r.status}`);
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buf = await r.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    console.warn("Image proxy failed, redirecting:", err.message);
    res.redirect(pollUrl);
  }
});

// ── GET /api/config ───────────────────────────────────────────────────────────
app.get("/api/config", (_req, res) => {
  const key = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  res.json({ elevenLabsApiKey: key && key !== "your_api_key_here" ? key : "" });
});

// ── GET /api/gemini-tts ───────────────────────────────────────────────────────
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const VOICE_MAP = {
  puck: "Puck", charon: "Charon", fenrir: "Fenrir", orbit: "Orbit",
  aoede: "Aoede", kore: "Kore", zephyr: "Zephyr", celestia: "Celestia",
};
function pcmToWav(pcm, sr = 24000, ch = 1, bits = 16) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * ch * bits / 8, 28);
  h.writeUInt16LE(ch * bits / 8, 32); h.writeUInt16LE(bits, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
app.get("/api/gemini-tts", async (req, res) => {
  const text  = typeof req.query.text  === "string" ? req.query.text.trim()         : "";
  const voice = typeof req.query.voice === "string" ? req.query.voice.toLowerCase() : "puck";
  if (!text)    { res.status(400).json({ error: "Missing 'text'" }); return; }
  if (!geminiKey) { res.status(503).json({ error: "GEMINI_API_KEY not set" }); return; }
  const voiceName = VOICE_MAP[voice] ?? "Puck";
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${geminiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `Read this text aloud naturally: ${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
      }),
    });
    if (!r.ok) { const e = await r.text(); res.status(502).json({ error: `Gemini TTS ${r.status}: ${e.slice(0, 200)}` }); return; }
    const data = await r.json();
    const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";
    if (!b64) { res.status(502).json({ error: "Gemini TTS returned no audio" }); return; }
    const wav = pcmToWav(Buffer.from(b64, "base64"));
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(wav);
  } catch (err) { console.error("Gemini TTS error:", err); res.status(502).json({ error: "Gemini TTS error" }); }
});

// ── GET /api/groq-tts ─────────────────────────────────────────────────────────
app.get("/api/groq-tts", async (req, res) => {
  const text  = typeof req.query.text  === "string" ? req.query.text.trim()  : "";
  const voice = typeof req.query.voice === "string" ? req.query.voice.trim() : "adam";
  if (!text)    { res.status(400).json({ error: "Missing 'text'" }); return; }
  if (!groqKey) { res.status(503).json({ error: "GROQ_API_KEY not configured" }); return; }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ input: text, voice, model: "canopylabs/orpheus-v1-english", response_format: "wav" }),
    });
    if (!r.ok) throw new Error(`Groq TTS ${r.status}`);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const buf = await r.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) { console.error("Groq TTS error:", err); res.status(502).json({ error: "Groq TTS failed" }); }
});

// ── GET /api/edge-tts ─────────────────────────────────────────────────────────
// Now recreated to use Gemini TTS instead of Edge voice to ensure full compatibility on Vercel.
app.get('/api/edge-tts', async (req: Request, res: Response) => {
  const text  = typeof req.query.text === 'string' ? req.query.text.trim() : '';
  const voice = typeof req.query.voice === 'string' ? req.query.voice.trim() : '';

  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  if (!geminiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY not set' });
    return;
  }

  // Voice mapping from Edge to Gemini
  // en-US-AvaMultilingualNeural -> aoede (Female)
  // en-GB-SoniaNeural -> kore (Female)
  // en-US-BrianMultilingualNeural -> puck (Male)
  // en-GB-RyanNeural -> charon (Male)
  const voiceLower = voice.toLowerCase();
  let geminiVoice = 'puck'; // Default
  if (voiceLower.includes('female') || voiceLower.includes('ava') || voiceLower.includes('sonia')) {
    geminiVoice = voiceLower.includes('sonia') ? 'kore' : 'aoede';
  } else if (voiceLower.includes('male') || voiceLower.includes('brian') || voiceLower.includes('ryan')) {
    geminiVoice = voiceLower.includes('ryan') ? 'charon' : 'puck';
  } else {
    // If client is already passing a Gemini voice (or anything else), try to match or map
    geminiVoice = VOICE_MAP[voiceLower] ? voiceLower : 'puck';
  }

  const voiceName = VOICE_MAP[geminiVoice] ?? 'Puck';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${geminiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `Read this text aloud naturally: ${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
      }),
    });
    if (!r.ok) {
      const e = await r.text();
      res.status(502).json({ error: `Gemini TTS ${r.status}: ${e.slice(0, 200)}` });
      return;
    }
    const data = await r.json();
    const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? '';
    if (!b64) {
      res.status(502).json({ error: "Gemini TTS returned no audio" });
      return;
    }
    const wav = pcmToWav(Buffer.from(b64, "base64"));
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(wav);
  } catch (err) {
    console.error("[edge-tts-gemini-fallback] error:", err);
    res.status(502).json({ error: "Gemini TTS error via Edge TTS alias" });
  }
});

app.post("/api/edge-tts",       (_req, res) => res.status(405).json({ error: "Use GET /api/edge-tts" }));
app.post("/api/edge-tts-timed", (_req, res) => res.status(503).json({ error: "Edge TTS timed unavailable in serverless mode." }));

// ── Warmup endpoint ───────────────────────────────────────────────────────────
app.get('/api/edge-tts-warmup', (_req: Request, res: Response) => {
  res.status(204).end();
});

// ── GET /api/voices / POST /api/tts/stream (ElevenLabs) ──────────────────────
app.get("/api/voices", async (_req, res) => {
  const key = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!key) { res.status(503).json({ error: "ELEVENLABS_API_KEY not configured" }); return; }
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
    if (!r.ok) { res.status(r.status).json({ error: `ElevenLabs ${r.status}` }); return; }
    const data = await r.json();
    res.json({
      voices: (data.voices ?? []).map(v => ({
        voice_id: v.voice_id, name: v.name, category: v.category ?? "generated",
        accent: v.labels?.accent ?? "", description: v.labels?.description ?? "", preview_url: v.preview_url ?? "",
      })),
    });
  } catch (err) { res.status(502).json({ error: "Failed to fetch voices" }); }
});

app.post("/api/tts/stream", async (req, res) => {
  const textToSpeak = typeof req.body?.textToSpeak === "string" ? req.body.textToSpeak.trim() : "";
  if (!textToSpeak) { res.status(400).json({ error: "Missing 'textToSpeak'" }); return; }
  const key = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!key) { res.status(503).json({ error: "ELEVENLABS_API_KEY not configured" }); return; }
  const voiceId = typeof req.body?.selectedVoiceId === "string" ? req.body.selectedVoiceId.trim() : "pNInz6obpgDQGcFmaJgB";
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: textToSpeak, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.2, similarity_boost: 0.9, style: 0.45, use_speaker_boost: true } }),
    });
    if (!r.ok) { const e = await r.text(); res.status(r.status).json({ error: `ElevenLabs TTS error: ${e.slice(0, 300)}` }); return; }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    const buf = await r.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) { res.status(502).json({ error: "TTS streaming failed" }); }
});

// ── GET /api/kokoro-tts ───────────────────────────────────────────────────────
app.get("/api/kokoro-tts", (_req, res) => {
  res.status(503).json({ error: "Kokoro TTS is only available when running locally." });
});

export default app;
