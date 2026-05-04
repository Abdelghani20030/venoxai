import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import type { Logger } from "pino";

const router: IRouter = Router();

// ── Streaming provider type ───────────────────────────────────────────────────
type StreamProvider = {
  label: string;
  model: string;
  stream: (prompt: string, onChunk: (delta: string) => void) => Promise<void>;
};

// ── Build ordered list of streaming providers ────────────────────────────────
function buildStreamProviders(): StreamProvider[] {
  const providers: StreamProvider[] = [];

  // 1) Replit-managed AI — no external quota, fastest cold-start.
  const replitBase = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const replitKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (replitBase && replitKey) {
    const client = new OpenAI({ apiKey: replitKey, baseURL: replitBase });
    const model = "gpt-4o-mini";
    providers.push({
      label: "replit-ai",
      model,
      stream: async (prompt, onChunk) => {
        const stream = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 200,
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        }
      },
    });
  }

  // 2) Google Gemini streaming endpoint.
  const googleKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
  if (googleKey && googleKey.startsWith("AIza")) {
    const model = "gemini-2.0-flash";
    providers.push({
      label: "google-gemini",
      model,
      stream: async (prompt, onChunk) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${googleKey}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
          }),
        });
        if (!resp.ok) {
          const body = await resp.text();
          throw new Error(`Gemini ${resp.status}: ${body.slice(0, 300)}`);
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
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                }>;
              };
              const text = obj.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) onChunk(text);
            } catch {
              // malformed SSE line — skip
            }
          }
        }
      },
    });
  }

  // 3) OpenRouter streaming fallback.
  const orKey = process.env["OPENROUTER_API_KEY"];
  if (orKey && orKey.startsWith("sk-or-")) {
    const client = new OpenAI({
      apiKey: orKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://venoxa.replit.app",
        "X-Title": "Venoxa AI Platform",
      },
    });
    const model = "meta-llama/llama-3.1-8b-instruct:free";
    providers.push({
      label: "openrouter",
      model,
      stream: async (prompt, onChunk) => {
        const stream = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 512,
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        }
      },
    });
  }

  // 4) Plain OpenAI fallback.
  const oaKey = process.env["OPENAI_API_KEY"];
  if (oaKey && oaKey.startsWith("sk-")) {
    const client = new OpenAI({ apiKey: oaKey });
    const model = "gpt-4o-mini";
    providers.push({
      label: "openai",
      model,
      stream: async (prompt, onChunk) => {
        const s = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 200,
          stream: true,
        });
        for await (const chunk of s) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        }
      },
    });
  }

  return providers;
}

const streamProviders = buildStreamProviders();

if (streamProviders.length === 0) {
  throw new Error(
    "No AI provider configured. Expected AI_INTEGRATIONS_OPENAI_*, GOOGLE_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY.",
  );
}

// ── Streaming SSE endpoint ───────────────────────────────────────────────────
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

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let lastErr: unknown = null;
  for (const provider of streamProviders) {
    try {
      await provider.stream(prompt, (delta) => send("delta", delta));
      send("done", "");
      res.end();
      return;
    } catch (err) {
      lastErr = err;
      req.log.warn(
        { err, provider: provider.label, model: provider.model },
        "Stream provider failed, trying next",
      );
    }
  }

  req.log.error({ err: lastErr }, "All stream providers failed");
  send("error", "All AI providers failed. Please try again.");
  res.end();
});

// ── Legacy non-streaming endpoint (kept for Langeek/story uses) ──────────────
router.post("/chat", async (req: Request, res: Response) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  try {
    let text = "";
    let lastErr: unknown = null;
    for (const provider of streamProviders) {
      try {
        await provider.stream(prompt, (delta) => { text += delta; });
        if (text.trim().length > 0) break;
      } catch (err) {
        lastErr = err;
        req.log.warn({ err, provider: provider.label }, "Provider failed, trying next");
        text = "";
      }
    }
    if (!text.trim()) throw lastErr ?? new Error("All providers returned empty.");
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "All AI providers failed for chat request");
    res.status(502).json({ error: "AI provider request failed. Please try again." });
  }
});

export default router;
