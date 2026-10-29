// @ts-nocheck
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import WebSocket from "ws";
import crypto from "node:crypto";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { createLevelTestRouter } from "../lib/level-test-server";

// ── Database setup (inline for Vercel serverless) ────────────────────────────
const dbUrl = (process.env.DATABASE_URL ?? "").trim();
const JWT_SECRET = process.env.JWT_SECRET || "venoxa-default-fallback-secret-key-2026-secure-hashing";

// Users table schema (mirrors lib/db/src/schema/users.ts)
const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  username: text("username").default("New Learner").notNull(),
  avatar: text("avatar"),
  dob: text("dob"),
  gender: text("gender"),
  languages: jsonb("languages").$type<string[]>().default(["English"]).notNull(),
  plan: text("plan").default("basic plan").notNull(),
  xp: integer("xp").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastActive: timestamp("last_active"),
  dailyGoalMins: integer("daily_goal_mins").default(15).notNull(),
  level: text("level").default("A1").notNull(),
  rank30Days: integer("rank_30_days").default(29336).notNull(),
  streakRank: integer("streak_rank").default(601).notNull(),
  completedCells: jsonb("completed_cells").$type<Record<string, string>>().default({}).notNull(),
  usageTime: jsonb("usage_time").$type<Record<string, number>>().default({}).notNull(),
  calendarDays: jsonb("calendar_days").$type<string[]>().default([]).notNull(),
  achievements: jsonb("achievements").$type<string[]>().default([]).notNull(),
  globalVocab: jsonb("global_vocab").$type<any[]>().default([]).notNull(),
  phrasalVocab: jsonb("phrasal_vocab").$type<any[]>().default([]).notNull(),
  idiomsVocab: jsonb("idioms_vocab").$type<any[]>().default([]).notNull(),
  idiomsProperVocab: jsonb("idioms_proper_vocab").$type<any[]>().default([]).notNull(),
  langeekVocab: jsonb("langeek_vocab").$type<any[]>().default([]).notNull(),
  srsData: jsonb("srs_data").$type<Record<string, any>>().default({}).notNull(),
  langeekSrsData: jsonb("langeek_srs_data").$type<Record<string, any>>().default({}).notNull(),
  phrasalSrs: jsonb("phrasal_srs").$type<Record<string, any>>().default({}).notNull(),
  idiomsSrs: jsonb("idioms_srs").$type<Record<string, any>>().default({}).notNull(),
  idiomsProperSrs: jsonb("idioms_proper_srs").$type<Record<string, any>>().default({}).notNull(),
  speakingHistory: jsonb("speaking_history").$type<any[]>().default([]).notNull(),
  writingHistory: jsonb("writing_history").$type<any[]>().default([]).notNull(),
  planConfig: jsonb("plan_config").$type<Record<string, any>>().default({}).notNull(),
  studiedWords: jsonb("studied_words").$type<string[]>().default([]).notNull(),
  translationHistory: jsonb("translation_history").$type<any[]>().default([]).notNull(),
  translationFavorites: jsonb("translation_favorites").$type<any[]>().default([]).notNull(),
  savedWords: jsonb("saved_words").$type<any[]>().default([]).notNull(),
  savedIdioms: jsonb("saved_idioms").$type<any[]>().default([]).notNull(),
  toneRewriterFavorites: jsonb("tone_rewriter_favorites").$type<any[]>().default([]).notNull(),
  toneRewriterHistory: jsonb("tone_rewriter_history").$type<any[]>().default([]).notNull(),
  sentenceDiagrammerFavorites: jsonb("sentence_diagrammer_favorites").$type<any[]>().default([]).notNull(),
  sentenceDiagrammerHistory: jsonb("sentence_diagrammer_history").$type<any[]>().default([]).notNull(),
  wordFamilyFavorites: jsonb("word_family_favorites").$type<any[]>().default([]).notNull(),
  wordFamilyHistory: jsonb("word_family_history").$type<any[]>().default([]).notNull(),
  collocationFavorites: jsonb("collocation_favorites").$type<any[]>().default([]).notNull(),
  collocationHistory: jsonb("collocation_history").$type<any[]>().default([]).notNull(),
  etymologyFavorites: jsonb("etymology_favorites").$type<any[]>().default([]).notNull(),
  etymologyHistory: jsonb("etymology_history").$type<any[]>().default([]).notNull(),
  pronBookmarks: jsonb("pron_bookmarks").$type<any[]>().default([]).notNull(),
  pronCompleted: jsonb("pron_completed").$type<any[]>().default([]).notNull(),
  testSessions: jsonb("test_sessions").$type<any[]>().default([]).notNull(),
  listeningHistory: jsonb("listening_history").$type<any[]>().default([]).notNull(),
  listeningFavorites: jsonb("listening_favorites").$type<any[]>().default([]).notNull(),
  readingHistory: jsonb("reading_history").$type<any[]>().default([]).notNull(),
  readingFavorites: jsonb("reading_favorites").$type<any[]>().default([]).notNull(),
  speakingFavorites: jsonb("speaking_favorites").$type<any[]>().default([]).notNull(),
  wordOfDayHistory: jsonb("word_of_day_history").$type<any[]>().default([]).notNull(),
  idiomOfDayHistory: jsonb("idiom_of_day_history").$type<any[]>().default([]).notNull(),
  customGlobalVocab: jsonb("custom_global_vocab").$type<any[]>().default([]).notNull(),
  customPhrasalVocab: jsonb("custom_phrasal_vocab").$type<any[]>().default([]).notNull(),
  customIdiomsVocab: jsonb("custom_idioms_vocab").$type<any[]>().default([]).notNull(),
  customIdiomsProperVocab: jsonb("custom_idioms_proper_vocab").$type<any[]>().default([]).notNull(),
  customLangeekVocab: jsonb("custom_langeek_vocab").$type<any[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lazy DB pool — only created if DATABASE_URL is configured
let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!dbUrl) return null;
  if (!_pool) {
    _pool = new pg.Pool({ connectionString: dbUrl });
    _db = drizzle(_pool, { schema: { usersTable } });
  }
  return _db;
}

// Pool for the level-test router (shared implementation in lib/).
function getLevelTestPool(): pg.Pool | null {
  if (!dbUrl) return null;
  if (!_pool) {
    _pool = new pg.Pool({ connectionString: dbUrl });
    _db = drizzle(_pool, { schema: { usersTable } });
  }
  return _pool;
}

// ── Crypto helpers (inline for Vercel) ───────────────────────────────────────
function base64url(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64urlDecode(str: string): string {
  let b = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return Buffer.from(b, "base64").toString("utf8");
}
function signToken(payload: { userId: number }): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
  return `${signatureInput}.${signature}`;
}
function verifyToken(token: string): { userId: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}
function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
  } catch { return false; }
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) { res.status(401).json({ error: "Access denied. No token provided." }); return; }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid or expired token." }); return; }
  req.user = { id: decoded.userId };
  next();
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Venoxa Level Test — adaptive CEFR placement test.
// Same router as artifacts/api-server; auth is verified against Supabase.
const levelTestPool = getLevelTestPool();
if (levelTestPool) {
  app.use(
    "/api/level-test",
    createLevelTestRouter({
      pool: levelTestPool,
      allowDraft: process.env.LEVEL_TEST_ALLOW_DRAFT === "1",
      appBaseUrl: process.env.LEVEL_TEST_VERIFY_BASE_URL,
    }),
  );
}

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
    AZURE_SPEECH_KEY:     !!(process.env.AZURE_SPEECH_KEY),
    AZURE_SPEECH_REGION:  process.env.AZURE_SPEECH_REGION ?? null,
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
const pollClient = pollKey      ? new OpenAI({ apiKey: pollKey,     baseURL: "https://gen.pollinations.ai/v1" }) : null;

const OR_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
  "thinkingmachines/inkling:free",
  "poolside/laguna-s-2.1:free",
  "poolside/laguna-xs-2.1:free",
  "meta-llama/llama-3.2-3b-instruct",
  "google/gemini-2.5-flash",
];

