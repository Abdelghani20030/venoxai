/**
 * edge-tts.ts — Microsoft Edge TTS Route (free, unlimited, no API key)
 *
 * POST /api/edge-tts
 *   body: { text: string, voice?: string, gender?: 'male' | 'female' }
 *   response: streams audio/mpeg
 *
 * Uses the same WebSocket endpoint Microsoft Edge uses for its built-in
 * "Read aloud" feature. No API key, no signup, no quota.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const router: IRouter = Router();

const VOICE_MALE = "en-GB-RyanNeural";
const VOICE_FEMALE = "en-GB-SoniaNeural";

router.post("/edge-tts", async (req: Request, res: Response) => {
  const text =
    typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Missing 'text' in request body." });
    return;
  }

  const requestedVoice =
    typeof req.body?.voice === "string" ? req.body.voice.trim() : "";
  const gender = req.body?.gender === "female" ? "female" : "male";
  const voice =
    requestedVoice || (gender === "female" ? VOICE_FEMALE : VOICE_MALE);

  req.log?.info({ voice, len: text.length }, "Edge TTS request");

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );
    const { audioStream } = tts.toStream(text);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");

    audioStream.on("data", (chunk: Buffer) => {
      res.write(chunk);
    });
    audioStream.on("end", () => {
      res.end();
    });
    audioStream.on("close", () => {
      if (!res.writableEnded) res.end();
    });
    audioStream.on("error", (err: Error) => {
      req.log?.error({ err }, "Edge TTS stream error");
      if (!res.headersSent) {
        res.status(502).json({ error: "Edge TTS stream failed." });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  } catch (err) {
    req.log?.error({ err }, "Edge TTS init failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Edge TTS failed to initialise." });
    }
  }
});

export default router;
