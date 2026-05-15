import { Router } from "express";
import {
  chatHandler,
  chatStreamHandler,
  historyHandler,
} from "../controllers/clickbotController.js";
import { validateChatInput } from "../middleware/validateChatInput.js";

const router = Router();

router.post("/chat", validateChatInput, chatHandler);
router.get("/chat-stream", chatStreamHandler);
router.get("/history", historyHandler);

export default router;
