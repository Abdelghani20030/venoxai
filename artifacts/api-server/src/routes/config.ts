/**
 * config.ts — Client configuration endpoint
 *
 * GET /api/config
 *
 * Returns configuration the frontend needs to call third-party APIs directly
 * from the browser (avoids server-IP abuse detection on ElevenLabs free tier).
 */

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/config", (_req: Request, res: Response) => {
  const key = process.env["ELEVENLABS_API_KEY"]?.trim() ?? "";
  res.json({
    elevenLabsApiKey: key && key !== "your_api_key_here" ? key : "",
  });
});

export default router;
