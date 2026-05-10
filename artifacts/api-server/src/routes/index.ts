import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts"; // ElevenLabs TTS — /api/voices and /api/tts/stream
import edgeTtsRouter from "./edge-tts"; // Microsoft Edge TTS — /api/edge-tts (free)
import geminiTtsRouter from "./gemini-tts"; // Gemini TTS — /api/gemini-tts
import configRouter from "./config"; // Client config — /api/config
import imageRouter from "./image"; // Image generation — /api/image
import kokoroTtsRouter from "./kokoro-tts"; // Kokoro TTS — /api/kokoro-tts
import groqTtsRouter from "./groq-tts"; // Groq TTS — /api/groq-tts

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter);
router.use(edgeTtsRouter);
router.use(geminiTtsRouter);
router.use(configRouter);
router.use(imageRouter);
router.use(kokoroTtsRouter);
router.use(groqTtsRouter);

export default router;
