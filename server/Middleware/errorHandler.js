/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses and logging across the application
 */

const mongoose = require('mongoose');

/**
 * Async wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error logging utility
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {string} context - Additional context for the error
 */
const logError = (error, req, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    status: error.status || error.statusCode,
    timestamp: new Date().toISOString(),
    url: req?.originalUrl,
    method: req?.method,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip || req?.connection?.remoteAddress,
    userId: req?.user?.id,
    context
  };

  console.error('🚨 Error Details:', JSON.stringify(errorInfo, null, 2));
};

/**
 * Development error response
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

/**
 * Production error response
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational errors (trusted): send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or unknown errors: don't leak error details
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle different types of errors
 */

// Handle MongoDB Cast Error (Invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

// Handle MongoDB Duplicate Field Error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use a different value.`;
  const error = new Error(message);
  error.statusCode = 409;
  error.isOperational = true;
  return error;
};

// Handle MongoDB Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

// Handle JWT Errors
const handleJWTError = () => {
  const error = new Error('Invalid token. Please log in again.');
  error.statusCode = 401;
  error.isOperational = true;
  return error;
};

const handleJWTExpiredError = () => {
  const error = new Error('Your token has expired. Please log in again.');
  error.statusCode = 401;
  error.isOperational = true;
  error.tokenExpired = true;
  return error;
};

// Handle Rate Limiting Error
const handleRateLimitError = () => {
  const error = new Error('Too many requests from this IP. Please try again later.');
  error.statusCode = 429;
  error.isOperational = true;
  return error;
};

/**
 * Global Error Handling Middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logError(err, req, 'Global Error Handler');

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.statusCode === 429) error = handleRateLimitError();

    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 errors for API routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

/**
 * Create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Custom error object
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

module.exports = {
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  createError,
  logError
}; 