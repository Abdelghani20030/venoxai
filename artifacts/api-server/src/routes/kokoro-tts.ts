// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";

const router: IRouter = Router();

/**
 * GET /api/kokoro-tts?text=...&voice=...
 * Proxies to a Kokoro-FastAPI instance (OpenAI-compatible TTS endpoint).
 * Default URL is http://localhost:8888 (standard Docker port for Kokoro-FastAPI).
 */
router.get("/kokoro-tts", async (req: Request, res: Response) => {
  const text = typeof req.query.text === "string" ? req.query.text.trim() : "";
  const voice = typeof req.query.voice === "string" ? req.query.voice.trim() : "af_heart";
  const speed = typeof req.query.speed === "string" ? parseFloat(req.query.speed) : 1.0;
  
  const baseUrl = (process.env.KOKORO_BASE_URL || "http://localhost:8888").replace(/\/$/, "");
  
  if (!text) {
    res.status(400).json({ error: "Missing 'text' query parameter." });
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: text,
        voice: voice,
        model: "kokoro",
        response_format: "mp3",
        speed: isNaN(speed) ? 1.0 : speed
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log?.error({ status: response.status, body: errText }, "Kokoro service error");
      throw new Error(`Kokoro service returned ${response.status}`);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (response.body) {
      // @ts-ignore - Readable.fromWeb works in Node 18+ undici-based fetch
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.status(502).json({ error: "Empty response from Kokoro service." });
    }
  } catch (err) {
    req.log?.error({ err }, "Kokoro TTS proxy failed");
    res.status(502).json({ error: "Kokoro TTS service unavailable. Ensure the backend is running." });
  }
});

export default router;

