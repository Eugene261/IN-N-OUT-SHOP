/**
 * Rate limiter middleware to prevent brute force attacks
 * Limits the number of requests from a single IP address
 */

// Simple in-memory store for rate limiting
// In production, consider using Redis or another distributed store
const ipRequestMap = new Map();

/**
 * Rate limiter middleware factory
 * @param {Object} options - Configuration options
 * @param {number} options.maxRequests - Maximum number of requests allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.message - Error message to send when rate limit is exceeded
 * @returns {Function} Express middleware function
 */
const rateLimiter = ({ maxRequests = 5, windowMs = 60000, message = 'Too many requests, please try again later.' } = {}) => {
  return (req, res, next) => {
    // Get client IP address
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Current timestamp
    const now = Date.now();
    
    // Get or create record for this IP
    if (!ipRequestMap.has(ip)) {
      ipRequestMap.set(ip, { count: 0, resetTime: now + windowMs });
    }
    
    const record = ipRequestMap.get(ip);
    
    // Reset count if window has expired
    if (record.resetTime <= now) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    // Increment request count
    record.count += 1;
    
    // Check if rate limit is exceeded
    if (record.count > maxRequests) {
      // Calculate remaining time until reset
      const remainingMs = record.resetTime - now;
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      // Set rate limit headers
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      res.set('Retry-After', remainingSec);
      
      // Return rate limit error
      return res.status(429).json({
        success: false,
        message,
        retryAfter: remainingSec
      });
    }
    
    // Set rate limit headers for successful requests
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - record.count);
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    // Clean up old entries every 5 minutes
    if (now % 300000 < 1000) {
      for (const [key, value] of ipRequestMap.entries()) {
        if (value.resetTime <= now) {
          ipRequestMap.delete(key);
        }
      }
    }
    
    next();
  };
};

// Specific rate limiters for different routes
const authRateLimiter = rateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
  message: 'Too many login attempts, please try again after 1 minute.'
});

const apiRateLimiter = rateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  message: 'Rate limit exceeded. Please slow down your requests.'
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  apiRateLimiter
};
