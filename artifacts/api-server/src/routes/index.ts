import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts"; // ElevenLabs TTS — /api/voices and /api/tts/stream

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter); // Mount TTS endpoints

export default router;
