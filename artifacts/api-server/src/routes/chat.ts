import { Router, type IRouter } from "express";
import OpenAI from "openai";
import type { Logger } from "pino";

const router: IRouter = Router();

type Provider = {
  label: string;
  model: string;
  call: (prompt: string) => Promise<string>;
};

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const googleKey = process.env["GOOGLE_API_KEY"];
  if (googleKey && googleKey.startsWith("AIza")) {
    const model = "gemini-2.5-flash-lite";
    providers.push({
      label: "google-gemini",
      model,
      call: async (prompt) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 220,
            },
          }),
        });
        if (!resp.ok) {
          const body = await resp.text();
          throw new Error(`Gemini ${resp.status}: ${body.slice(0, 300)}`);
        }
        const data = (await resp.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      },
    });
  }

  const replitBase = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const replitKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (replitBase && replitKey) {
    const client = new OpenAI({ apiKey: replitKey, baseURL: replitBase });
    const model = "gpt-5-nano";
    providers.push({
      label: "replit-ai",
      model,
      call: async (prompt) => {
        const c = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 220,
        });
        return c.choices?.[0]?.message?.content ?? "";
      },
    });
  }

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
    const model = "x-ai/grok-4-fast:free";
    providers.push({
      label: "openrouter",
      model,
      call: async (prompt) => {
        const c = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 220,
          temperature: 0.3,
        });
        return c.choices?.[0]?.message?.content ?? "";
      },
    });
  }

  const oaKey = process.env["OPENAI_API_KEY"];
  if (oaKey && oaKey.startsWith("sk-")) {
    const client = new OpenAI({ apiKey: oaKey });
    const model = "gpt-4o-mini";
    providers.push({
      label: "openai",
      model,
      call: async (prompt) => {
        const c = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 220,
          temperature: 0.3,
        });
        return c.choices?.[0]?.message?.content ?? "";
      },
    });
  }

  return providers;
}

const providers = buildProviders();

if (providers.length === 0) {
  throw new Error(
    "No AI provider configured. Expected GOOGLE_API_KEY (preferred), AI_INTEGRATIONS_OPENAI_*, OPENROUTER_API_KEY, or OPENAI_API_KEY.",
  );
}

async function runPrompt(prompt: string, log: Logger): Promise<string> {
  let lastErr: unknown = null;
  for (const p of providers) {
    try {
      const text = await p.call(prompt);
      if (text && text.trim().length > 0) return text;
      lastErr = new Error(`Empty response from ${p.label}`);
      log.warn({ provider: p.label, model: p.model }, "Provider returned empty text, trying next");
    } catch (err) {
      lastErr = err;
      log.warn({ err, provider: p.label, model: p.model }, "Provider failed, falling back to next");
    }
  }
  throw lastErr ?? new Error("All AI providers failed.");
}

router.post("/chat", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  try {
    const text = await runPrompt(prompt, req.log);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "All AI providers failed for chat request");
    res.status(502).json({ error: "AI provider request failed. Please try again." });
  }
});

export default router;
