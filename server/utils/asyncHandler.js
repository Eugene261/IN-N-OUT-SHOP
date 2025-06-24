/**
 * Async handler wrapper to catch errors in async route handlers
 * Automatically passes any errors to the next middleware (error handler)
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 