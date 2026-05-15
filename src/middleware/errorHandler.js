export function errorHandler(err, req, res, next) {
  console.error(`Error in ${req.method} ${req.originalUrl}:`, err);

  res.status(err.status || 500).json({
    success: false,
    error: err.publicMessage || "Internal server error",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
