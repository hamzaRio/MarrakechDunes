// Custom error classes for better error handling
export class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
    }
}
// Environment-specific error details
function getErrorDetails(error, isDevelopment) {
    if (!isDevelopment) {
        return undefined; // No details in production
    }
    return {
        stack: error.stack,
        name: error.name,
        ...(error.details && { details: error.details })
    };
}
// Global error handler middleware
export function globalErrorHandler(error, req, res, next) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    // Get user information if available
    const userId = req.session?.user?.id;
    const username = req.session?.user?.username;
    // Log error details
    if (isDevelopment || isTest) {
        console.error('🚨 Error caught by global handler:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            userId: userId || 'anonymous',
            username: username || 'anonymous',
            body: req.body,
            query: req.query,
            params: req.params,
            timestamp: new Date().toISOString()
        });
    }
    else {
        // Production logging - structured and minimal
        console.error('🚨 Production Error:', {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            url: req.url,
            method: req.method,
            userId: userId || 'anonymous',
            username: username || 'anonymous',
            timestamp: new Date().toISOString()
        });
    }
    // Determine status code and message
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code || 'APP_ERROR';
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    }
    else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
    }
    else if (error.status || error.statusCode) {
        statusCode = error.status || error.statusCode;
        message = error.message || message;
        code = error.code || 'HTTP_ERROR';
    }
    // Create standardized error response
    const errorResponse = {
        status: 'error',
        message,
        code,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(getErrorDetails(error, isDevelopment) && {
            details: getErrorDetails(error, isDevelopment)
        })
    };
    res.status(statusCode).json(errorResponse);
}
// 404 handler for undefined API routes
export function notFoundHandler(req, res, next) {
    const error = new NotFoundError(`API endpoint not found: ${req.method} ${req.path}`);
    next(error);
}
// Async error wrapper for route handlers
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Database error handler
export function handleDatabaseError(error) {
    if (error.name === 'ValidationError') {
        return new ValidationError('Database validation failed', error.errors);
    }
    if (error.name === 'CastError') {
        return new ValidationError('Invalid ID format');
    }
    if (error.code === 11000) {
        return new ValidationError('Duplicate entry found');
    }
    if (error.name === 'MongoNetworkError') {
        return new DatabaseError('Database connection failed');
    }
    return new DatabaseError('Database operation failed');
}
// Rate limit error handler
export function handleRateLimitError(req, res, next) {
    const error = new RateLimitError('Too many requests, please try again later');
    next(error);
}
// Validation error handler for Zod
export function handleZodError(error) {
    const details = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
    }));
    return new ValidationError('Validation failed', details);
}
