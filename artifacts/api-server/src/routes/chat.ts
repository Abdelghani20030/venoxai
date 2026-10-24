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
const OR_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
  "thinkingmachines/inkling:free",
  "poolside/laguna-s-2.1:free",
  "poolside/laguna-xs-2.1:free",
  "meta-llama/llama-3.2-3b-instruct",
  "google/gemini-2.5-flash",
];

const orKey = (process.env["OPENROUTER_API_KEY"] ?? "").trim();

if (!orKey || orKey.length < 10) {
  console.warn("OPENROUTER_API_KEY is not set or too short — OpenRouter will be unavailable.");
}

const orClient = orKey ? new OpenAI({
  apiKey: orKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://venoxai.vercel.app",
    "X-Title": "Venoxa AI Platform",
  },
}) : null;

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
  baseURL: "https://gen.pollinations.ai/v1",
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
  if (!orClient) throw new Error("OpenRouter client not configured — OPENROUTER_API_KEY is missing.");
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
  const messages = buildMessages(prompt);

  // 1. Try Groq first (high speed)
  if (groqClient) {
    const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    for (const model of groqModels) {
      try {
        const stream = await groqClient.chat.completions.create({
          model,
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
        log?.(`Groq model ${model} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 2. Try Gemini
  if (genAI) {
    const geminiModels = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsg = messages[messages.length - 1].content;

    for (const modelName of geminiModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
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
        log?.(`Gemini model ${modelName} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 3. Try Pollinations
  if (pollClient) {
    try {
      const stream = await pollClient.chat.completions.create({
        model: "openai",
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
      log?.(`Pollinations failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 4. Try DeepSeek
  if (dsClient) {
    try {
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
      log?.(`DeepSeek failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 5. Fallback to OpenRouter
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