function buildMessages(prompt) {
  const match = prompt.match(/^(.*?)\s*User said:\s*"([^"]*)"\s*(?:Output the reply text ONLY.*)?\s*$/s);
  if (match) return [{ role: "system", content: match[1].trim() }, { role: "user", content: match[2].trim() }];
  return [{ role: "user", content: prompt }];
}

async function streamFromAI(prompt, onChunk, maxTokens = 512) {
  const messages = buildMessages(prompt);

  // 1. Groq — ultra-fast
  if (groqClient) {
    const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    for (const model of groqModels) {
      try {
        const stream = await groqClient.chat.completions.create({
          model, messages, max_tokens: maxTokens, stream: true,
        });
        for await (const chunk of stream) {
          const d = chunk.choices[0]?.delta?.content;
          if (d) onChunk(d);
        }
        return;
      } catch (e) { console.warn(`Groq ${model} failed:`, e.message); }
    }
  }

  // 2. Gemini
  if (genAI) {
    const geminiModels = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
    const systemMsg = messages.find(m => m.role === "system");
    const userMsg   = messages[messages.length - 1].content;
    for (const modelName of geminiModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
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
      } catch (e) { console.warn(`Gemini ${modelName} failed:`, e.message); }
    }
  }

  // 3. Pollinations
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

  // 4. OpenRouter — try each model
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

  // 5. DeepSeek
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
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Disable ALL proxy/CDN buffering so tokens reach the browser immediately.
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Content-Type-Options", "nosniff");
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
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.end(wav);
  } catch (err) { console.error("Gemini TTS error:", err); res.status(502).json({ error: "Gemini TTS error" }); }
});

// ── GET /api/groq-tts ─────────────────────────────────────────────────────────
const GROQ_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"];
app.get("/api/groq-tts", async (req, res) => {
  const text  = typeof req.query.text  === "string" ? req.query.text.trim().slice(0, 200) : ""; // Orpheus limit: 200 chars
  const v     = typeof req.query.voice === "string" ? req.query.voice.trim().toLowerCase()  : "";
  const voice = GROQ_VOICES.includes(v) ? v : "troy";
  if (!text)    { res.status(400).json({ error: "Missing 'text'" }); return; }
  if (!groqKey) { res.status(503).json({ error: "GROQ_API_KEY not configured" }); return; }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ input: text, voice, model: "canopylabs/orpheus-v1-english", response_format: "wav" }),
    });
    if (!r.ok) { const e = await r.text(); console.error("Groq TTS", r.status, e.slice(0, 300)); res.status(502).json({ error: `Groq TTS ${r.status}: ${e.slice(0, 200)}` }); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.end(buf);
  } catch (err) { console.error("Groq TTS error:", err); res.status(502).json({ error: "Groq TTS failed" }); }
});

// ── Groq speech helper (used as the primary/fallback engine for /api/edge-tts) ─
// Edge TTS is blocked from Vercel's IPs, so Groq (Orpheus) does the speaking.
const EDGE_TO_GROQ = {
  "en-US-BrianMultilingualNeural": "troy", "en-US-AndrewMultilingualNeural": "austin",  "en-GB-RyanNeural": "daniel",
  "en-US-AvaMultilingualNeural":   "hannah", "en-GB-SoniaNeural": "diana",
};
function splitForGroq(text, max = 200) {
  const parts = text.match(/[^.!?؟\n]+[.!?؟]*\s*/g) ?? [text];
  const out = []; let cur = "";
  for (const p of parts) {
    if ((cur + p).length <= max) { cur += p; continue; }
    if (cur.trim()) out.push(cur.trim());
    let rest = p;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(" ", max); if (cut < 40) cut = max;
      out.push(rest.slice(0, cut).trim()); rest = rest.slice(cut);
    }
    cur = rest;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean).slice(0, 12);
}
function wavPcm(buf) { // returns { fmt: Buffer(first 12+fmt chunk), pcm: Buffer }
  let o = 12, fmtChunk = null;
  while (o + 8 <= buf.length) {
    const id = buf.toString("ascii", o, o + 4); let size = buf.readUInt32LE(o + 4);
    if (id === "fmt ") fmtChunk = buf.subarray(o + 8, o + 8 + size);
    if (id === "data") { if (size > buf.length - o - 8) size = buf.length - o - 8; return { fmt: fmtChunk, pcm: buf.subarray(o + 8, o + 8 + size) }; }
    o += 8 + size + (size % 2);
  }
  throw new Error("Bad WAV from Groq");
}
async function groqSpeak(text, groqVoice) {
  if (!groqKey) throw new Error("GROQ_API_KEY not configured");
  const pieces = splitForGroq(text);
  const fetchPiece = async (piece) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({ input: piece, voice: groqVoice, model: "canopylabs/orpheus-v1-english", response_format: "wav" }),
      });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      // Rate-limited / transient error → wait and retry (this was a cause of "sometimes no audio")
      if ((r.status === 429 || r.status >= 500) && attempt < 2) {
        const ra = Number(r.headers.get("retry-after"));
        await new Promise((res) => setTimeout(res, Math.min(4000, ra > 0 ? ra * 1000 : 700 * (attempt + 1))));
        continue;
      }
      throw new Error(`Groq ${r.status}: ${(await r.text()).slice(0, 150)}`);
    }
  };
  // At most 3 requests in flight at once, order preserved.
  const wavs = new Array(pieces.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, pieces.length) }, async () => {
    while (next < pieces.length) { const i = next++; wavs[i] = await fetchPiece(pieces[i]); }
  }));
  if (wavs.length === 1) return wavs[0];
  const parsed = wavs.map(wavPcm);
  const pcm = Buffer.concat(parsed.map((p) => p.pcm));
  const fmt = parsed[0].fmt;
  const header = Buffer.alloc(20 + fmt.length + 8);
  header.write("RIFF", 0); header.writeUInt32LE(4 + 8 + fmt.length + 8 + pcm.length, 4);
  header.write("WAVE", 8); header.write("fmt ", 12); header.writeUInt32LE(fmt.length, 16);
  fmt.copy(header, 20); header.write("data", 20 + fmt.length); header.writeUInt32LE(pcm.length, 24 + fmt.length);
  return Buffer.concat([header, pcm]);
}


// ════════ Microsoft Edge read-aloud client (v2 token protocol, from api-server) ════════
/**
 * edge-drm.ts — Microsoft Edge TTS v2 DRM token generator.
 *
 * Faithful JS port of rany2/edge-tts >= 7.3.0 (drm.py), the version that made
 * the read-aloud service work again in Oct 2026. The service validates a
 * short-lived anti-abuse token:
 *
 *   Sec-MS-GEC-Version: 2-143.0.3650.75
 *   Sec-MS-GEC:         "<16 hex CS64>-<64 hex obfuscated-SHA256>"
 *
 * Both digests are computed over "<100ns file-time ticks rounded down to a
 * 5-minute window><TRUSTED_CLIENT_TOKEN>". The SHA-256 is deliberately
 * obfuscated (truncated sigma rotations, adjusted round constants / initial
 * state) and the 16-hex part is a CRC-like "CS64" keyed by the first 8 digest
 * bytes. Every arithmetic step is masked to u32 exactly like the reference so
 * the overflow semantics match bit-for-bit.
 */

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WIN_EPOCH = 11644473600;
const U32 = 0xffffffffn;
const MASKER = (x) => BigInt.asUintN(32, x);
const B32 = (n) => (typeof n === "bigint" ? BigInt.asUintN(32, n) : BigInt(n >>> 0));

