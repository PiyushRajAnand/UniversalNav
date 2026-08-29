const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Always log the real error on the backend.
  console.error("❌ Backend Error:", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    error: isProduction
      ? statusCode === 404
        ? "Resource not found"
        : "Unable to process your request"
      : err.message || "Server error",

    // Stack is available only during development.
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};