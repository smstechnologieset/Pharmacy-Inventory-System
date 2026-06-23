/**
 * Async Handler - Wraps async route handlers to catch errors
 * Prevents the need for try-catch in every controller function
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