// ── Verified constant tables (drm.py:23-150) ────────────────────────────────
const SHA256_INITIAL = [
  0x6a09e667n, 0xbb67ae85n, 0x3c6ef372n, 0xa54ff53an,
  0x510e527fn, 0x9b05688cn, 0x1f83d9abn, 0x5be0cd19n,
];
const SHA256_STATE = [
  0xfd9fbea2n, 0x91243ce7n, 0xbe499094n, 0xcd2e1e0an,
  0x6c006f49n, 0x04bd35abn, 0xfeb0a7e4n, 0x03effbd2n,
];
const SHA256_SCHEDULE = [
  0xeb24bf9en, 0x1558691fn, 0xa0c09ee2n, 0x0cfa32ban,
  0xa622ee8cn, 0xd1dd9491n, 0xc0dd25a0n, 0xf9e70ab6n,
  0xf0c31573n, 0x7058ce4en, 0x7188e606n, 0x00e5ab33n,
  0xd258b060n, 0x72766564n,
];
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n,
  0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n,
  0xd807aa98n, 0x12835b01n, 0x243185ben, 0x550c7dc3n,
  0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n,
  0xe49b69c1n, 0xefbe4786n, 0x0fc19dc6n, 0x240ca1ccn,
  0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan,
  0x983e5152n, 0xa831c66dn, 0xb00327c8n, 0xbf597fc7n,
  0xc6e00bf3n, 0xd5a79147n, 0x06ca6351n, 0x14292967n,
  0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n,
  0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n,
  0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n,
  0xd192e819n, 0xd6990624n, 0xf40e3585n, 0x106aa070n,
  0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n,
  0x391c0cb3n, 0x4ed8aa4an, 0x5b9cca4fn, 0x682e6ff3n, 0x748f82een,
  0x78a5636fn, 0x84c87814n, 0x8cc70208n, 0x90befffan,
  0xa4506cebn, 0xbef9a3f7n, 0xc67178f2n,
];
const SHA256_ADJUSTMENT = 0xc9dc06a7n;
const SHA256_BLOCK_CONSTANTS = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15),
];
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80n;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0n;

const CS64_COEFFICIENTS = [
  [0xe82e91b1n, 0xb32700d0n], [0x44de24c6n, 0x88dff51dn],
  [0x3beb65bcn, 0x29514038n], [0xc89c5933n, 0xb328cbdfn],
  [0x8d1ec211n, 0xd405b4d5n], [0x314ef5d5n, 0x26e55f3cn],
  [0xe92491b1n, 0x607801c6n], [0xf0a5b9d5n, 0x82b2c1fbn],
  [0x06064cf3n, 0xfa51a3dan], [0xda79fa60n, 0x207cc464n],
  [0xbed20560n, 0x3c3c74f3n], [0x89f9c9f8n, 0xd2d14b61n],
  [0x35fa38c6n, 0xbb04a2c1n], [0xcb49e3c6n, 0xc5626167n],
];
const CS64_FACTOR = 0x82893933n;
const CS64_ADJUSTMENT0 = 0xf2f90b1an;
const CS64_ADJUSTMENT1 = 0x0b1a0000n;

// ── helpers ─────────────────────────────────────────────────────────────────

/** Rotate a masked u32 left by 16 bits — drm.py:_rol16. */
function rol16(value) {
  return MASKER((value << 16n) | (value >> 16n));
}

/** LE-u32 words of data, zero-padded to even count — drm.py:_words_le4_even. */
function wordsLE4Even(data) {
  const padLen = ((-data.length) % 4 + 4) % 4;
  const padded = data.length || padLen ? Buffer.concat([data, Buffer.alloc(padLen)]) : data;
  if (padded.length === 0) return [];
  const words = [];
  for (let i = 0; i < padded.length; i += 4) words.push(B32(padded.readUInt32LE(i)));
  if (words.length % 2) words.push(0n);
  return words;
}

/** Truncated small-sigma-zero — drm.py:_sigma0. */
function sigma0(v) {
  return MASKER((v >> 7n) ^ (v << 25n) ^ (v >> 18n) ^ (v << 14n) ^ (v >> 3n));
}

/** Truncated small-sigma-one — drm.py:_sigma1. */
function sigma1(v) {
  return MASKER((v >> 17n) ^ (v << 15n) ^ (v >> 19n) ^ (v << 13n) ^ (v >> 10n));
}

/**
 * SHA-256 rounds, obfuscated — drm.py:_sha256_rounds.
 *
 * e * 2^32 + e repeats e across all 64 bits, so right shifts see ROTR-x's low
 * 32 bits (high bits are masked off afterwards — the reference never masks
 * these intermediate sums either; the masks are applied on the assignments).
 *
 * Rounds in [firstRound, aligned) use plain register roles (only ever the two
 * resumed rounds 14/15). Rounds at every multiple-of-8 boundary from `aligned`
 * use the reference's rotation-in-names scheme; for sub-round r of a block the
 * registers involved are rotated by r, which the index arithmetic below
 * reproduces exactly.
 */
function sha256Rounds(stateIn, words, firstRound = 0) {
  const W = (i) => B32(Number(words[i]));
  const K = (i) => BigInt(constants[i]);
  let constants = SHA256_ROUND_CONSTANTS;
  if (firstRound === 14) constants = SHA256_BLOCK_CONSTANTS;
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8);

  // Plain-role rounds (drm.py:199-210)
  let [a, b, c, d, e, f, g, h] = stateIn;
  for (let i = firstRound; i < aligned; i++) {
    const re = B32(e) * 0x100000001n;
    const ra = B32(a) * 0x100000001n;
    const t1 = MASKER(
      B32(h)
      + (MASKER((re >> 6n)) ^ MASKER(re >> 11n) ^ MASKER(re >> 25n))
      + (B32(g) ^ (B32(e) & (B32(f) ^ B32(g))))
      + K(i)
      + W(i),
    );
    const t2 = MASKER(
      (MASKER(ra >> 2n) ^ MASKER(ra >> 13n) ^ MASKER(ra >> 22n))
      + (MASKER(B32(a) & B32(b)) | MASKER(B32(c) & (B32(a) | B32(b)))),
    );
    const newA = MASKER(t1 + t2);
    const newE = MASKER(B32(d) + t1);
    [a, b, c, d, e, f, g, h] = [newA, a, b, c, newE, e, f, g];
  }

  // Rotated-role blocks (drm.py:214-334). reg[] index map per sub-round r:
  //   sigma input  = (4 - r) mod 8   ... [4:e, 3:d, 2:c, 1:b, 0:a, 7:h, 6:g, 5:f]
  //   sigma-a rot  = (-r) mod 8      ... [0:a, 7:h, 6:g, 5:f, 4:e, 3:d, 2:c, 1:b]
  //   t1 h-term & final assignment = (7 - r) mod 8
  //   += t1 assignment             = (3 - r) mod 8
  const reg = [a, b, c, d, e, f, g, h];
  for (let i0 = aligned; i0 < 64; i0 += 8) {
    for (let r = 0; r < 8; r++) {
      const sigIdx = (4 - r + 8) % 8;
      const chE = sigIdx, chF = (sigIdx + 1) % 8, chG = (sigIdx + 2) % 8;
      const raIdx = (8 - r) % 8;
      const majA = raIdx, majB = (raIdx + 1) % 8, majC = (raIdx + 2) % 8;
      const sumIdx = (7 - r + 8) % 8;
      const addIdx = (3 - r + 8) % 8;
      const wi = i0 + r;

      const re = B32(reg[sigIdx]) * 0x100000001n;
      const ra = B32(reg[raIdx]) * 0x100000001n;
      const t1 = MASKER(
        B32(reg[sumIdx])
        + (MASKER(re >> 6n) ^ MASKER(re >> 11n) ^ MASKER(re >> 25n))
        + (B32(reg[chG]) ^ (B32(reg[chE]) & (B32(reg[chF]) ^ B32(reg[chG]))))
        + K(wi)
        + W(wi),
      );
      reg[addIdx] = MASKER(B32(reg[addIdx]) + t1);
      reg[sumIdx] = MASKER(
        t1
        + (MASKER(ra >> 2n) ^ MASKER(ra >> 13n) ^ MASKER(ra >> 22n))
        + MASKER(
          B32(reg[majA]) & B32(reg[majB])
          | B32(reg[majC]) & (B32(reg[majA]) | B32(reg[majB])),
        ),
      );
    }
  }
  return reg;
}

