import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts"; // ElevenLabs TTS — /api/voices and /api/tts/stream
import configRouter from "./config"; // Client config — /api/config

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter); // Mount TTS endpoints
router.use(configRouter); // Mount config endpoint

export default router;
