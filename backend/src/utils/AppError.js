/**
 * Custom Error Class for API
 * Allows consistent error responses across the application
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error - 409 (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

/**
 * Service Unavailable Error - 503
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, 503);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Internal Server Error - 500
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500);
    this.name = "InternalServerError";
  }
}
