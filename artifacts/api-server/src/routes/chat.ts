import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

type Provider = {
  client: OpenAI;
  model: string;
  label: string;
};

function buildProvider(): Provider {
  // 1) Replit-managed AI integration — no API key required from the user,
  //    billed to their Replit credits. This is the default that "just works".
  const replitBase = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const replitKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (replitBase && replitKey) {
    return {
      client: new OpenAI({ apiKey: replitKey, baseURL: replitBase }),
      model: "gpt-5-nano",
      label: "replit-ai",
    };
  }

  // 2) OpenRouter (free unlimited models) — only if the key is real.
  const orKey = process.env["OPENROUTER_API_KEY"];
  if (orKey && orKey.startsWith("sk-or-")) {
    return {
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

  // 3) Plain OpenAI key fallback.
  const oaKey = process.env["OPENAI_API_KEY"];
  if (oaKey && oaKey.startsWith("sk-")) {
    return {
      client: new OpenAI({ apiKey: oaKey }),
      model: "gpt-4o-mini",
      label: "openai",
    };
  }

  throw new Error(
    "No AI provider configured. Expected AI_INTEGRATIONS_OPENAI_* (preferred), OPENROUTER_API_KEY, or OPENAI_API_KEY.",
  );
}

const provider = buildProvider();

router.post("/chat", async (req, res) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  try {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 8192,
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
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
