// @ts-nocheck
/**
 * tts.ts — ElevenLabs Text-to-Speech Route
 *
 * Provides two endpoints:
 *   GET  /api/voices      — Returns the list of available ElevenLabs voices.
 *   POST /api/tts/stream  — Accepts { textToSpeak, selectedVoiceId } and
 *                           streams back audio/mpeg from ElevenLabs.
 *
 * Key rotation: reads ELEVENLABS_API_KEY, ELEVENLABS_API_KEY_2,
 * ELEVENLABS_API_KEY_3 … in order. When a key hits quota/rate-limit it is
 * marked exhausted for 1 hour then retried automatically — so adding extra
 * keys makes quota effectively unlimited.
 *
 * Voice resolution strategy (free-plan compatible):
 *   1. Use the caller-supplied voice ID if one is given.
 *   2. Fall back to a single fast default voice.
 */

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

/** Base URL for the ElevenLabs v1 REST API. */
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// --------------------------------------------------------------------------
// Multi-key rotation
// --------------------------------------------------------------------------

const KEY_ENV_NAMES = [
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_API_KEY_2",
  "ELEVENLABS_API_KEY_3",
  "ELEVENLABS_API_KEY_4",
  "ELEVENLABS_API_KEY_5",
];

/** Keys that have hit quota/rate-limit, mapped to the timestamp when they
 *  were marked exhausted. Reset automatically after KEY_COOLDOWN_MS. */
const exhaustedKeys = new Map<string, number>();
const KEY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function getActiveKeys(): string[] {
  const now = Date.now();
  const active: string[] = [];
  for (const name of KEY_ENV_NAMES) {
    const key = process.env[name]?.trim();
    if (!key || key === "your_api_key_here") continue;
    const exhaustedAt = exhaustedKeys.get(key);
    if (exhaustedAt && now - exhaustedAt < KEY_COOLDOWN_MS) continue; // still cooling down
    if (exhaustedAt) exhaustedKeys.delete(key); // cooldown expired — allow retry
    active.push(key);
  }
  return active;
}

function markKeyExhausted(key: string): void {
  exhaustedKeys.set(key, Date.now());
}

function getNextKey(): string {
  const keys = getActiveKeys();
  if (keys.length === 0) {
    throw new Error(
      "All ElevenLabs API keys are exhausted or unconfigured. " +
        "Add ELEVENLABS_API_KEY (and optionally ELEVENLABS_API_KEY_2 … _5) to your environment variables.",
    );
  }
  return keys[0];
}

// --------------------------------------------------------------------------
// Voice resolution cache
// --------------------------------------------------------------------------

/** Default voice ID used when the caller doesn't specify one. */
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam

// --------------------------------------------------------------------------
// GET /api/voices
// --------------------------------------------------------------------------

router.get("/voices", async (req: Request, res: Response) => {
  let key: string;
  try {
    key = getNextKey();
  } catch (err) {
    req.log?.warn({ err }, "ElevenLabs key not configured");
    res.status(503).json({ error: (err as Error).message });
    return;
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { "xi-api-key": key, Accept: "application/json" },
    });

    if (!response.ok) {
      const body = await response.text();
      req.log?.error({ status: response.status, body }, "ElevenLabs voices error");
      res
        .status(response.status)
        .json({ error: `ElevenLabs API error: ${body.slice(0, 200)}` });
      return;
    }

    const data = (await response.json()) as {
      voices: Array<{
        voice_id: string;
        name: string;
        category?: string;
        labels?: Record<string, string>;
        preview_url?: string;
      }>;
    };

    const voices = (data.voices ?? []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category ?? "generated",
      accent: v.labels?.["accent"] ?? "",
      description: v.labels?.["description"] ?? "",
      preview_url: v.preview_url ?? "",
    }));

    res.json({ voices });
  } catch (err) {
    req.log?.error({ err }, "Failed to fetch ElevenLabs voices");
    res.status(502).json({ error: "Failed to fetch voices from ElevenLabs." });
  }
});

// --------------------------------------------------------------------------
// POST /api/tts/stream
// --------------------------------------------------------------------------

router.post("/tts/stream", async (req: Request, res: Response) => {
  const textToSpeak =
    typeof req.body?.textToSpeak === "string" ? req.body.textToSpeak.trim() : "";
  const requestedVoiceId =
    typeof req.body?.selectedVoiceId === "string"
      ? req.body.selectedVoiceId.trim()
      : "";

  if (!textToSpeak) {
    res.status(400).json({ error: "Missing 'textToSpeak' in request body." });
    return;
  }

  const voiceId = requestedVoiceId || DEFAULT_VOICE_ID;

  // Try each active key in order; if one is exhausted rotate to the next.
  const keysToTry = getActiveKeys();
  if (keysToTry.length === 0) {
    res.status(503).json({
      error:
        "All ElevenLabs API keys are exhausted. Add more keys via ELEVENLABS_API_KEY_2 … _5.",
    });
    return;
  }

  for (const key of keysToTry) {
    req.log?.info({ voiceId, keyIndex: keysToTry.indexOf(key) }, "ElevenLabs TTS request");

    try {
      const ttsResponse = await fetch(
        `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": key,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: textToSpeak,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.2,
              similarity_boost: 0.9,
              style: 0.45,
              use_speaker_boost: true,
            },
          }),
        },
      );

      // Quota or rate-limit — mark this key exhausted and try the next one
      if (ttsResponse.status === 401 || ttsResponse.status === 429) {
        const body = await ttsResponse.text().catch(() => "");
        req.log?.warn(
          { status: ttsResponse.status, body: body.slice(0, 200) },
          "ElevenLabs key exhausted — rotating to next key",
        );
        markKeyExhausted(key);
        continue; // try next key
      }

      if (!ttsResponse.ok) {
        const body = await ttsResponse.text();
        req.log?.error({ status: ttsResponse.status, body }, "ElevenLabs TTS error");
        res
          .status(ttsResponse.status)
          .json({ error: `ElevenLabs TTS error: ${body.slice(0, 300)}` });
        return;
      }

      // Success — stream audio back to the client
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      if (ttsResponse.body) {
        const reader = ttsResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else {
        res.end();
      }
      return; // done — don't try more keys
    } catch (err) {
      req.log?.error({ err }, "ElevenLabs TTS stream failed");
      if (!res.headersSent) {
        res.status(502).json({ error: "TTS streaming failed. Please try again." });
      }
      return;
    }
  }

  // All keys exhausted
  if (!res.headersSent) {
    res.status(503).json({
      error: "All ElevenLabs API keys are currently exhausted. Please try again later.",
    });
  }
});

export default router;