/** Expand obfuscated schedule words — drm.py:_expand_sha256_schedule. */
function expandSchedule(words, firstWord = 16) {
  for (let index = firstWord; index < 64; index++) {
    const x = words[index - 2];
    const y = words[index - 15];
    const s1 = MASKER((x >> 17n) ^ (x << 15n) ^ (x >> 19n) ^ (x << 13n) ^ (x >> 10n));
    const s0 = MASKER((y >> 7n) ^ (y << 25n) ^ (y >> 18n) ^ (y << 14n) ^ (y >> 3n));
    words.push(MASKER(s1 + words[index - 7] + s0 + words[index - 16]));
  }
}

/** Initial obfuscated SHA-256 state from the first 7 token bytes — drm.py:_sha256_init. */
function sha256Init(data) {
  const d = Buffer.from(data.subarray(0, 7));
  const w14 = BigInt(d.readUInt32BE(0) >>> 8);   // int.from_bytes(data[:3], "big")
  const w15 = BigInt(d.readUInt32BE(3));         // int.from_bytes(data[3:7], "big")
  const words = [
    0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
    w14, w15,
  ];
  for (let index = 16; index <= 29; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      // value ADDS the (adjusted) sigma — the reference is `value +=` (drm.py:358-362)
      value = MASKER(
        value
        + (index === 16
          ? (sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT)
          : sigma1(words[index - 2])),
      );
    }
    if (index - 7 >= 14) value = MASKER(value + words[index - 7]);
    if (index - 15 >= 14) {
      value = MASKER(
        value
        + (index === 29
          ? (sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT)
          : sigma0(words[index - 15])),
      );
    }
    words.push(value);
  }
  words.push(
    MASKER(
      sigma1(words[28])
      + words[23]
      + sigma0(words[15])
      + words[14]
      + SHA256_ADJUSTMENT
      - SHA256_ROUND_CONSTANTS[14],
    ),
  );
  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, i) => MASKER(x + working[i]));
}

/** The obfuscated SHA-256 digest over the token string — drm.py:_sha256_digest. */
function sha256Digest(data) {
  if (data.length < 7) throw new Error("Token salt must contain at least seven bytes");
  const length = 57 + data.length;                            // fake byte length the service expects
  const zeros = (((55 - length) % 64) + 64) % 64;             // Python's always-positive modulo
  const suffix = Buffer.concat([
    Buffer.from(data.subarray(7)),
    Buffer.from([0x80]),
    Buffer.alloc(zeros),
    (() => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(length) * 8n); return b; })(),
  ]);

  let state = sha256Init(data.subarray(0, 7));
  for (let offset = 0; offset < suffix.length; offset += 64) {
    const block = suffix.subarray(offset, offset + 64);
    const words = [];
    for (let i = 0; i < 64; i += 4) words.push(BigInt(block.readUInt32BE(i)));
    expandSchedule(words);
    const working = sha256Rounds(state, words, 0);
    state = state.map((x, i) => MASKER(x + working[i]));
  }
  const out = Buffer.alloc(32);
  state.forEach((w, i) => out.writeUInt32BE(Number(BigInt.asUintN(32, w)), i * 4));
  return out;
}

/** CS64 (CRC-like) digest — literal port of drm.py:_cs64_digest. */
function cs64Digest(data, digest) {
  let keyA = Number(BigInt.asUintN(32, BigInt(digest.readUInt32LE(0))));
  let keyB = Number(BigInt.asUintN(32, BigInt(digest.readUInt32LE(4))));
  keyA = (keyA | 1) >>> 0;
  keyB = (keyB | 1) >>> 0;
  const kA = BigInt(keyA), kB = BigInt(keyB);

  const factors = [MASKER(kA * CS64_FACTOR), MASKER(kB * CS64_FACTOR)];
  const terms = CS64_COEFFICIENTS.map(
    (coefs, i) => MASKER(coefs[0] * factors[i % 2]),
  );
  const offsets = CS64_COEFFICIENTS.map((coefs) => coefs[1]);

  const words = wordsLE4Even(Buffer.concat([Buffer.from([0]), Buffer.from(data)]));
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    let term = word * (index % 2 === 0 ? kA : kB);
    let offset = rol16(word) * (index % 2 === 0 ? 0xef0569fbn : 0xc31713dbn);
    if (index === 0) {
      term = MASKER(term);
      term = MASKER(term + MASKER(CS64_ADJUSTMENT0 * factors[0]));
      offset = MASKER(offset + CS64_ADJUSTMENT1);
    }
    terms.push(MASKER(term));
    offsets.push(MASKER(offset));
  }

  let swapAcc = 0n, swapLast = 0n, state = 0n, acc = 0n;
  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index], y = terms[index + 1];

    const t1 = rol16(MASKER(offsets[index] + x));
    const q1 = MASKER(t1 * 0x76f50f34n);
    swapAcc = MASKER(swapAcc + MASKER(rol16(q1) * 0xc3efea97n + q1));

    const t2 = rol16(MASKER(offsets[index + 1] + y));
    const q2 = MASKER(t2 * 0x1881ce3cn);
    swapLast = MASKER(rol16(q2) * 0x35bd1ec9n + q2);
    swapAcc = MASKER(swapAcc + swapLast);

    state = MASKER(state * kA + x);
    state = MASKER(rol16(state) * 0xcf98b111n);
    state = MASKER(rol16(state) * 0x87085b9fn);
    state = MASKER(rol16(state) * 0x12ceb96dn);
    state = MASKER(rol16(state) * 0x257e1d83n);
    acc = MASKER(acc + state);

    let t3 = MASKER(state * kB + y);
    t3 = MASKER(rol16(t3) * 0xa27416f5n);
    t3 = MASKER(rol16(t3) * 0xd38396ffn);
    state = MASKER(
      rol16(MASKER(rol16(t3) * 0x7c932b89n)) * 0xbfa49f69n,
    );
    acc = MASKER(acc + state);
  }
  return [MASKER(swapLast ^ state), MASKER(swapAcc ^ acc)];
}

function tokenHash(data) {
  const digest = sha256Digest(data);
  const [a, b] = cs64Digest(data, digest);
  const cs64 = Buffer.concat([
    (() => { const x = Buffer.alloc(4); x.writeUInt32LE(Number(BigInt.asUintN(32, a))); return x; })(),
    (() => { const x = Buffer.alloc(4); x.writeUInt32LE(Number(BigInt.asUintN(32, b))); return x; })(),
  ]).toString("hex").toUpperCase();
  return [cs64, digest.toString("hex").toUpperCase()];
}

// ── Clock skew state (drm.py:class DRM) ─────────────────────────────────────

let clockSkewSeconds = 0;

/** Add a measured skew correction in seconds (called on 403 with server Date). */
function adjClockSkewSeconds(deltaSeconds) {
  clockSkewSeconds += deltaSeconds;
}

function getUnixTimestamp() {
  return Date.now() / 1000 + clockSkewSeconds;
}

/** Parse an RFC 2616 Date header; returns seconds or null. */
function parseRFC1123Date(header) {
  if (!header) return null;
  const t = Date.parse(header);
  return Number.isFinite(t) ? t / 1000 : null;
}

/**
 * Generate the v2 Sec-MS-GEC token — drm.py:generate_sec_ms_gec_v2.
 * ticks: float seconds (+skew) → +WIN_EPOCH → floor to 5-min window → ×1e7.
 * The float arithmetic mirrors the reference exactly (JS numbers are IEEE
 * doubles like Python floats; at this magnitude the product is exact).
 */
