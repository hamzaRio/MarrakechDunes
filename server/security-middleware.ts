import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import MemoryStore from 'memorystore';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';

// Rate limiting for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait 15 minutes before trying again'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Rate limiting for admin API endpoints
export const adminApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// General API rate limiting
export const generalApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: {
    error: 'Too many requests',
    message: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// HTTPS enforcement middleware
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.status(400).json({
        error: 'HTTPS Required',
        message: 'This endpoint requires a secure HTTPS connection'
      });
    }
  }
  next();
};

// Admin route security middleware
export const adminSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for admin session
  if (!req.session?.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please log in to access admin features'
    });
  }

  // Verify admin role
  if (req.session.user.role !== 'admin' && req.session.user.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Insufficient Privileges',
      message: 'Admin access required for this operation'
    });
  }

  // Add security headers for admin routes
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

// Superadmin-only middleware
export const superadminSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please log in to access this feature'
    });
  }

  if (req.session.user.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Superadmin Access Required',
      message: 'Only superadmin can access this feature'
    });
  }

  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common XSS patterns
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  // Recursively sanitize request body
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Helmet configuration for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // Disable CSP in development to allow Vite HMR
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
});

// Request logging middleware for admin actions
export const adminAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log admin actions
    if (req.session?.user && req.method !== 'GET') {
      console.log(`[ADMIN AUDIT] ${req.session.user.username} (${req.session.user.role}) - ${req.method} ${req.path} - Status: ${res.statusCode}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Create session store with fallback to memory store
const createSessionStore = () => {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoUrl) {
    console.log('MongoDB URL not found. Using memory store for sessions.');
    const MemoryStoreSession = MemoryStore(session);
    return new MemoryStoreSession({
      checkPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      max: 1000 // Maximum number of sessions
    });
  }
  
  // Always use memory store for now to avoid connection issues
  console.log('Using memory store for sessions to avoid MongoDB connection blocking.');
  const MemoryStoreSession = MemoryStore(session);
  return new MemoryStoreSession({
    checkPeriod: 24 * 60 * 60 * 1000, // 24 hours
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    max: 1000 // Maximum number of sessions
  });
};

// Session security configuration
export const sessionSecurity = {
  name: 'marrakech.session',
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('WARNING: Using default session secret. Set SESSION_SECRET environment variable for production!');
    return 'dev-session-secret-change-in-production';
  })(),
  resave: false,
  saveUninitialized: false,
  store: createSessionStore(),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' as const, // CSRF protection with better compatibility
  }
};