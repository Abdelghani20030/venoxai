import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts"; // ElevenLabs TTS — /api/voices and /api/tts/stream
import edgeTtsRouter from "./edge-tts"; // Microsoft Edge TTS — /api/edge-tts (free)
import geminiTtsRouter from "./gemini-tts"; // Gemini TTS — /api/gemini-tts
import configRouter from "./config"; // Client config — /api/config

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter);
router.use(edgeTtsRouter);
router.use(geminiTtsRouter);
router.use(configRouter);

export default router;
