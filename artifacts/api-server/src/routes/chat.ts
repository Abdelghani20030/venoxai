import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

type Provider =
  | { kind: "gemini"; apiKey: string; model: string; label: string }
  | { kind: "openai"; client: OpenAI; model: string; label: string };

function buildProvider(): Provider {
  // 1) Google Gemini — free tier, generous quota, matches the original Venoxa design.
  const googleKey = process.env["GOOGLE_API_KEY"];
  if (googleKey && googleKey.startsWith("AIza")) {
    return {
      kind: "gemini",
      apiKey: googleKey,
      model: "gemini-2.5-flash",
      label: "google-gemini",
    };
  }

  // 2) Replit-managed AI integration — billed to Replit credits.
  const replitBase = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const replitKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (replitBase && replitKey) {
    return {
      kind: "openai",
      client: new OpenAI({ apiKey: replitKey, baseURL: replitBase }),
      model: "gpt-5-nano",
      label: "replit-ai",
    };
  }

  // 3) OpenRouter — only if a real OpenRouter key is provided.
  const orKey = process.env["OPENROUTER_API_KEY"];
  if (orKey && orKey.startsWith("sk-or-")) {
    return {
      kind: "openai",
      client: new OpenAI({
        apiKey: orKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://venoxa.replit.app",
          "X-Title": "Venoxa AI Platform",
        },
      }),
      model: "x-ai/grok-4-fast:free",
      label: "openrouter",
    };
  }

  // 4) Plain OpenAI fallback.
  const oaKey = process.env["OPENAI_API_KEY"];
  if (oaKey && oaKey.startsWith("sk-")) {
    return {
      kind: "openai",
      client: new OpenAI({ apiKey: oaKey }),
      model: "gpt-4o-mini",
      label: "openai",
    };
  }

  throw new Error(
    "No AI provider configured. Expected GOOGLE_API_KEY (preferred), AI_INTEGRATIONS_OPENAI_*, OPENROUTER_API_KEY, or OPENAI_API_KEY.",
  );
}

const provider = buildProvider();

async function runPrompt(prompt: string): Promise<string> {
  if (provider.kind === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
  }

  const completion = await provider.client.chat.completions.create({
    model: provider.model,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 8192,
  });
  return completion.choices?.[0]?.message?.content ?? "";
}

router.post("/chat", async (req, res) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  try {
    const text = await runPrompt(prompt);
    res.json({ text });
  } catch (err) {
    req.log.error(
      { err, provider: provider.label, model: provider.model },
      "Chat proxy request failed",
    );
    res
      .status(502)
      .json({ error: "AI provider request failed. Please try again." });
  }
});

export default router;
