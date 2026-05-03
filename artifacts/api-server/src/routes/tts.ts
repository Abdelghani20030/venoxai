/**
 * tts.ts — ElevenLabs Text-to-Speech Route
 *
 * Provides two endpoints:
 *   GET  /api/voices      — Returns the list of available ElevenLabs voices.
 *   POST /api/tts/stream  — Accepts { textToSpeak, selectedVoiceId } and
 *                           streams back audio/mpeg from ElevenLabs.
 *
 * The API key is read exclusively from the ELEVENLABS_API_KEY environment
 * variable.
 *
 * Voice resolution strategy (free-plan compatible):
 *   1. Use the caller-supplied voice ID if one is given.
 *   2. Try to fetch the account's own voices (requires voices_read scope).
 *      Pick the first generated/cloned voice which is always accessible.
 *   3. Fall back to a single fast default voice.
 *   4. Cache the first working voice ID in memory for the server lifetime.
 */

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

/** Base URL for the ElevenLabs v1 REST API. */
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

/**
 * Default voices that we can probe quickly. This list is intentionally short
 * to keep the first request fast.
 */
const FREE_PLAN_FALLBACK_VOICES = [
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
];

function getElevenLabsKey(): string {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key || key === "your_api_key_here" || key.trim() === "") {
    throw new Error(
      "ELEVENLABS_API_KEY is not configured. Add it to your environment variables.",
    );
  }
  return key.trim();
}

// --------------------------------------------------------------------------
// Voice resolution cache
// --------------------------------------------------------------------------

/** Cached working voice ID — resolved lazily and reused. */
let cachedDefaultVoiceId: string | null = "pNInz6obpgDQGcFmaJgB";

/**
 * Tries to resolve the best default voice for this account.
 *
 * Priority:
 *   1. Fetch account voices (if voices_read scope is available) and pick
 *      the first generated/cloned voice.
 *   2. Fall back to the fast default voice immediately.
 */
async function resolveDefaultVoiceId(key: string): Promise<string> {
  if (cachedDefaultVoiceId) return cachedDefaultVoiceId;

  // --- Attempt 1: use the account's own voices list ---
  try {
    const voicesRes = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { "xi-api-key": key, Accept: "application/json" },
    });

    if (voicesRes.ok) {
      const data = (await voicesRes.json()) as {
        voices: Array<{ voice_id: string; name: string; category?: string }>;
      };
      const voices = data.voices ?? [];
      // Prefer account-owned (generated / cloned) which are always accessible.
      const owned = voices.find(
        (v) => v.category === "generated" || v.category === "cloned",
      );
      if (owned) {
        cachedDefaultVoiceId = owned.voice_id;
        return cachedDefaultVoiceId;
      }
      // Take whatever is first if no owned voices
      if (voices.length > 0) {
        cachedDefaultVoiceId = voices[0].voice_id;
        return cachedDefaultVoiceId;
      }
    }
    // If voices_read is missing (403) or any other error, fall through
  } catch {
    // Network / parse error — fall through to probe strategy
  }

  return FREE_PLAN_FALLBACK_VOICES[0].id;
}

// --------------------------------------------------------------------------
// GET /api/voices
// --------------------------------------------------------------------------

router.get("/voices", async (req: Request, res: Response) => {
  let key: string;
  try {
    key = getElevenLabsKey();
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
  let key: string;
  try {
    key = getElevenLabsKey();
  } catch (err) {
    req.log?.warn({ err }, "ElevenLabs key not configured");
    res.status(503).json({ error: (err as Error).message });
    return;
  }

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

  let voiceId: string;
  try {
    voiceId = requestedVoiceId || (await resolveDefaultVoiceId(key));
  } catch (err) {
    req.log?.error({ err }, "Could not resolve a usable ElevenLabs voice");
    res.status(503).json({ error: (err as Error).message });
    return;
  }

  req.log?.info({ voiceId }, "ElevenLabs TTS request");

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

    if (!ttsResponse.ok) {
      const body = await ttsResponse.text();
      req.log?.error({ status: ttsResponse.status, body }, "ElevenLabs TTS error");

      // Clear cache so the next request will probe for a new working voice
      if (ttsResponse.status === 402 || ttsResponse.status === 403) {
        cachedDefaultVoiceId = null;
      }

      res
        .status(ttsResponse.status)
        .json({ error: `ElevenLabs TTS error: ${body.slice(0, 300)}` });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    if (ttsResponse.body) {
      const reader = ttsResponse.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err) {
    req.log?.error({ err }, "ElevenLabs TTS stream failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "TTS streaming failed. Please try again." });
    }
  }
});

export default router;
