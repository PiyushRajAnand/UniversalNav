// ============================================================
// 404 NOT FOUND
// ============================================================

const notFound = (req, res, next) => {
  const error = new Error(
    `Not Found - ${req.originalUrl}`
  );

  res.status(404);

  return next(error);
};

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

const errorHandler = (err, req, res, next) => {
  let statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;

  let publicMessage =
    "Unable to process your request.";

  // ==========================================================
  // MONGOOSE CAST ERROR
  // ==========================================================

  if (err.name === "CastError") {
    statusCode = 400;
    publicMessage = "Invalid request data.";
  }

  // ==========================================================
  // MONGOOSE VALIDATION ERROR
  // ==========================================================

  else if (err.name === "ValidationError") {
    statusCode = 400;
    publicMessage = "Invalid request data.";
  }

  // ==========================================================
  // MONGODB DUPLICATE KEY ERROR
  // ==========================================================

  else if (err.code === 11000) {
    statusCode = 409;
    publicMessage =
      "A resource with the provided information already exists.";
  }

  // ==========================================================
  // 404
  // ==========================================================

  else if (statusCode === 404) {
    publicMessage = "Resource not found.";
  }

  // ==========================================================
  // BACKEND LOGGING
  // ==========================================================

  console.error("❌ Backend Error:", {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  // ==========================================================
  // DEVELOPMENT VS PRODUCTION
  // ==========================================================

  const isProduction =
    process.env.NODE_ENV === "production";

  // ==========================================================
  // RESPONSE
  // ==========================================================

  return res.status(statusCode).json({
    success: false,

    error: isProduction
      ? publicMessage
      : err.message || publicMessage,

    ...(isProduction
      ? {}
      : {
          stack: err.stack,
        }),
  });
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  notFound,
  errorHandler,
};