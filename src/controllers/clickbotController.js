import { clickbotChat } from "../services/clickbot/clickbotChat.js";
import { findAllHistory } from "../services/clickbot/chatHistoryRepo.js";

export async function chatHandler(req, res, next) {
  try {
    const { message } = req.body;

    let reply = "";
    for await (const chunk of clickbotChat(message)) {
      reply += chunk;
    }

    res.status(200).json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    next(error);
  }
}

export async function chatStreamHandler(req, res) {
  const message = req.query.message?.trim();
  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message query param is required",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    for await (const chunk of clickbotChat(message)) {
      res.write(`data: ${chunk}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    res.write(`data: [ERROR] ${error.message}\n\n`);
    res.end();
  }
}

export async function historyHandler(req, res, next) {
  try {
    const data = await findAllHistory();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
