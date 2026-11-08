// utils/appError.js
module.exports.AppError = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Marks errors created intentionally by business logic

    Error.captureStackTrace(this, this.constructor);
  }
};

module.exports.BadRequestError = class BadRequestError extends (
  module.exports.AppError
) {
  constructor(message = "Bad request") {
    super(message, 400);
  }
};

module.exports.UnauthorizedError = class UnauthorizedError extends (
  module.exports.AppError
) {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
};

module.exports.ConflictError = class ConflictError extends (
  module.exports.AppError
) {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
};
