# Global Error Handling Implementation

## Overview

This document describes the comprehensive error handling system implemented in
the Pharmacy Inventory System backend API. The system provides:

- **Structured Error Responses** - Consistent JSON error format across all
  endpoints
- **Custom Error Classes** - Specialized error types for different scenarios
- **Async Error Catching** - Automatic error propagation from async handlers
- **Request Validation** - Built-in validation middleware
- **Error Logging** - Detailed console logging for debugging
- **Environment-Aware Responses** - Development includes stack traces;
  production hides details

---

## Error Handling Components

### 1. **Custom Error Classes** (`src/utils/AppError.js`)

#### AppError (Base Class)

```javascript
import { AppError } from "../utils/AppError.js";

// Usage
throw new AppError("Something went wrong", 500);
```

#### Specific Error Types

| Error Class               | HTTP Status | Use Case              |
| ------------------------- | ----------- | --------------------- |
| `ValidationError`         | 400         | Invalid request data  |
| `AuthenticationError`     | 401         | Login/auth failures   |
| `AuthorizationError`      | 403         | Permission denied     |
| `NotFoundError`           | 404         | Resource not found    |
| `ConflictError`           | 409         | Duplicate entries     |
| `ServiceUnavailableError` | 503         | External service down |
| `InternalServerError`     | 500         | Unexpected errors     |

#### Examples

```javascript
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ConflictError
} from '../utils/AppError.js';

// Validation
if (!subscription.endpoint) {
  throw new ValidationError('Invalid subscription object');
}

// Not Found
const user = await db.collection('users').doc(userId).get();
if (!user.exists) {
  throw new NotFoundError('User');
}

// Conflict
if (email already exists) {
  throw new ConflictError('Email is already registered');
}

// Authentication
if (wrong password) {
  throw new AuthenticationError('Invalid credentials');
}
```

---

### 2. **Async Error Handler** (`src/utils/asyncHandler.js`)

Wraps async route handlers to catch errors and pass to middleware automatically:

```javascript
import asyncHandler from "../utils/asyncHandler.js";

// Without asyncHandler (manual try-catch required)
app.post("/subscribe", async (req, res, next) => {
  try {
    // handler code
  } catch (error) {
    next(error);
  }
});

// With asyncHandler (errors caught automatically)
app.post(
  "/subscribe",
  asyncHandler(async (req, res, next) => {
    // handler code - errors automatically passed to error middleware
  }),
);
```

---

### 3. **Validation Middleware** (`src/middleware/validation.js`)

#### validateBody - Validate required fields

```javascript
import { validateBody } from "../middleware/validation.js";

app.post(
  "/subscribe",
  validateBody(["subscription", "userId"]),
  async (req, res, next) => {
    // request body guaranteed to have subscription and userId
  },
);
```

#### validateQuery - Validate query parameters

```javascript
import { validateQuery } from "../middleware/validation.js";

app.get("/notifications", validateQuery(["userId"]), async (req, res, next) => {
  // query guaranteed to have userId parameter
});
```

---

### 4. **Global Error Handler Middleware** (`src/middleware/errorHandler.js`)

The central error handler that catches and formats all errors:

#### Features

- Handles custom `AppError` instances
- Maps Firebase auth errors to user-friendly messages
- Maps Firestore errors
- Handles Web Push errors (410, 429, 404)
- Handles JSON parsing errors
- Handles database errors
- Handles JWT errors (if using JWT)
- Provides stack traces in development mode
- Includes timestamp on all responses

#### Example Error Response (Development)

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Missing required fields: subscription, userId"
  },
  "debug": {
    "name": "ValidationError",
    "stack": "ValidationError: Missing required fields...\n    at..."
  },
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

#### Example Error Response (Production)

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Missing required fields: subscription, userId"
  },
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

#### 404 Not Found Handler

```javascript
import { notFoundHandler } from "../middleware/errorHandler.js";

// In server setup, place before error handler
app.use(notFoundHandler); // Catches undefined routes
app.use(errorHandler); // Handles all errors
```

---

## Usage Guide

### Pattern 1: Simple Error Handling (Recommended)

```javascript
import { ValidationError, NotFoundError } from "../utils/AppError.js";

export const subscribe = async (req, res, next) => {
  try {
    const { subscription, userId } = req.body;

    // Throw specific errors
    if (!subscription?.endpoint) {
      throw new ValidationError("Invalid subscription object");
    }

    // Database operations
    const db = getFirestore();
    await db.collection("subscriptions").doc(userId).set({ subscription });

    res.json({ success: true, message: "Subscribed" });
  } catch (error) {
    // All errors automatically handled by middleware
    next(error);
  }
};
```

### Pattern 2: Using asyncHandler (Most Concise)

```javascript
import asyncHandler from "../utils/asyncHandler.js";
import { ValidationError } from "../utils/AppError.js";

export const subscribe = asyncHandler(async (req, res, next) => {
  const { subscription, userId } = req.body;

  if (!subscription?.endpoint) {
    throw new ValidationError("Invalid subscription object");
  }

  const db = getFirestore();
  await db.collection("subscriptions").doc(userId).set({ subscription });

  res.json({ success: true, message: "Subscribed" });
});
```

