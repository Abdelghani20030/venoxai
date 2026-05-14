// @ts-nocheck
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

/**
 * GET /api/image?prompt=...&seed=...&model=...
 * Proxies to pollinations.ai for image generation.
 * This version PROXIES the data instead of redirecting, which is more reliable
 * across different network environments and avoids Mixed Content or CORS issues
 * in some browsers when running on localhost vs network IP.
 */
router.get("/image", async (req: Request, res: Response) => {
  const prompt = typeof req.query.prompt === "string" ? req.query.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' query parameter." });
    return;
  }

  const seed = typeof req.query.seed === "string" ? req.query.seed : Math.floor(Math.random() * 1000000).toString();
  const model = typeof req.query.model === "string" ? req.query.model : "flux";
  const width = typeof req.query.width === "string" ? req.query.width : "640";
  const height = typeof req.query.height === "string" ? req.query.height : "420";

  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=${model}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(pollUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Pollinations API returned ${response.status}`);
    }

    // Copy relevant headers
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    // Stream the body to the client
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } else {
      res.status(502).json({ error: "Empty response from image service." });
    }
  } catch (err) {
    req.log?.error({ err }, "Image proxy failed, redirecting to fallback");
    // If the proxy fails or times out, redirect as a robust fallback
    res.redirect(pollUrl);
  }
});

export default router;