function generateSecMsGecV2(unixSeconds) {
  const now = unixSeconds ?? getUnixTimestamp();
  let ticks = now + WIN_EPOCH;
  ticks -= ticks % 300;
  const tickInt = BigInt(Math.round(ticks * 10000000));
  const str = Buffer.from(tickInt.toString() + TRUSTED_CLIENT_TOKEN, "ascii");
  const [cs64, sha] = tokenHash(str);
  return `${cs64}-${sha}`;
}

const EDGE_WSS_URL =
  `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const EDGE_SEC_GEC_VERSION = "2-143.0.3650.75";
const EDGE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";

/**
 * edge-ws.ts — Native Microsoft Edge "readaloud" WebSocket TTS client.
 *
 * Implements the 2026 protocol revived in rany2/edge-tts 7.3.0
 * (constants.py + drm.py + communicate.py, ported 1:1):
 *   • wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
 *     ?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4
 *     &ConnectionId=<hex32>&Sec-MS-GEC=<v2>&Sec-MS-GEC-Version=2-143.0.3650.75
 *   • Edge-143 UA + Read-Aloud extension Origin + per-connection "muid" cookie
 *   • speech.config (no Z) → SSML (X-Timestamp with trailing "Z" — a Microsoft
 *     Edge bug that must be preserved), MP3 arrives in binary frames:
 *     [u16 BE header length][headers][payload] with "Path:audio"
 *   • turn ends on the text frame "Path:turn.end"
 *   • 403 → read the handshake response's Date header, shift the clock-skew
 *     and regenerate the token (drm.py:handle_client_response_error)
 *
 * One fresh connection per chunk — Python does exactly this per partial text,
 * and reusing sockets across the 2026 service outages proved unreliable.
 */


/** Raised when the handshake is 403 but a server Date header was available. */
class SkewAdjustmentNeeded extends Error {
  serverDate: string;
  constructor(serverDate: string) {
    super("Edge TTS 403 — clock skew adjustment needed");
    this.name = "SkewAdjustmentNeeded";
    this.serverDate = serverDate;
  }
}

/** uuid4 hex, lowercase (drm.py:connect_id). */
function connectId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Random uppercase 32-hex muid (drm.py:_generate_muid). */
function newMuid(): string {
  return connectId().toUpperCase();
}

/** Python time.strftime("%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)", gmtime). */
function dateString(): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const pp = (n: number) => String(n).padStart(2, "0");                    // %d/%H/%M/%S zero-padded
  return (
    `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${pp(now.getUTCDate())} ` +
    `${now.getUTCFullYear()} ${pp(now.getUTCHours())}:${pp(now.getUTCMinutes())}:${pp(now.getUTCSeconds())}` +
    " GMT+0000 (Coordinated Universal Time)"
  );
}

/** Remove character ranges the service rejects; keeps \t \n \r (communicate.py). */
function stripIncompatibleCharacters(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) out += " ";
    else out += ch;
  }
  return out;
}

/** xml.sax.saxutils.escape — & < > only. */
function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripBytes(b: Buffer): Buffer {
  const wsSet = new Set([0x20, 0x09, 0x0a, 0x0d, 0x0b, 0x0c]);
  let s = 0, e = b.length;
  while (s < e && wsSet.has(b[s])) s++;
  while (e > s && wsSet.has(b[e - 1])) e--;
  return b.subarray(s, e);
}

/** Largest prefix of the segment that is valid UTF-8 (communicate.py:_find_safe_utf8_split_point). */
function safeUtf8SplitPoint(seg: Buffer): number {
  let cut = seg.length;
  while (cut > 0) {
    const leadPos = cut - 1;
    const lead = seg[leadPos];
    if (lead < 0x80) return cut;                       // ASCII tail → valid
    if ((lead & 0xc0) === 0x80) { cut = leadPos; continue; } // continuation tail → drop it
    const leadByteEntire = cut - leadPos;
    let need: number;
    if (lead >= 0xf8) return cut;                      // invalid lead byte — treat as opaque
    else if (lead >= 0xf0) need = 4;
    else if (lead >= 0xe0) need = 3;
    else if (lead >= 0xc0) need = 2;
    else need = 1;
    if (leadByteEntire >= need) return cut;            // full multibyte sequence included
    cut = leadPos;                                     // incomplete tail → end before it
    if (cut <= 0) return 0;
  }
  return cut;
}

/** Move a split point back so it can't cut an XML entity (communicate.py:_adjust_split_point_for_xml_entity). */
function adjustSplitPointForXmlEntity(buf: Buffer, splitAtIn: number): number {
  let splitAt = splitAtIn;
  while (splitAt > 0) {
    const before = buf.subarray(0, splitAt);
    const amp = before.lastIndexOf(0x26); // '&'
    if (amp < 0) break;
    const entityEnd = before.indexOf(0x3b, amp); // ';'
    if (entityEnd !== -1 && entityEnd < splitAt) break;   // terminated entity — safe
    splitAt = amp;
  }
  return splitAt;
}

/**
 * Split (already XML-escaped) UTF-8 bytes into ≤ byteLength chunks at
 * newline/space/UTF-8/entity-safe boundaries — communicate.py:split_text_by_byte_length.
 */
function splitTextBytes(text: Buffer, byteLength: number): Buffer[] {
  const chunks: Buffer[] = [];
  let rest = text;
  while (rest.length > byteLength) {
    // prefer the rightmost newline inside the limit, then the rightmost space
    let splitAt = rest.subarray(0, byteLength).lastIndexOf(0x0a);
    if (splitAt < 0) splitAt = rest.subarray(0, byteLength).lastIndexOf(0x20);
    if (splitAt < 0) splitAt = safeUtf8SplitPoint(rest.subarray(0, byteLength));
    splitAt = adjustSplitPointForXmlEntity(rest, splitAt);
    const chunk = stripBytes(rest.subarray(0, splitAt > 0 ? splitAt : 1));
    if (chunk.length > 0) chunks.push(chunk);
    rest = rest.subarray(splitAt > 0 ? splitAt : 1);
  }
  const remaining = stripBytes(rest);
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Synthesize one pre-split chunk on a fresh connection (Python __stream).
 * `useSkewDate` re-reads the token after a skew correction on retry.
 */
function synthesizePiece(ssmlText: string, voice: string, timeoutMs: number, isRetry: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const skipSkewProbe = isRetry; // a retry after a skew fix never needs another 403 probe
    try {
      const connectionId = connectId();
      const gec = skipSkewProbe ? generateSecMsGecV2(getUnixTimestamp()) : generateSecMsGecV2();
      const url =
        `${EDGE_WSS_URL}&ConnectionId=${connectionId}` +
        `&Sec-MS-GEC=${encodeURIComponent(gec)}` +
        `&Sec-MS-GEC-Version=${encodeURIComponent(EDGE_SEC_GEC_VERSION)}`;

      const ws = new WebSocket(url, {
        headers: {
          "User-Agent": EDGE_USER_AGENT,
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-US,en;q=0.9",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
          "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
          "Cookie": `muid=${newMuid()};`,
        },
        perMessageDeflate: false,
        handshakeTimeout: Math.min(timeoutMs, 5000),
      });

      const chunks: Buffer[] = [];
      let finished = false;
      let audioWasReceived = false;

      const fail = (err: Error) => {
        if (finished) return;
        finished = true;
        try { ws.terminate(); } catch { /* ignore */ }
        clearTimeout(timer);
        reject(err);
      };
      const succeed = () => {
        if (finished) return;
        if (!audioWasReceived) { fail(new Error("Edge returned no audio")); return; }
        finished = true;
        clearTimeout(timer);
        try { ws.close(); } catch { /* ignore */ }
        resolve(Buffer.concat(chunks));
      };

      const timer = setTimeout(() => fail(new Error("Edge TTS timeout")), timeoutMs);

      ws.on("unexpected-response", (_req: unknown, res: { statusCode?: number; headers?: Record<string, string | string[] | undefined> }) => {
        const status = res?.statusCode ?? 0;
        const date = res?.headers?.date;
        if (status === 403 && typeof date === "string") fail(new SkewAdjustmentNeeded(date));
        else fail(new Error(`Edge TTS handshake rejected: ${status || "no response"}`));
      });

      ws.on("open", () => {
        // X-Timestamp without "Z": speech.config (communicate.py:send_command_request)
        ws.send(
          `X-Timestamp:${dateString()}\r\n` +
          "Content-Type:application/json; charset=utf-8\r\n" +
          "Path:speech.config\r\n\r\n" +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
          '"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"' +
          "}," +
          '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"' +
          "}}}}\r\n",
        );
        // X-Timestamp with trailing "Z": Edge bug, do not "fix" (ssml_headers_plus_data)
        ws.send(
          `X-RequestId:${connectId()}\r\n` +
          "Content-Type:application/ssml+xml\r\n" +
          `X-Timestamp:${dateString()}Z\r\n` +
          "Path:ssml\r\n\r\n" +
          "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
          `<voice name='${voice}'>` +
          "<prosody pitch='+0Hz' rate='+0%' volume='+0%'>" +
          ssmlText +
          "</prosody></voice></speak>",
        );
      });

      ws.on("message", (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          const raw = data instanceof Buffer ? data : Buffer.from(data);
          if (raw.length < 2) { fail(new Error("Binary frame missing header length")); return; }
          const headerLen = raw.readUInt16BE(0);
          if (headerLen > raw.length) { fail(new Error("Binary header length out of range")); return; }
          const headerBlock = raw.subarray(2, 2 + headerLen).toString("utf8");
          let path: string | null = null;
          let contentType: string | null = null;
          for (const line of headerBlock.split("\r\n")) {
            const idx = line.indexOf(":");
            if (idx < 0) continue;
            const k = line.slice(0, idx);
            const v = line.slice(idx + 1);
            if (k === "Path") path = v;
            else if (k === "Content-Type") contentType = v;
          }
          if (path !== "audio") { fail(new Error("Binary frame path is not audio")); return; }
          const payload = raw.subarray(headerLen + 2);
          // No Content-Type is acceptable only with an empty payload (turn terminator)
          if (contentType === null) {
            if (payload.length === 0) return;
            fail(new Error("Binary frame without Content-Type but with data"));
            return;
          }
          if (contentType !== "audio/mpeg") { fail(new Error(`Unexpected audio Content-Type: ${contentType}`)); return; }
          if (payload.length === 0) { fail(new Error("Binary frame missing audio data")); return; }
          audioWasReceived = true;
          chunks.push(Buffer.from(payload));
          return;
        }

        const text = data.toString("utf8");
        const sep = text.indexOf("\r\n\r\n");
        const headerBlock = sep >= 0 ? text.slice(0, sep) : text;
        let path = "";
        for (const line of headerBlock.split("\r\n")) {
          const idx = line.indexOf(":");
          if (idx > 0 && line.slice(0, idx) === "Path") { path = line.slice(idx + 1); break; }
        }
        if (path === "turn.end") succeed();
        // response / turn.start / audio.metadata — silently ignored
      });

      ws.on("error", (err: Error) => fail(err.message.includes("403")
        ? new Error(`Edge TTS handshake rejected: 403`)
        : err));
      ws.on("close", () => {
        if (finished) return;
        // Python's loop exits on close and only complains when no audio arrived.
        if (audioWasReceived) succeed();
        else fail(new Error("Edge connection closed before audio"));
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Full text → concatenated MP3, mirroring synthesize.stream(): escape before
 * splitting, one connection per chunk, and a single 403-driven clock-skew
 * correction followed by a retry.
 */
async function edgeSynthesizeMp3(
  voice: string,
  text: string,
  timeoutMs = 8000,
): Promise<Buffer> {
  const raw = escapeXml(stripIncompatibleCharacters(text));
  const pieces = splitTextBytes(Buffer.from(raw, "utf8"), 4096);
  const parts: Buffer[] = [];
  for (const piece of pieces) {
    let done = false;
    let skewAttempted = false;
    while (!done) {
      try {
        parts.push(await synthesizePiece(piece.toString("utf8"), voice, timeoutMs, skewAttempted));
        done = true;
      } catch (err) {
        if (err instanceof SkewAdjustmentNeeded && !skewAttempted) {
          const serverTs = parseRFC1123Date(err.serverDate);
          if (serverTs === null) throw err;
          // drm.py:adj_clock_skew_seconds(server_date_parsed - client_date)
          adjClockSkewSeconds(serverTs - getUnixTimestamp());
          skewAttempted = true; // regenerate the token with the corrected time and retry once
          continue;
        }
        throw err;
      }
    }
  }
  const mp3 = Buffer.concat(parts);
  if (mp3.length < 200) throw new Error("Edge produced too little audio");
  return mp3;
}

// ════════ end Edge client ════════

// ── Microsoft Azure Speech (official service — same neural voices as Edge) ────
// Works from Vercel (key-based REST, no blocked WebSocket). Free tier F0 =
// 0.5M characters / month. Set AZURE_SPEECH_KEY + AZURE_SPEECH_REGION in Vercel.
const azureKey    = (process.env.AZURE_SPEECH_KEY    ?? "").trim();
const azureRegion = (process.env.AZURE_SPEECH_REGION ?? "").trim();
const BEST_VOICES = new Set([
  "en-US-AndrewMultilingualNeural", "en-US-AvaMultilingualNeural",
  "en-US-BrianMultilingualNeural",  "en-US-EmmaMultilingualNeural",
  "en-GB-RyanNeural", "en-GB-SoniaNeural",
]);
async function azureSpeak(text, voice) {
  if (!azureKey || !azureRegion) throw new Error("Azure Speech not configured");
  if (!/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9]+Neural$/.test(voice)) voice = "en-US-AvaMultilingualNeural";
  const xml = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lang = voice.slice(0, 5);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}">${xml}</voice></speak>`;
  const r = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": azureKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "venoxa",
    },
    body: ssml,
  });
  if (!r.ok) throw new Error(`Azure ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 1000) throw new Error("Azure returned empty audio");
  return buf;
}

// ── GET /api/edge-tts ─────────────────────────────────────────────────────────
// Tries Microsoft Edge TTS first; if it fails (it is blocked on Vercel), falls
// back to Groq on the server so every caller still gets playable audio.
let edgeBlockedUntil = 0;
app.get("/api/edge-tts", async (req: Request, res: Response) => {
  const text  = String(req.query.text ?? "").trim().slice(0, 2500);
  const voice = String(req.query.voice ?? "en-US-AvaMultilingualNeural");
  if (!text) { res.status(400).json({ error: "text is required" }); return; }

  // 1) Azure Speech (reliable on Vercel) — same Edge neural voices
  if (azureKey && azureRegion) {
    try {
      const audio = await azureSpeak(text, voice);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.end(audio);
      return;
    } catch (err: unknown) {
      console.error("[tts] Azure failed:", err instanceof Error ? err.message : String(err));
    }
  }

  // 2) Microsoft Edge read-aloud (free, no account) via the native v2 client.
  //    Retries on fresh connections so a single hiccup never changes the voice.
  //    Groq is NOT used here: mixing two different voices inside one reply
  //    sounded bad. (Set ENABLE_GROQ_FALLBACK=1 in Vercel to re-enable it.)
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const audio = await edgeSynthesizeMp3(voice, text, 12000);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.end(audio);
      return;
    } catch (err: unknown) {
      lastErr = err;
      console.error(`[edge-tts] attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : String(err));
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  if (process.env.ENABLE_GROQ_FALLBACK !== "1") {
    res.status(502).json({ error: `Edge TTS failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}` });
    return;
  }

  // 3) Optional Groq fallback (off by default)
  try {
    const wav = await groqSpeak(text, EDGE_TO_GROQ[voice] ?? "troy");
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", String(wav.length));
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.end(wav);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[edge-tts] Groq fallback failed:", msg);
    if (!res.headersSent) res.status(502).json({ error: `TTS failed: ${msg}` });
  }
});

