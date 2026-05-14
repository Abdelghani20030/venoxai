// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";

const router: IRouter = Router();

/**
 * GET /api/groq-tts?text=...&voice=...
 * Proxies to Groq's high-speed TTS endpoint using the Orpheus model.
 * Model: canopylabs/orpheus-v1-english
 */
router.get("/groq-tts", async (req: Request, res: Response) => {
  const text = typeof req.query.text === "string" ? req.query.text.trim() : "";
  const voice = typeof req.query.voice === "string" ? req.query.voice.trim() : "adam"; // Default Orpheus voice
  
  const groqKey = (process.env["GROQ_API_KEY"] ?? "").trim();
  
  if (!text) {
    res.status(400).json({ error: "Missing 'text' query parameter." });
    return;
  }

  if (!groqKey) {
    res.status(503).json({ error: "GROQ_API_KEY is not configured." });
    return;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        input: text,
        voice: voice,
        model: "canopylabs/orpheus-v1-english",
        response_format: "wav"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log?.error({ status: response.status, body: errText }, "Groq TTS service error");
      throw new Error(`Groq TTS service returned ${response.status}`);
    }

    // Groq returns WAV
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (response.body) {
      // @ts-ignore
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.status(502).json({ error: "Empty response from Groq TTS service." });
    }
  } catch (err) {
    req.log?.error({ err }, "Groq TTS proxy failed");
    res.status(502).json({ error: "Groq TTS service unavailable or failed." });
  }
});

export default router;

