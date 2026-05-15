export function validateTaskInput(req, res, next) {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Text is required and must be a non-empty string",
    });
  }

  req.body.text = text.trim();
  next();
}