app.post("/api/edge-tts",       (_req, res) => res.status(405).json({ error: "Use GET /api/edge-tts" }));
app.post("/api/edge-tts-timed", (_req, res) => res.status(503).json({ error: "Edge TTS timed unavailable in serverless mode." }));

// ── Warmup endpoint (no-op: connections are per-request now) ─────────────────
app.get("/api/edge-tts-warmup", (_req: Request, res: Response) => { res.status(204).end(); });

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

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH & USER routes (inlined for Vercel) ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }

  const { email, password, username, dob, gender, languages } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
    if (existing.length > 0) { res.status(400).json({ error: "An account with this email already exists." }); return; }

    const { hash, salt } = hashPassword(password);
    const [newUser] = await db.insert(usersTable).values({
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      username: username || "New Learner",
      dob: dob || null,
      gender: gender || null,
      languages: languages || ["English"],
      xp: 0,
      streak: 0,
    }).returning();

    const token = signToken({ userId: newUser.id });
    const { passwordHash: _h, salt: _s, ...userProfile } = newUser;
    res.status(201).json({ token, user: userProfile });
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }

  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password are required." }); return; }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
    if (users.length === 0) { res.status(401).json({ error: "Invalid email or password." }); return; }

    const user = users[0];
    const isPasswordValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isPasswordValid) { res.status(401).json({ error: "Invalid email or password." }); return; }

    await db.update(usersTable).set({ lastActive: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken({ userId: user.id });
    const { passwordHash: _h, salt: _s, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/user/profile
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, (req as any).user.id)).limit(1);
    if (users.length === 0) { res.status(404).json({ error: "User not found." }); return; }
    const { passwordHash: _h, salt: _s, ...userProfile } = users[0];
    res.json(userProfile);
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// PUT /api/user/profile
app.put("/api/user/profile", authMiddleware, async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }
  const userId = (req as any).user.id;
  const { username, email, dob, gender, languages, dailyGoalMins, level, plan, avatar } = req.body;

  try {
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (languages !== undefined) updateData.languages = languages;
    if (dailyGoalMins !== undefined) updateData.dailyGoalMins = Number(dailyGoalMins);
    if (level !== undefined) updateData.level = level;
    if (plan !== undefined) updateData.plan = plan;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) { res.status(400).json({ error: "Email is already taken by another account." }); return; }
      updateData.email = cleanEmail;
    }
    const [updatedUser] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    const { passwordHash: _h, salt: _s, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (err) {
    console.error("Failed to update profile:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// Helper to merge lists of items based on a unique identifier
function mergeArraysById(localList: any[] | undefined, dbList: any[] | undefined, key = "id") {
  const mergedMap = new Map<string, any>();
  if (Array.isArray(dbList)) {
    for (const item of dbList) {
      if (item) {
        const val = item[key];
        if (val !== undefined && val !== null) {
          mergedMap.set(String(val).toLowerCase(), item);
        }
      }
    }
  }
  if (Array.isArray(localList)) {
    for (const item of localList) {
      if (item) {
        const val = item[key];
        if (val !== undefined && val !== null) {
          mergedMap.set(String(val).toLowerCase(), item);
        }
      }
    }
  }
  return Array.from(mergedMap.values());
}

// Helper to merge Spaced Repetition (SRS) objects mapping words to scheduling states
function mergeSrsObjects(localSrs: Record<string, any> | undefined, dbSrs: Record<string, any> | undefined) {
  const merged = { ...(dbSrs || {}) };
  if (localSrs) {
    for (const [word, localVal] of Object.entries(localSrs)) {
      const dbVal = merged[word];
      if (!dbVal) {
        merged[word] = localVal;
      } else {
        const localNext = localVal && typeof localVal === "object" ? Number(localVal.nextReview || 0) : 0;
        const dbNext = dbVal && typeof dbVal === "object" ? Number(dbVal.nextReview || 0) : 0;
        if (localNext > dbNext) {
          merged[word] = localVal;
        }
      }
    }
  }
  return merged;
}

// POST /api/user/sync
app.post("/api/user/sync", authMiddleware, async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }
  const userId = (req as any).user.id;
  const { 
    xp, streak, level, completedCells, usageTime, calendarDays, achievements, avatar,
    globalVocab, phrasalVocab, idiomsVocab, idiomsProperVocab, langeekVocab,
    speakingHistory, writingHistory, srsData, langeekSrsData,
    phrasalSrs, idiomsSrs, idiomsProperSrs,
    planConfig, studiedWords
  } = req.body;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) { res.status(404).json({ error: "User not found." }); return; }
    const user = users[0];

    const mergedXp = Math.max(user.xp, xp || 0);
    const mergedStreak = Math.max(user.streak, streak || 0);
    const mergedLevel = level || user.level;
    const mergedCells = { ...user.completedCells, ...(completedCells || {}) };
    const mergedUsage: Record<string, number> = { ...user.usageTime };
    if (usageTime) {
      for (const [day, mins] of Object.entries(usageTime)) {
        mergedUsage[day] = Math.max(mergedUsage[day] || 0, mins as number);
      }
    }
    const mergedCalendar = Array.from(new Set([...(user.calendarDays || []), ...(calendarDays || [])]));
    const mergedAchievements = Array.from(new Set([...(user.achievements || []), ...(achievements || [])]));

    // Synchronize vocab lists (by unique "word" key)
    const mergedGlobalVocab = mergeArraysById(globalVocab, user.globalVocab, "word");
    const mergedPhrasalVocab = mergeArraysById(phrasalVocab, user.phrasalVocab, "word");
    const mergedIdiomsVocab = mergeArraysById(idiomsVocab, user.idiomsVocab, "word");
    const mergedIdiomsProperVocab = mergeArraysById(idiomsProperVocab, user.idiomsProperVocab, "word");
    const mergedLangeekVocab = mergeArraysById(langeekVocab, user.langeekVocab, "word");

    // Synchronize practice histories (by unique "id" key)
    const mergedSpeakingHistory = mergeArraysById(speakingHistory, user.speakingHistory, "id");
    const mergedWritingHistory = mergeArraysById(writingHistory, user.writingHistory, "id");

    // Synchronize Spaced Repetition (SRS) data
    const mergedSrsData = mergeSrsObjects(srsData, user.srsData);
    const mergedLangeekSrsData = mergeSrsObjects(langeekSrsData, user.langeekSrsData);
    const mergedPhrasalSrs = mergeSrsObjects(phrasalSrs, (user as any).phrasalSrs);
    const mergedIdiomsSrs = mergeSrsObjects(idiomsSrs, (user as any).idiomsSrs);
    const mergedIdiomsProperSrs = mergeSrsObjects(idiomsProperSrs, (user as any).idiomsProperSrs);

    // Merge plan config — local always wins (latest device is authoritative)
    const mergedPlanConfig = planConfig && Object.keys(planConfig).length > 0
      ? planConfig
      : (user.planConfig && Object.keys(user.planConfig).length > 0 ? user.planConfig : {});

    // Merge studied words — union of both sets
    const mergedStudiedWords = Array.from(new Set([
      ...(Array.isArray(user.studiedWords) ? user.studiedWords : []),
      ...(Array.isArray(studiedWords) ? studiedWords : [])
    ]));

    const updateFields: any = {
      xp: mergedXp, streak: mergedStreak, level: mergedLevel,
      completedCells: mergedCells, usageTime: mergedUsage,
      calendarDays: mergedCalendar, achievements: mergedAchievements,
      globalVocab: mergedGlobalVocab, phrasalVocab: mergedPhrasalVocab,
      idiomsVocab: mergedIdiomsVocab, idiomsProperVocab: mergedIdiomsProperVocab,
      langeekVocab: mergedLangeekVocab, speakingHistory: mergedSpeakingHistory,
      writingHistory: mergedWritingHistory, srsData: mergedSrsData,
      langeekSrsData: mergedLangeekSrsData,
      phrasalSrs: mergedPhrasalSrs, idiomsSrs: mergedIdiomsSrs,
      idiomsProperSrs: mergedIdiomsProperSrs,
      planConfig: mergedPlanConfig, studiedWords: mergedStudiedWords
    };

    const extraVocabFields = [
      "customGlobalVocab", "customPhrasalVocab", "customIdiomsVocab", "customIdiomsProperVocab", "customLangeekVocab"
    ];
    for (const field of extraVocabFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = mergeArraysById(req.body[field], (user as any)[field], "word");
      }
    }

    const extraHistoryFields = [
      "translationHistory", "translationFavorites", "savedWords", "savedIdioms",
      "toneRewriterFavorites", "toneRewriterHistory", "sentenceDiagrammerFavorites", "sentenceDiagrammerHistory",
      "wordFamilyFavorites", "wordFamilyHistory", "collocationFavorites", "collocationHistory",
      "etymologyFavorites", "etymologyHistory", "pronBookmarks", "pronCompleted", "testSessions",
      "listeningHistory", "listeningFavorites", "readingHistory", "readingFavorites",
      "speakingFavorites", "wordOfDayHistory", "idiomOfDayHistory"
    ];
    for (const field of extraHistoryFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = mergeArraysById(req.body[field], (user as any)[field], "id");
      }
    }
    if (avatar !== undefined) updateFields.avatar = avatar;

    const [updatedUser] = await db.update(usersTable).set(updateFields).where(eq(usersTable.id, userId)).returning();
    const { passwordHash: _h, salt: _s, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (err) {
    console.error("Sync failed:", err);
    res.status(500).json({ error: "Failed to sync user progress." });
  }
});

