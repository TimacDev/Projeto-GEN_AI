export function validateChatInput(req, res, next) {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Message is required and must be a non-empty string",
    });
  }

  req.body.message = message.trim();
  next();
}
