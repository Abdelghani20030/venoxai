import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

// ── Response cache ─────────────────────────────────────────────────────────────
// Avoids redundant AI calls when the same prompt fires within 2 minutes.
const responseCache = new Map<string, { text: string; expires: number }>();
const CACHE_TTL_MS = 2 * 60_000;
const CACHE_MAX = 100;

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
// Tracks when a provider/model should be skipped until (epoch ms).
const cooldowns = new Map<string, number>();

function isCooledDown(key: string): boolean {
  const until = cooldowns.get(key);
  if (!until) return false;
  if (Date.now() > until) {
    cooldowns.delete(key);
    return false;
  }
  return true;
}

function setCooldown(key: string, ms: number) {
  cooldowns.set(key, Date.now() + ms);
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
// Per-minute rate limits exist on free models; we skip rate-limited models for
// 60 s and circuit-break the whole provider for 5 min on auth failure.
// Only models confirmed available (200 or 429) for this account.
// 404 models are excluded — they waste time and have no endpoints.
const OR_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",   // 3B — smallest, fastest
  "google/gemma-3-27b-it:free",               // 27B — confirmed OK
  "meta-llama/llama-3.3-70b-instruct:free",   // 70B — best quality
];

function buildOpenRouterProvider(orKey: string): ProviderEntry | null {
  if (!orKey || orKey.trim().length < 10) return null;
  const client = new OpenAI({
    apiKey: orKey.trim(),
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://venoxa.replit.app",
      "X-Title": "Venoxa AI Platform",
    },
  });

  return {
    label: "openrouter",
    stream: async (prompt, onChunk, log) => {
      if (isCooledDown("openrouter:auth")) {
        throw new Error("openrouter auth circuit open");
      }
      let lastErr: unknown;
      for (const model of OR_MODELS) {
        const modelKey = `openrouter:${model}`;
        if (isCooledDown(modelKey)) continue;
        try {
          const s = await client.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 8192,
            stream: true,
          });
          for await (const chunk of s) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          }
          return;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("401") || msg.includes("403")) {
            // Auth failure — no point retrying any OR model
            setCooldown("openrouter:auth", 5 * 60_000);
            log?.(`openrouter auth failure — cooling down 5 min`);
            throw err;
          }
          if (msg.includes("429") || msg.includes("rate") || msg.includes("limit")) {
            setCooldown(modelKey, 15_000);
            log?.(`openrouter model ${model} rate-limited — skipping 15 s`);
          }
          lastErr = err;
        }
      }
      throw lastErr ?? new Error("All OpenRouter models unavailable");
    },
  };
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.5-flash",       // fastest, primary
  "gemini-2.5-flash-lite",  // lighter 2.5 variant
  "gemini-2.0-flash",       // fallback if 2.5 quota hits
  "gemini-2.0-flash-lite",  // last resort
];

function buildGeminiProvider(googleKey: string): ProviderEntry | null {
  if (!googleKey || !googleKey.trim().startsWith("AIza")) return null;
  const key = googleKey.trim();

  const callModel = async (
    model: string,
    prompt: string,
    onChunk: (d: string) => void,
  ) => {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}` +
      `:streamGenerateContent?alt=sse&key=${key}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          // Disable thinking mode on 2.5 models — cuts latency from 5-8s to <1s
          ...(model.startsWith("gemini-2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Gemini ${resp.status} (${model}): ${body.slice(0, 300)}`);
    }
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        try {
          const obj = JSON.parse(json) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const text = obj.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch { /* skip malformed SSE */ }
      }
    }
  };

  return {
    label: "google-gemini",
    stream: async (prompt, onChunk, log) => {
      if (isCooledDown("gemini:auth")) throw new Error("gemini auth circuit open");
      let lastErr: unknown;
      for (const model of GEMINI_MODELS) {
        const modelKey = `gemini:${model}`;
        if (isCooledDown(modelKey)) continue;
        try {
          await callModel(model, prompt, onChunk);
          return;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("400") && msg.includes("API_KEY")) {
            setCooldown("gemini:auth", 5 * 60_000);
            throw err;
          }
          if (msg.includes("429")) {
            // quota exhausted — skip this model for 15 s so it recovers quickly
            setCooldown(modelKey, 15_000);
            log?.(`gemini model ${model} quota — skipping 15 s`);
          } else if (msg.includes("404")) {
            // model not available for this project — skip permanently for this session
            setCooldown(modelKey, 60 * 60_000);
          }
          lastErr = err;
        }
      }
      throw lastErr ?? new Error("All Gemini models unavailable");
    },
  };
}

