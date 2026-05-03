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

router.post("/edge-tts-timed", async (req: Request, res: Response) => {
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

  req.log?.info({ voice, len: text.length }, "Edge TTS timed request");

  try {
    const tts = new MsEdgeTTS();
    // Must pass wordBoundaryEnabled=true so metadataStream is non-null
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
      wordBoundaryEnabled: true,
    });

    const wordBoundaries: Array<{ word: string; offsetMs: number; durationMs: number }> = [];
    const audioChunks: Buffer[] = [];

    const { audioStream, metadataStream } = tts.toStream(text);

    // Collect word boundaries from the metadata stream in parallel with audio
    const metaPromise = metadataStream
      ? new Promise<void>((resolve) => {
          metadataStream.on("data", (chunk: Buffer) => {
            try {
              // Each chunk is JSON: { Metadata: [{ Type, Data: { Offset, Duration, text: { Text } } }] }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parsed: any = JSON.parse(chunk.toString());
              const items: unknown[] = Array.isArray(parsed?.Metadata) ? parsed.Metadata : [];
              for (const item of items) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = (item as any)?.Data ?? {};
                const wordText: string = d?.text?.Text ?? d?.Text ?? "";
                const offset = Number(d?.Offset ?? 0);
                const duration = Number(d?.Duration ?? 0);
                if (wordText) {
                  wordBoundaries.push({
                    word: wordText,
                    offsetMs: Math.round(offset / 10000),
                    durationMs: Math.round(duration / 10000),
                  });
                }
              }
            } catch { /* ignore parse errors */ }
          });
          metadataStream.on("end", resolve);
          metadataStream.on("close", resolve);
          metadataStream.on("error", resolve); // don't fail the whole request
        })
      : Promise.resolve();

    const audioPromise = new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => audioChunks.push(chunk));
      audioStream.on("end", resolve);
      audioStream.on("close", () => { if (audioChunks.length > 0) resolve(); else reject(new Error("closed early")); });
      audioStream.on("error", reject);
    });

    await Promise.all([audioPromise, metaPromise]);

    const audioBase64 = Buffer.concat(audioChunks).toString("base64");
    req.log?.info({ voice, words: wordBoundaries.length }, "Edge TTS timed done");
    res.json({ audio: audioBase64, words: wordBoundaries });
  } catch (err) {
    req.log?.error({ err }, "Edge TTS timed failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Edge TTS timed failed." });
    }
  }
});

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
