// @ts-nocheck
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts"; // ElevenLabs TTS — /api/voices and /api/tts/stream
import edgeTtsRouter from "./edge-tts"; // Microsoft Edge TTS — /api/edge-tts (free)
import geminiTtsRouter from "./gemini-tts"; // Gemini TTS — /api/gemini-tts
import configRouter from "./config"; // Client config — /api/config
import imageRouter from "./image"; // Image generation — /api/image
import kokoroTtsRouter from "./kokoro-tts"; // Kokoro TTS — /api/kokoro-tts
import groqTtsRouter from "./groq-tts"; // Groq TTS — /api/groq-tts
import authRouter from "./auth";
import userRouter from "./user";
import { createLevelTestRouter } from "../../../../lib/level-test-server";

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
router.use(authRouter);
router.use(userRouter);

// Venoxa Level Test — adaptive CEFR placement test (shared with api/index.ts).
// Draft items are only included locally when LEVEL_TEST_ALLOW_DRAFT=1.
router.use(
  "/level-test",
  createLevelTestRouter({
    pool,
    allowDraft: process.env.LEVEL_TEST_ALLOW_DRAFT === "1",
    appBaseUrl: process.env.LEVEL_TEST_VERIFY_BASE_URL,
  }),
);

export default router;
