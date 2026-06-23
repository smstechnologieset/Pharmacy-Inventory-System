import { AppError } from "../utils/AppError.js";

/**
 * Global Error Handler Middleware
 * Must be the last middleware in the app
 * Catches all errors and returns consistent JSON responses
 * Always returns JSON, NEVER HTML
 */
export const errorHandler = (err, req, res, next) => {
  // Prevent sending response twice
  if (res.headersSent) {
    return next(err);
  }

  // Set content type to JSON (prevent Express from sending HTML)
  res.setHeader("Content-Type", "application/json");

  // Log error details (useful for debugging)
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("❌ ERROR:", {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let statusCode = 500;
  let message = "Internal server error";
  let details = null;

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Firebase errors
  else if (err.code && err.code.startsWith("auth/")) {
    statusCode = 401;
    message = mapFirebaseAuthError(err.code);
  }
  // Handle Firebase Firestore errors
  else if (err.code && err.code.startsWith("firestore/")) {
    statusCode = 400;
    message = mapFirestoreError(err.code);
  }
  // Handle Web Push errors
  else if (err.statusCode === 410) {
    statusCode = 410;
    message = "Push subscription has expired or is invalid";
  } else if (err.statusCode === 429) {
    statusCode = 429;
    message = "Too many push notification requests";
  } else if (err.statusCode === 404) {
    statusCode = 404;
    message = "Push endpoint not found";
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }
  // Handle validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }
  // Handle MongoDB/Database errors (if applicable)
  else if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000) {
      statusCode = 409;
      message = "Duplicate entry - this record already exists";
      details = { field: Object.keys(err.keyPattern)[0] };
    } else {
      statusCode = 500;
      message = "Database error";
    }
  }
  // Handle JWT errors (if using JWT auth)
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or malformed token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  }
  // Default server error
  else {
    statusCode = err.statusCode || 500;
    message = err.message || "An unexpected error occurred";
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      status: statusCode,
      message,
      ...(details && { details }),
    },
    ...(process.env.NODE_ENV === "development" && {
      debug: {
        name: err.name,
        stack: err.stack,
      },
    }),
    timestamp: new Date().toISOString(),
  };

  // Send JSON response (never HTML)
  res.status(statusCode).json(errorResponse);
};

/**
 * Map Firebase authentication error codes to user-friendly messages
 */
const mapFirebaseAuthError = (code) => {
  const errorMap = {
    "auth/invalid-email": "Invalid email address",
    "auth/email-already-in-use": "Email is already registered",
    "auth/weak-password": "Password is too weak (minimum 6 characters)",
    "auth/user-not-found": "User account not found",
    "auth/wrong-password": "Incorrect password",
    "auth/user-disabled": "User account has been disabled",
    "auth/too-many-requests": "Too many login attempts, please try again later",
    "auth/account-exists-with-different-credential":
      "Account exists with different credentials",
    "auth/invalid-credential": "Invalid credentials",
    "auth/operation-not-allowed": "This operation is not allowed",
    "auth/invalid-api-key": "Invalid API configuration",
  };

  return errorMap[code] || "Authentication error";
};

/**
 * Map Firestore error codes to user-friendly messages
 */
const mapFirestoreError = (code) => {
  const errorMap = {
    "firestore/permission-denied":
      "You do not have permission to access this resource",
    "firestore/not-found": "The requested resource was not found",
    "firestore/already-exists": "The resource already exists",
    "firestore/failed-precondition": "Operation preconditions failed",
    "firestore/aborted": "Operation was aborted",
    "firestore/out-of-range": "The provided value is out of range",
    "firestore/unauthenticated": "User is not authenticated",
    "firestore/invalid-argument": "Invalid argument provided",
    "firestore/deadline-exceeded": "Request deadline exceeded",
    "firestore/internal": "Internal server error",
  };

  return errorMap[code] || "Database error";
};

/**
 * 404 Not Found middleware - captures unmatched routes
 * Must be placed AFTER all route definitions and BEFORE error handler
 * Converts 404s to JSON responses instead of HTML
 */
export const notFoundHandler = (req, res, next) => {
  // Set content type to JSON
  res.setHeader("Content-Type", "application/json");

  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );

  // Pass error to error handler
  next(error);
};

/**
 * Wrapper to catch errors in async middleware
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