### Pattern 3: With Validation Middleware

```javascript
import asyncHandler from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validation.js";

// In routes file
router.post(
  "/subscribe",
  validateBody(["subscription", "userId"]), // Validates request body
  asyncHandler(async (req, res) => {
    // Body is guaranteed to have required fields
    const db = getFirestore();
    await db.collection("subscriptions").doc(req.body.userId).set({
      subscription: req.body.subscription,
    });
    res.json({ success: true });
  }),
);
```

---

## Implementing in Existing Controllers

### Before (Current Pattern)

```javascript
export const subscribe = async (req, res) => {
  try {
    if (!req.body.subscription) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    // handler...
    res.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
};
```

### After (New Pattern)

```javascript
import { ValidationError, InternalServerError } from "../utils/AppError.js";

export const subscribe = async (req, res, next) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription?.endpoint) {
      throw new ValidationError("Invalid subscription object");
    }

    // handler...
    res.json({ success: true });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};
```

---

## Error Mapping Examples

### Firebase Authentication Errors

```
auth/invalid-email               → Invalid email address
auth/email-already-in-use        → Email is already registered
auth/weak-password               → Password is too weak
auth/user-not-found              → User account not found
auth/wrong-password              → Incorrect password
auth/too-many-requests           → Too many login attempts
```

### Firestore Errors

```
firestore/permission-denied      → You do not have permission
firestore/not-found              → The requested resource not found
firestore/already-exists         → The resource already exists
firestore/unauthenticated        → User is not authenticated
```

### Web Push Errors

```
410 Gone                         → Subscription has expired
429 Too Many Requests            → Too many notification requests
404 Not Found                    → Push endpoint not found
```

---

## Testing Error Handling

### Test Invalid Subscription

```bash
curl -X POST pharmacy-inventory-system-production-6e12.up.railway.app/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Invalid subscription object"
  },
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

### Test Missing Fields

```bash
curl -X POST pharmacy-inventory-system-production-6e12.up.railway.app/api/notifications/check-stock \
  -H "Content-Type: application/json" \
  -d '{"medicineName": "Aspirin"}'
```

**Expected Response:**

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Medicine details are required"
  },
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

### Test Undefined Route

```bash
curl pharmacy-inventory-system-production-6e12.up.railway.app/api/undefined-route
```

**Expected Response:**

```json
{
  "success": false,
  "error": {
    "status": 404,
    "message": "Route /api/undefined-route not found"
  },
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

---

## Best Practices

1. **Always throw specific errors** instead of generic messages

   ```javascript
   // ✅ Good
   throw new ValidationError("Email is already registered");
   throw new NotFoundError("User");

   // ❌ Avoid
   throw new Error("Error");
   ```

2. **Let the middleware handle errors** - don't send responses in catch blocks

   ```javascript
   // ✅ Good
   catch (error) {
     next(error);
   }

   // ❌ Avoid
   catch (error) {
     res.status(500).json({ error: error.message });
   }
   ```

3. **Use asyncHandler for cleaner code**

   ```javascript
   // ✅ Good - no try-catch needed
   export const handler = asyncHandler(async (req, res) => {
     // code here
   });

   // ❌ Avoid
   export const handler = async (req, res, next) => {
     try {
       // code here
     } catch (error) {
       next(error);
     }
   };
   ```

4. **Validate at middleware level** for common patterns

   ```javascript
   // ✅ Good - reusable and declarative
   router.post('/endpoint', validateBody(['field1', 'field2']), handler);

   // ❌ Avoid - repetitive
   export const handler = async (req, res, next) => {
     if (!req.body.field1) throw new ValidationError(...);
     if (!req.body.field2) throw new ValidationError(...);
   };
   ```

5. **Log errors appropriately** - middleware already logs, don't duplicate

   ```javascript
   // ✅ Good - let middleware log
   catch (error) {
     next(error);
   }

   // ❌ Avoid
   catch (error) {
     console.error('Error:', error);
     next(error);
   }
   ```

---

## Migration Checklist

- [x] Create `AppError.js` with custom error classes
- [x] Create `asyncHandler.js` for async error handling
- [x] Create `validation.js` middleware
- [x] Update `errorHandler.js` middleware
- [x] Update `index.js` with 404 handler
- [ ] Update remaining controllers to use new error handling
- [ ] Update routes to use validation middleware
- [ ] Test all endpoints for proper error responses
- [ ] Update frontend error handling to match new response format

---

## Response Format Specification

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {/* response data */},
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "status": 400,
    "message": "Human-readable error message",
    "details": {/* optional additional details */}
  },
  "timestamp": "2026-06-23T10:30:00.000Z",
  "debug": {/* only in development mode */}
}
```

---

## Next Steps

1. **Update remaining controllers** to use new error handling
2. **Add validation middleware** to all routes
3. **Test error scenarios** comprehensively
4. **Update frontend** to handle new error response format
5. **Document API errors** in API documentation

---

## Support

For issues or questions about error handling, refer to:

- `src/utils/AppError.js` - Error class definitions
- `src/utils/asyncHandler.js` - Async error wrapper
- `src/middleware/errorHandler.js` - Global error handler
- `src/middleware/validation.js` - Validation middleware
