/**
 * gemini-tts.ts — Google Gemini Text-to-Speech Route
 *
 * GET /api/gemini-tts?text=...&voice=puck|aoede|fenrir|kore|...
 *   Returns audio/wav (24kHz 16-bit mono PCM wrapped in WAV header).
 *   Uses GEMINI_API_KEY — separate from the chat AI so it still works
 *   even when the OpenRouter quota is exhausted.
 *
 * Voice options (Gemini prebuilt):
 *   Male:   puck (warm), charon (informative), fenrir (excitable), orbit (smooth)
 *   Female: aoede (breezy), kore (firm), zephyr (bright), celestia (upbeat)
 */

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_API_BASE  = "https://generativelanguage.googleapis.com/v1beta";

const VOICE_MAP: Record<string, string> = {
  puck:     "Puck",
  charon:   "Charon",
  fenrir:   "Fenrir",
  orbit:    "Orbit",
  aoede:    "Aoede",
  kore:     "Kore",
  zephyr:   "Zephyr",
  celestia: "Celestia",
};

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16): Buffer {
  const dataSize   = pcm.length;
  const byteRate   = sampleRate * channels * bits / 8;
  const blockAlign = channels * bits / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);   h.writeUInt32LE(36 + dataSize, 4);
  h.write("WAVE", 8);   h.write("fmt ",                12);
  h.writeUInt32LE(16,          16);
  h.writeUInt16LE(1,           20);
  h.writeUInt16LE(channels,    22);
  h.writeUInt32LE(sampleRate,  24);
  h.writeUInt32LE(byteRate,    28);
  h.writeUInt16LE(blockAlign,  32);
  h.writeUInt16LE(bits,        34);
  h.write("data",        36);   h.writeUInt32LE(dataSize, 40);
  return Buffer.concat([h, pcm]);
}

const ttsCache = new Map<string, Buffer>();
const CACHE_MAX = 300;

function ck(voice: string, text: string) { return `${voice}::${text.slice(0, 300)}`; }

router.get("/gemini-tts", async (req: Request, res: Response) => {
  const text  = typeof req.query?.text  === "string" ? req.query.text.trim()        : "";
  const voice = typeof req.query?.voice === "string" ? req.query.voice.toLowerCase() : "puck";

  if (!text) { res.status(400).json({ error: "Missing 'text' param" }); return; }

  const geminiKey = (process.env["GEMINI_API_KEY"] ?? "").trim();
  if (!geminiKey) { res.status(503).json({ error: "GEMINI_API_KEY not set" }); return; }

  const voiceName = VOICE_MAP[voice] ?? "Puck";
  const key = ck(voiceName, text);

  const cached = ttsCache.get(key);
  if (cached) {
    ttsCache.delete(key); ttsCache.set(key, cached); // bump LRU
    res.setHeader("Content-Type",   "audio/wav");
    res.setHeader("Cache-Control",  "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", String(cached.length));
    req.log?.info({ voice: voiceName, len: text.length, cached: true }, "Gemini TTS served");
    res.end(cached);
    return;
  }

  try {
    const url  = `${GEMINI_API_BASE}/models/${GEMINI_TTS_MODEL}:generateContent?key=${geminiKey}`;
    // Prefix with an explicit read-aloud instruction so the model never tries
    // to generate a text chat response instead of audio (happens on short inputs).
    const ttsInstruction = `Read this text aloud naturally: ${text}`;
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: ttsInstruction }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      req.log?.warn({ status: resp.status, body: errBody.slice(0, 300) }, "Gemini TTS API error");
      res.status(502).json({ error: `Gemini TTS ${resp.status}` });
      return;
    }

    type GeminiTTSResp = {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string } }> };
      }>;
    };

    const data = (await resp.json()) as GeminiTTSResp;
    const b64  = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";

    if (!b64) {
      req.log?.warn({ data: JSON.stringify(data).slice(0, 200) }, "Gemini TTS: no audio in response");
      res.status(502).json({ error: "Gemini TTS returned no audio" });
      return;
    }

    const pcm = Buffer.from(b64, "base64");
    const wav = pcmToWav(pcm);

    if (ttsCache.size >= CACHE_MAX) {
      const oldest = ttsCache.keys().next().value;
      if (oldest) ttsCache.delete(oldest);
    }
    ttsCache.set(key, wav);

    req.log?.info({ voice: voiceName, len: text.length, bytes: wav.length }, "Gemini TTS synthesised");
    res.setHeader("Content-Type",   "audio/wav");
    res.setHeader("Cache-Control",  "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", String(wav.length));
    res.end(wav);
  } catch (err) {
    req.log?.error({ err }, "Gemini TTS error");
    if (!res.headersSent) res.status(502).json({ error: "Gemini TTS error" });
  }
});

export default router;
