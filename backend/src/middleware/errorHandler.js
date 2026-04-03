// backend/src/middleware/errorHandler.js - Standardized Error Response Middleware

/**
 * Standardized error response middleware
 * Ensures all API responses follow consistent error format
 */

/**
 * Standard error response format
 * Always returns: res.status(code).json({ error: "message" })
 */
class ErrorHandler {
  /**
   * Send standardized error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} additionalData - Additional error data (optional)
   */
  static sendError(res, statusCode, message, additionalData = {}) {
    const errorResponse = {
      error: message,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    console.error(`❌ [${statusCode}] ${message}`, additionalData);
    
    return res.status(statusCode).json(errorResponse);
  }

  /**
   * Send validation error response (400)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors (optional)
   */
  static validationError(res, message, errors = null) {
    return this.sendError(res, 400, message, {
      code: 'VALIDATION_ERROR',
      errors: errors
    });
  }

  /**
   * Send unauthorized error response (401)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.sendError(res, 401, message, {
      code: 'UNAUTHORIZED'
    });
  }

  /**
   * Send forbidden error response (403)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.sendError(res, 403, message, {
      code: 'FORBIDDEN'
    });
  }

  /**
   * Send not found error response (404)
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name (optional)
   */
  static notFound(res, resource = 'Resource') {
    return this.sendError(res, 404, `${resource} not found`, {
      code: 'NOT_FOUND'
    });
  }

  /**
   * Send conflict error response (409)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message) {
    return this.sendError(res, 409, message, {
      code: 'CONFLICT'
    });
  }

  /**
   * Send server error response (500)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Error} error - Original error (optional)
   */
  static serverError(res, message = 'Internal server error', error = null) {
    const additionalData = {
      code: 'SERVER_ERROR'
    };

    // Include error details in development only
    if (process.env.NODE_ENV === 'development' && error) {
      additionalData.details = {
        stack: error.stack,
        name: error.name,
        message: error.message
      };
    }

    return this.sendError(res, 500, message, additionalData);
  }

  /**
   * Send bad request error response (400)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static badRequest(res, message = 'Bad request') {
    return this.sendError(res, 400, message, {
      code: 'BAD_REQUEST'
    });
  }

  /**
   * Send too many requests error response (429)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static tooManyRequests(res, message = 'Too many requests') {
    return this.sendError(res, 429, message, {
      code: 'TOO_MANY_REQUESTS'
    });
  }

  /**
   * Send service unavailable error response (503)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static serviceUnavailable(res, message = 'Service temporarily unavailable') {
    return this.sendError(res, 503, message, {
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  /**
   * Handle async route errors
   * Wraps async route handlers with standardized error handling
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next))
        .catch(error => {
          console.error('❌ Unhandled async error:', error);
          
          if (error.name === 'ValidationError') {
            return this.validationError(res, error.message, error.errors);
          }
          
          if (error.name === 'UnauthorizedError') {
            return this.unauthorized(res, error.message);
          }
          
          if (error.name === 'ForbiddenError') {
            return this.forbidden(res, error.message);
          }
          
          if (error.name === 'NotFoundError') {
            return this.notFound(res, error.resource);
          }
          
          if (error.name === 'ConflictError') {
            return this.conflict(res, error.message);
          }
          
          // Default to server error
          return this.serverError(res, 'An unexpected error occurred', error);
        });
    };
  }
}

/**
 * Express middleware for handling uncaught errors
 */
const errorHandlerMiddleware = (error, req, res, next) => {
  console.error('❌ Uncaught error:', error);

  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return ErrorHandler.validationError(res, error.message, error.errors);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return ErrorHandler.unauthorized(res, 'Invalid or expired token');
  }

  if (error.name === 'CastError') {
    return ErrorHandler.badRequest(res, 'Invalid data format');
  }

  if (error.code === 'ENOENT') {
    return ErrorHandler.notFound(res, 'File not found');
  }

  if (error.code === 'EACCES') {
    return ErrorHandler.forbidden(res, 'Permission denied');
  }

  // Default server error
  return ErrorHandler.serverError(res, 'Internal server error', error);
};

/**
 * Middleware to handle 404 errors
 */
const notFoundMiddleware = (req, res) => {
  return ErrorHandler.notFound(res, `Route ${req.method} ${req.path}`);
};

/**
 * Custom error classes for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Helper function to check if error is operational
 */
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return true;
  }
  
  // Check for known operational errors
  const operationalErrors = [
    'ValidationError',
    'UnauthorizedError', 
    'ForbiddenError',
    'NotFoundError',
    'ConflictError',
    'CastError',
    'JsonWebTokenError',
    'TokenExpiredError'
  ];
  
  return operationalErrors.includes(error.name);
};

/**
 * Process and log errors
 */
const processError = (error, req, res, next) => {
  console.error('❌ Error Details:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Send appropriate error response
  if (error instanceof ValidationError) {
    return ErrorHandler.validationError(res, error.message, error.errors);
  }

  if (error instanceof UnauthorizedError) {
    return ErrorHandler.unauthorized(res, error.message);
  }

  if (error instanceof ForbiddenError) {
    return ErrorHandler.forbidden(res, error.message);
  }

  if (error instanceof NotFoundError) {
    return ErrorHandler.notFound(res, error.resource);
  }

  if (error instanceof ConflictError) {
    return ErrorHandler.conflict(res, error.message);
  }

  // Default to server error
  return ErrorHandler.serverError(res, 'An unexpected error occurred', error);
};

module.exports = {
  ErrorHandler,
  errorHandlerMiddleware,
  notFoundMiddleware,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  isOperationalError,
  processError
};
