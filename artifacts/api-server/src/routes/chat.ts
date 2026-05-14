// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

// ── Response cache ─────────────────────────────────────────────────────────────
const responseCache = new Map<string, { text: string; expires: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 min
const CACHE_MAX = 500;

function normalizePrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim();
}

function getCached(prompt: string): string | null {
  const entry = responseCache.get(prompt);
  if (!entry) return null;
  if (Date.now() > entry.expires) { responseCache.delete(prompt); return null; }
  return entry.text;
}

function setCache(prompt: string, text: string) {
  if (responseCache.size >= CACHE_MAX) {
    const first = responseCache.keys().next().value;
    if (first) responseCache.delete(first);
  }
  responseCache.set(prompt, { text, expires: Date.now() + CACHE_TTL_MS });
}

// ── Circuit breaker ───────────────────────────────────────────────────────────
const cooldowns = new Map<string, number>();

function isCooledDown(key: string): boolean {
  const until = cooldowns.get(key);
  if (!until) return false;
  if (Date.now() > until) { cooldowns.delete(key); return false; }
  return true;
}

function setCooldown(key: string, ms: number) {
  cooldowns.set(key, Date.now() + ms);
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
// Models ordered by speed: smallest/fastest first.
// Verified valid on OpenRouter as of 2026-05 — rotated when one hits rate limits.
const OR_MODELS = [
  "liquid/lfm-2.5-1.2b-instruct:free",    // 1.2B — fastest
  "openai/gpt-oss-20b:free",               // 20B — GPT-class, fast
  "nvidia/nemotron-nano-9b-v2:free",       // 9B
  "meta-llama/llama-3.2-3b-instruct:free", // 3B
  "google/gemma-4-26b-a4b-it:free",        // 26B sparse MoE
  "openai/gpt-oss-120b:free",              // 120B — high quality
  "meta-llama/llama-3.3-70b-instruct:free",// 70B
];

const orKey = (process.env["OPENROUTER_API_KEY"] ?? "").trim();

if (!orKey || orKey.length < 10) {
  throw new Error("OPENROUTER_API_KEY is not set. Please add it to your environment secrets.");
}

const orClient = new OpenAI({
  apiKey: orKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://venoxa.replit.app",
    "X-Title": "Venoxa AI Platform",
  },
});

// ── Gemini ──────────────────────────────────────────────────────────────────
const geminiKey = (process.env["GEMINI_API_KEY"] ?? "").trim();
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// ── DeepSeek ────────────────────────────────────────────────────────────────
const deepseekKey = (process.env["DEEPSEEK_API_KEY"] ?? "").trim();
const dsClient = deepseekKey ? new OpenAI({
  apiKey: deepseekKey,
  baseURL: "https://api.deepseek.com",
}) : null;

// ── Pollinations ────────────────────────────────────────────────────────────
const pollKey = (process.env["POLLINATIONS_API_KEY"] ?? "").trim();
const pollClient = pollKey ? new OpenAI({
  apiKey: pollKey,
  baseURL: "https://gen.pollinations.ai",
}) : null;

// ── Groq ────────────────────────────────────────────────────────────────────
const groqKey = (process.env["GROQ_API_KEY"] ?? "").trim();
const groqClient = groqKey ? new OpenAI({
  apiKey: groqKey,
  baseURL: "https://api.groq.com/openai/v1",
}) : null;

// Split system/user parts if prompt contains a recognizable delimiter
function buildMessages(prompt: string): Array<{ role: "system" | "user"; content: string }> {
  // Prompts ending with 'User said: "..."' → extract system + user parts
  const match = prompt.match(/^(.*?)\s*User said:\s*"([^"]*)"\.?\s*(?:Output the reply text ONLY.*)?$/s);
  if (match) {
    return [
      { role: "system", content: match[1].trim() },
      { role: "user",   content: match[2].trim() },
    ];
  }
  return [{ role: "user", content: prompt }];
}

