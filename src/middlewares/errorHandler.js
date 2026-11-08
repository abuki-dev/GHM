const env = require("../config/env");

function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}
function errorHandler(err, req, res, next) {
  // 1. Log error stack trace on the server for debugging
  console.error(err);

  // 2. Delegate to Express default handler if HTTP headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong";

  // --- MONGOOSE / MONGODB ERRORS ---

  // Invalid ObjectId (e.g., Cast to ObjectId failed for value "123")
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate Key Error (e.g., unique email or username already taken)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for '${field}'. Please use another value.`;
  }

  // Schema Validation Error (e.g., required fields, minlength, enum mismatch)
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((el) => el.message);
    message = `Invalid input data: ${errors.join(". ")}`;
  }

  // --- EXPRESS & BODY PARSER ERRORS ---

  // Malformed JSON sent in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON syntax in request body.";
  }

  // --- AUTHENTICATION & JWT ERRORS ---

  // Invalid Token Signature / Malformed Token
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  // Expired Token
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session token has expired. Please log in again.";
  }

  // --- RESPONSE STRUCTURE ---

  res.status(statusCode).json({
    success: false,
    error:
      statusCode === 500 && env.NODE_ENV === "production"
        ? "Internal server error"
        : message,
    // Include stack trace only in local development
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