// DELETE /api/user/profile
app.delete("/api/user/profile", authMiddleware, async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).json({ error: "Database not configured." }); return; }
  try {
    await db.delete(usersTable).where(eq(usersTable.id, (req as any).user.id));
    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Failed to delete account:", err);
    res.status(500).json({ error: "Failed to delete account." });
  }
});

// POST /api/user/sync-beacon — lightweight endpoint for navigator.sendBeacon (unload sync)
// sendBeacon can't set custom headers, so token is passed in the body
app.post("/api/user/sync-beacon", async (req, res) => {
  const db = getDb();
  if (!db) { res.status(503).end(); return; }

  const { token: beaconToken, ...syncData } = req.body;
  if (!beaconToken) { res.status(401).end(); return; }
  const decoded = verifyToken(beaconToken);
  if (!decoded) { res.status(401).end(); return; }
  const userId = decoded.userId;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) { res.status(404).end(); return; }
    const user = users[0];

    const {
      xp, streak, level, completedCells, usageTime, calendarDays, achievements, avatar,
      globalVocab, phrasalVocab, idiomsVocab, idiomsProperVocab, langeekVocab,
      speakingHistory, writingHistory, srsData, langeekSrsData,
      phrasalSrs, idiomsSrs, idiomsProperSrs,
      planConfig, studiedWords
    } = syncData;

    const mergedXp = Math.max(user.xp, xp || 0);
    const mergedStreak = Math.max(user.streak, streak || 0);
    const mergedLevel = level || user.level;
    const mergedCells = { ...user.completedCells, ...(completedCells || {}) };
    const mergedUsage: Record<string, number> = { ...user.usageTime };
    if (usageTime) {
      for (const [day, mins] of Object.entries(usageTime)) {
        mergedUsage[day] = Math.max(mergedUsage[day] || 0, mins as number);
      }
    }
    const mergedCalendar = Array.from(new Set([...(user.calendarDays || []), ...(calendarDays || [])]));
    const mergedAchievements = Array.from(new Set([...(user.achievements || []), ...(achievements || [])]));
    const mergedGlobalVocab = mergeArraysById(globalVocab, user.globalVocab, "word");
    const mergedPhrasalVocab = mergeArraysById(phrasalVocab, user.phrasalVocab, "word");
    const mergedIdiomsVocab = mergeArraysById(idiomsVocab, user.idiomsVocab, "word");
    const mergedIdiomsProperVocab = mergeArraysById(idiomsProperVocab, user.idiomsProperVocab, "word");
    const mergedLangeekVocab = mergeArraysById(langeekVocab, user.langeekVocab, "word");
    const mergedSpeakingHistory = mergeArraysById(speakingHistory, user.speakingHistory, "id");
    const mergedWritingHistory = mergeArraysById(writingHistory, user.writingHistory, "id");
    const mergedSrsData = mergeSrsObjects(srsData, user.srsData);
    const mergedLangeekSrsData = mergeSrsObjects(langeekSrsData, user.langeekSrsData);
    const mergedPhrasalSrs = mergeSrsObjects(phrasalSrs, (user as any).phrasalSrs);
    const mergedIdiomsSrs = mergeSrsObjects(idiomsSrs, (user as any).idiomsSrs);
    const mergedIdiomsProperSrs = mergeSrsObjects(idiomsProperSrs, (user as any).idiomsProperSrs);
    const mergedPlanConfig = planConfig && Object.keys(planConfig).length > 0
      ? planConfig : (user.planConfig && Object.keys(user.planConfig).length > 0 ? user.planConfig : {});
    const mergedStudiedWords = Array.from(new Set([
      ...(Array.isArray(user.studiedWords) ? user.studiedWords : []),
      ...(Array.isArray(studiedWords) ? studiedWords : [])
    ]));

    const updateFields: any = {
      xp: mergedXp, streak: mergedStreak, level: mergedLevel,
      completedCells: mergedCells, usageTime: mergedUsage,
      calendarDays: mergedCalendar, achievements: mergedAchievements,
      globalVocab: mergedGlobalVocab, phrasalVocab: mergedPhrasalVocab,
      idiomsVocab: mergedIdiomsVocab, idiomsProperVocab: mergedIdiomsProperVocab,
      langeekVocab: mergedLangeekVocab, speakingHistory: mergedSpeakingHistory,
      writingHistory: mergedWritingHistory, srsData: mergedSrsData,
      langeekSrsData: mergedLangeekSrsData,
      phrasalSrs: mergedPhrasalSrs, idiomsSrs: mergedIdiomsSrs,
      idiomsProperSrs: mergedIdiomsProperSrs,
      idiomsProperSrs: mergedIdiomsProperSrs,
      planConfig: mergedPlanConfig, studiedWords: mergedStudiedWords
    };

    const extraVocabFields = [
      "customGlobalVocab", "customPhrasalVocab", "customIdiomsVocab", "customIdiomsProperVocab", "customLangeekVocab"
    ];
    for (const field of extraVocabFields) {
      if ((syncData as any)[field] !== undefined) {
        updateFields[field] = mergeArraysById((syncData as any)[field], (user as any)[field], "word");
      }
    }

    const extraHistoryFields = [
      "translationHistory", "translationFavorites", "savedWords", "savedIdioms",
      "toneRewriterFavorites", "toneRewriterHistory", "sentenceDiagrammerFavorites", "sentenceDiagrammerHistory",
      "wordFamilyFavorites", "wordFamilyHistory", "collocationFavorites", "collocationHistory",
      "etymologyFavorites", "etymologyHistory", "pronBookmarks", "pronCompleted", "testSessions",
      "listeningHistory", "listeningFavorites", "readingHistory", "readingFavorites",
      "speakingFavorites", "wordOfDayHistory", "idiomOfDayHistory"
    ];
    for (const field of extraHistoryFields) {
      if ((syncData as any)[field] !== undefined) {
        updateFields[field] = mergeArraysById((syncData as any)[field], (user as any)[field], "id");
      }
    }

    if (avatar !== undefined) updateFields.avatar = avatar;

    await db.update(usersTable).set(updateFields).where(eq(usersTable.id, userId));
    res.status(204).end();
  } catch (err) {
    console.error("Beacon sync failed:", err);
    res.status(500).end();
  }
});

export default app;
