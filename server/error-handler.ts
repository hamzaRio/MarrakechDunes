import { Request, Response, NextFunction } from 'express';

// Standardized error response interface
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public details?: any;
  
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Environment-specific error details
function getErrorDetails(error: any, isDevelopment: boolean): any {
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
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  // Get user information if available
  const userId = (req as any).session?.user?.id;
  const username = (req as any).session?.user?.username;

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
  } else {
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
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database error';
    code = 'DATABASE_ERROR';
  } else if (error.status || error.statusCode) {
    statusCode = error.status || error.statusCode;
    message = error.message || message;
    code = error.code || 'HTTP_ERROR';
  }

  // Create standardized error response
  const errorResponse: ErrorResponse = {
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
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`API endpoint not found: ${req.method} ${req.path}`);
  next(error);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Database error handler
export function handleDatabaseError(error: any): AppError {
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
export function handleRateLimitError(req: Request, res: Response, next: NextFunction): void {
  const error = new RateLimitError('Too many requests, please try again later');
  next(error);
}

// Validation error handler for Zod
export function handleZodError(error: any): ValidationError {
  const details = error.errors?.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
  
  return new ValidationError('Validation failed', details);
}
