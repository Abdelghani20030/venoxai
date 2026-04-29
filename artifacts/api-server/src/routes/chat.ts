import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const rawOpenrouterKey = process.env["OPENROUTER_API_KEY"];
// OpenRouter keys must start with "sk-or-" — anything else (e.g. an OpenAI key
// pasted into the wrong slot) would just produce 401s, so treat it as missing.
const openrouterKey =
  rawOpenrouterKey && rawOpenrouterKey.startsWith("sk-or-")
    ? rawOpenrouterKey
    : undefined;
const openaiKey = process.env["OPENAI_API_KEY"];

type Provider = {
  client: OpenAI;
  model: string;
  label: string;
};

function buildProvider(): Provider {
  // Prefer OpenRouter when available — gives us truly free, unlimited-quota models.
  if (openrouterKey) {
    return {
      client: new OpenAI({
        apiKey: openrouterKey,
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

  // Fall back to OpenAI directly if only an OpenAI key is configured.
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: "gpt-4o-mini",
      label: "openai",
    };
  }

  throw new Error(
    "No AI key configured. Set OPENROUTER_API_KEY (preferred, free) or OPENAI_API_KEY.",
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