// ── Generic OpenAI-compatible provider ───────────────────────────────────────
function buildOpenAIProvider(apiKey: string, label: string, baseURL?: string): ProviderEntry | null {
  if (!apiKey || apiKey.trim().length < 10) return null;
  const client = new OpenAI({
    apiKey: apiKey.trim(),
    ...(baseURL ? { baseURL } : {}),
  });
  const model = "gpt-4o-mini";
  return {
    label,
    stream: async (prompt, onChunk, log) => {
      if (isCooledDown(`${label}:auth`)) throw new Error(`${label} auth circuit open`);
      try {
        const s = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 8192,
          stream: true,
        });
        for await (const chunk of s) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("401") || msg.includes("403")) {
          setCooldown(`${label}:auth`, 5 * 60_000);
          log?.(`${label} auth failure — cooling down 5 min`);
        }
        throw err;
      }
    },
  };
}

// ── Provider type ─────────────────────────────────────────────────────────────
type ProviderEntry = {
  label: string;
  stream: (
    prompt: string,
    onChunk: (delta: string) => void,
    log?: (msg: string) => void,
  ) => Promise<void>;
};

// ── Build provider list once at startup ──────────────────────────────────────
function buildProviders(): ProviderEntry[] {
  const list: ProviderEntry[] = [];

  // 1. Google Gemini — fastest, primary AI provider
  const googleKey =
    process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
  const geminiProvider = buildGeminiProvider(googleKey);
  if (geminiProvider) list.push(geminiProvider);

  // 3. OpenRouter — automatic fallback when Gemini quota is exhausted
  const orKey = process.env["OPENROUTER_API_KEY"] ?? "";
  const orProvider = buildOpenRouterProvider(orKey);
  if (orProvider) list.push(orProvider);

  // 4. Plain OpenAI
  const oaKey = process.env["OPENAI_API_KEY"] ?? "";
  const oaProvider = buildOpenAIProvider(oaKey, "openai");
  if (oaProvider) list.push(oaProvider);

  return list;
}

const allProviders = buildProviders();

if (allProviders.length === 0) {
  throw new Error(
    "No AI provider configured. Set OPENROUTER_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY.",
  );
}

// ── Shared runner ─────────────────────────────────────────────────────────────
async function runWithFallback(
  prompt: string,
  onChunk: (delta: string) => void,
  logWarn: (msg: string, meta: unknown) => void,
  logError: (msg: string, meta: unknown) => void,
): Promise<void> {
  let lastErr: unknown = null;
  for (const provider of allProviders) {
    try {
      await provider.stream(prompt, onChunk, (msg) =>
        logWarn(msg, { provider: provider.label }),
      );
      return;
    } catch (err) {
      lastErr = err;
      logWarn("Provider failed, trying next", {
        provider: provider.label,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  logError("All AI providers failed", { err: lastErr });
  throw lastErr ?? new Error("All providers failed");
}

// ── Streaming SSE endpoint ────────────────────────────────────────────────────
router.post("/chat/stream", async (req: Request, res: Response) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' in request body." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: string) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  // Serve from cache instantly as a single delta
  const hit = getCached(prompt);
  if (hit) {
    send("delta", hit);
    send("done", "");
    res.end();
    return;
  }

  try {
    let full = "";
    await runWithFallback(
      prompt,
      (delta) => { full += delta; send("delta", delta); },
      (msg, meta) => req.log.warn(meta, msg),
      (msg, meta) => req.log.error(meta, msg),
    );
    if (full.trim()) setCache(prompt, full);
    send("done", "");
  } catch {
    send("error", "All AI providers failed. Please try again.");
  }
  res.end();
});

// ── Non-streaming endpoint ────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  // Serve from cache
  const hit = getCached(prompt);
  if (hit) { res.json({ text: hit }); return; }

  try {
    let text = "";
    await runWithFallback(
      prompt,
      (delta) => { text += delta; },
      (msg, meta) => req.log.warn(meta, msg),
      (msg, meta) => req.log.error(meta, msg),
    );
    if (!text.trim()) throw new Error("All providers returned empty content.");
    setCache(prompt, text);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Chat request failed");
    res.status(502).json({ error: "AI provider request failed. Please try again." });
  }
});

export default router;
