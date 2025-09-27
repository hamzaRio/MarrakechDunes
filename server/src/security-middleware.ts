import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import MemoryStore from 'memorystore';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import { resolveDatabaseUrl, getRedactedDatabaseUrl } from './utils/database-url.js';

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required for session security.');
}

// Rate limiting for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 20, // Stricter for auth
  message: {
    error: 'Too many requests, try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    });
  }
});

// Rate limiting for admin API endpoints
export const adminApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (consistent with others)
  max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Relaxed for admin operations
  message: {
    error: 'Too many requests, try again later.',
    retryAfter: '15 minutes'
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
  windowMs: 15 * 60 * 1000, // 15 minutes (consistent with others)
  max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Relaxed for general API
  message: {
    error: 'Too many requests, try again later.',
    retryAfter: '15 minutes'
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
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://www.openstreetmap.org", "https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://images.unsplash.com", "https://*.unsplash.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://marrakechdunes-sppy.onrender.com", "https://api.whatsapp.com"],
      frameSrc: ["'self'", "https://www.openstreetmap.org"],
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
  crossOriginResourcePolicy: false, // Disable helmet's CORS policy to allow our custom headers
  crossOriginEmbedderPolicy: false
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

// Create session store with MongoDB fallback to memory store
const memoryStoreFactory = () => {
  const MemoryStoreSession = MemoryStore(session);
  return new MemoryStoreSession({
    checkPeriod: 24 * 60 * 60 * 1000,
    ttl: 24 * 60 * 60 * 1000,
    max: 1000,
  });
};

const createSessionStore = () => {
  let mongoUrl: string | undefined;
  try {
    mongoUrl = resolveDatabaseUrl();
  } catch (error) {
    console.log('[session] DATABASE_URL not found for sessions. Using in-memory session store.');
  }

  if (!mongoUrl) {
    return memoryStoreFactory();
  }

  try {
    console.log(`[session] Using MongoDB session store ${getRedactedDatabaseUrl(mongoUrl)}`);
    return MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
      autoRemove: 'native',
      crypto: {
        secret: sessionSecret,
      },
    });
  } catch (error) {
    console.log('[session] MongoDB session store failed, falling back to in-memory store:', error);
    return memoryStoreFactory();
  }
};

// Enhanced session store with better error handling
const createEnhancedSessionStore = () => {
  let mongoUrl: string | undefined;
  try {
    mongoUrl = resolveDatabaseUrl();
  } catch (error) {
    console.log('[session] DATABASE_URL not found for enhanced sessions. Using in-memory session store.');
  }

  if (!mongoUrl) {
    return memoryStoreFactory();
  }

  try {
    const store = MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
      autoRemove: 'native',
      crypto: {
        secret: sessionSecret,
      },
      touchAfter: 24 * 3600,
      stringify: false,
    });

    (store as any).on('connect', () => {
      console.log('[session] MongoDB session store connected');
    });

    (store as any).on('error', (error: unknown) => {
      console.error('[session] MongoDB session store error:', error);
    });

    return store;
  } catch (error) {
    console.log('[session] MongoDB session store failed, falling back to in-memory store:', error);
    return memoryStoreFactory();
  }
};

// Session security configuration - environment-aware
const sessionCookieConfig = {
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  secure: isProduction,
};

export const sessionSecurity = {
  name: 'marrakech.session',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: createEnhancedSessionStore(),
  cookie: {
    sameSite: sessionCookieConfig.sameSite,
    secure: sessionCookieConfig.secure,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  }
};

// Session configuration is set up - no need to log details