async function streamFromOpenRouter(
  prompt: string,
  onChunk: (delta: string) => void,
  maxTokens = 512,
  log?: (msg: string) => void,
): Promise<void> {
  if (isCooledDown("openrouter:auth")) throw new Error("OpenRouter auth circuit open");

  const messages = buildMessages(prompt);

  let lastErr: unknown;
  for (const model of OR_MODELS) {
    const modelKey = `openrouter:${model}`;
    if (isCooledDown(modelKey)) continue;
    try {
      const s = await orClient.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxTokens,
        stream: true,
        temperature: 0.7,
      });
      for await (const chunk of s) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) onChunk(delta);
      }
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("403")) {
        setCooldown("openrouter:auth", 5 * 60_000);
        log?.("OpenRouter auth failure — cooling down 5 min");
        throw err;
      }
      if (msg.includes("429") || msg.includes("rate") || msg.includes("limit") || msg.includes("overloaded")) {
        setCooldown(modelKey, 20_000);
        log?.(`OpenRouter model ${model} rate-limited — skipping 20 s`);
      } else {
        log?.(`OpenRouter model ${model} failed: ${msg.slice(0, 80)}`);
      }
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All OpenRouter models unavailable");
}

async function streamFromAI(
  prompt: string,
  onChunk: (delta: string) => void,
  maxTokens = 512,
  log?: (msg: string) => void,
): Promise<void> {
  // Try Groq first as requested (Incredible speed)
  if (groqClient) {
    try {
      const messages = buildMessages(prompt);
      const stream = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Top tier model on Groq
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) onChunk(delta);
      }
      return;
    } catch (err) {
      log?.(`Groq failed, falling back to Pollinations: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Try Pollinations second
  if (pollClient) {
    try {
      const messages = buildMessages(prompt);
      const stream = await pollClient.chat.completions.create({
        model: "openai", // Common generic model identifier for Pollinations
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) onChunk(delta);
      }
      return;
    } catch (err) {
      log?.(`Pollinations failed, falling back to Gemini: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Try Gemini second (extremely fast)
  if (genAI) {
    try {
      const messages = buildMessages(prompt);
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsg = messages[messages.length - 1].content;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemMsg ? systemMsg.content : undefined,
      });

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ] as any
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) onChunk(text);
      }
      return;
    } catch (err) {
      log?.(`Gemini failed, falling back to DeepSeek: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Try DeepSeek third
  if (dsClient) {
    try {
      const messages = buildMessages(prompt);
      const stream = await dsClient.chat.completions.create({
        model: "deepseek-chat",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) onChunk(delta);
      }
      return;
    } catch (err) {
      log?.(`DeepSeek failed, falling back to OpenRouter: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fallback to OpenRouter
  await streamFromOpenRouter(prompt, onChunk, maxTokens, log);
}

// ── Streaming SSE endpoint ────────────────────────────────────────────────────
router.post("/chat/stream", async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? normalizePrompt(req.body.prompt) : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' in request body." });
    return;
  }
  // Max tokens hint — caller can reduce for short conversational replies
  const maxTokens = typeof req.body?.maxTokens === "number" ? Math.min(req.body.maxTokens, 2048) : 256;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: string) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const hit = getCached(prompt);
  if (hit) {
    send("delta", hit);
    send("done", "");
    res.end();
    return;
  }

  try {
    let full = "";
    await streamFromAI(
      prompt,
      (delta) => { full += delta; send("delta", delta); },
      maxTokens,
      (msg) => req.log.warn({ provider: "ai" }, msg),
    );
    if (full.trim()) setCache(prompt, full);
    send("done", "");
  } catch (err) {
    req.log.error({ err }, "Chat stream failed");
    send("error", "AI request failed. Please try again.");
  }
  res.end();
});

// ── Non-streaming endpoint ────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? normalizePrompt(req.body.prompt) : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }
  const maxTokens = typeof req.body?.maxTokens === "number" ? Math.min(req.body.maxTokens, 2048) : 256;

  const hit = getCached(prompt);
  if (hit) { res.json({ text: hit }); return; }

  try {
    let text = "";
    await streamFromAI(
      prompt,
      (delta) => { text += delta; },
      maxTokens,
      (msg) => req.log.warn({ provider: "ai" }, msg),
    );
    if (!text.trim()) throw new Error("AI returned empty content.");
    setCache(prompt, text);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Chat request failed");
    res.status(502).json({ error: "AI request failed. Please try again." });
  }
});

export default router;

