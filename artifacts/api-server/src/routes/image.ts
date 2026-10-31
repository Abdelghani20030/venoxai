// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// ─── Hugging Face Inference API helper ────────────────────────────────────────
// Uses FLUX.1-schnell via Hugging Face Router endpoint.
// Requires HF_TOKEN in environment (free from https://huggingface.co/settings/tokens).
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

async function generateWithHuggingFace(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  token: string,
): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/jpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width,
          height,
          seed,
          num_inference_steps: 4,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(`[image] HF router returned ${response.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const buf = Buffer.from(await response.arrayBuffer());
    return buf.length > 1024 ? buf : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[image] HF request failed:", (err as Error).message);
    return null;
  }
}

// ─── Pollinations.ai (Pollen Key & Free Fallback) ──────────────────────────────
async function generateWithPollinations(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  pollKey: string,
): Promise<{ buf: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  // If a pollen key is available, use the authenticated gen.pollinations.ai endpoint (unthrottled)
  const pollUrl = pollKey
    ? `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&seed=${seed}&key=${encodeURIComponent(pollKey)}`
    : `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;

  const headers: Record<string, string> = {};
  if (pollKey) {
    headers["Authorization"] = `Bearer ${pollKey}`;
  }

  try {
    const response = await fetch(pollUrl, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(`[image] Pollinations returned ${response.status}: ${errText.slice(0, 160)}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await response.arrayBuffer());
    return buf.length > 1024 ? { buf, contentType } : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[image] Pollinations request failed:", (err as Error).message);
    return null;
  }
}

/**
 * GET /api/image?prompt=...&seed=...&width=...&height=...
 *
 * 1. Hugging Face Inference API (if HF_TOKEN is configured)
 * 2. Authenticated Pollinations API (POLLINATIONS_API_KEY from .env — zero rate limits)
 * 3. Free Pollinations fallback or redirect
 */
router.get("/image", async (req: Request, res: Response) => {
  const prompt = typeof req.query.prompt === "string" ? req.query.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' query parameter." });
    return;
  }

  const seedStr = typeof req.query.seed === "string" ? req.query.seed : String(Math.floor(Math.random() * 1_000_000));
  const seed = parseInt(seedStr, 10) || Math.floor(Math.random() * 1_000_000);
  const widthStr = typeof req.query.width === "string" ? req.query.width : "512";
  const heightStr = typeof req.query.height === "string" ? req.query.height : "512";
  // Standardize sizes to 512 for fast rendering and reliable backend generation
  const width = Math.min(Math.max(parseInt(widthStr, 10) || 512, 256), 1024);
  const height = Math.min(Math.max(parseInt(heightStr, 10) || 512, 256), 1024);

  const hfToken = process.env.HF_TOKEN?.trim() || "";
  const pollKey = process.env.POLLINATIONS_API_KEY?.trim() || "";

  // 1. Try Hugging Face if HF_TOKEN is provided
  if (hfToken) {
    const buf = await generateWithHuggingFace(prompt, width, height, seed, hfToken);
    if (buf) {
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Image-Source", "huggingface");
      res.end(buf);
      return;
    }
    console.warn("[image] HF failed, falling back to Pollinations...");
  }

  // 2. Pollinations (uses key if available)
  const pollResult = await generateWithPollinations(prompt, width, height, seed, pollKey);
  if (pollResult) {
    res.setHeader("Content-Type", pollResult.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Image-Source", pollKey ? "pollinations-authenticated" : "pollinations-free");
    res.end(pollResult.buf);
    return;
  }

  // 3. Fallback: direct redirect
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
  res.redirect(fallbackUrl);
});

export default router;
