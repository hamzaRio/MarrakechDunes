import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import MemoryStore from 'memorystore';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import { resolveDatabaseUrl, getRedactedDatabaseUrl } from './utils/database-url.js';

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'default-session-secret-for-development-only';

if (!process.env.SESSION_SECRET && isProduction) {
  throw new Error('SESSION_SECRET environment variable is required for production session security.');
}

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  WARNING: Using default SESSION_SECRET. Set SESSION_SECRET environment variable for production.');
}

// Rate limiting for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 50, // More reasonable for auth
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

// ENHANCED Rate limiting for admin API endpoints - NO BYPASSING
export const adminApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Stricter limits for security
  message: {
    error: 'Too many admin requests, try again later.',
    retryAfter: '15 minutes',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    console.warn('[SECURITY] Admin rate limit exceeded:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many admin requests, try again later.',
      retryAfter: Math.ceil(15 * 60 / 60), // minutes
      code: 'RATE_LIMITED'
    });
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

// ENHANCED Admin route security middleware - NO BYPASSING ALLOWED
export const adminSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced debugging for cross-site authentication issues
  const debugInfo = {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userRole: req.session?.user?.role,
    sessionId: req.session?.id,
    cookies: req.headers.cookie ? 'present' : 'missing',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  };

  // SECURITY LAYER 1: Session validation
  if (!req.session) {
    console.warn('[SECURITY] Admin access denied - no session:', debugInfo);
    return res.status(401).json({
      error: 'Session Required',
      message: 'Valid session required for admin access',
      code: 'NO_SESSION'
    });
  }

  // SECURITY LAYER 2: User validation
  if (!req.session.user) {
    console.warn('[SECURITY] Admin access denied - no user in session:', debugInfo);
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'User authentication required for admin access',
      code: 'NO_USER'
    });
  }

  // SECURITY LAYER 3: Role validation
  if (req.session.user.role !== 'admin' && req.session.user.role !== 'superadmin') {
    console.warn('[SECURITY] Admin access denied - invalid role:', debugInfo);
    return res.status(403).json({
      error: 'Insufficient Privileges',
      message: 'Admin role required for this operation',
      code: 'INVALID_ROLE'
    });
  }

  // SECURITY LAYER 4: Session age validation (prevent stale sessions)
  // Check if session has remaining time (maxAge is remaining milliseconds)
  const remainingTime = req.session.cookie?.maxAge || 0;
  if (remainingTime <= 0) {
    console.warn('[SECURITY] Admin access denied - session expired:', debugInfo);
    return res.status(401).json({
      error: 'Session Expired',
      message: 'Session has expired, please login again',
      code: 'SESSION_EXPIRED'
    });
  }

  // All security checks passed - proceed with request

  // Enhanced security headers for admin routes - NO BYPASSING
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Log successful admin access for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH] Admin access granted:', {
      user: req.session.user.username || req.session.user.id,
      role: req.session.user.role,
      path: req.path
    });
  }
  
  next();
};

// Superadmin-only middleware
export const superadminSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const debugInfo = {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userRole: req.session?.user?.role,
    sessionId: req.session?.id,
    cookies: req.headers.cookie ? 'present' : 'missing',
    origin: req.headers.origin
  };

  if (!req.session?.user) {
    console.warn('[AUTH] Superadmin access denied - no session user:', debugInfo);
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please log in to access this feature',
      debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    });
  }

  if (req.session.user.role !== 'superadmin') {
    console.warn('[AUTH] Superadmin access denied - insufficient role:', debugInfo);
    return res.status(403).json({
      error: 'Superadmin Access Required',
      message: 'Only superadmin can access this feature',
      debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    });
  }

  // Log successful superadmin access
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH] Superadmin access granted:', {
      user: req.session.user.username || req.session.user.id,
      role: req.session.user.role,
      path: req.path
    });
  }

  next();
};

// Enhanced input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced sanitize function for better security
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs that could be malicious
      .replace(/data:text\/html/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object and embed tags
      .replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
      // Remove style attributes with javascript
      .replace(/style\s*=\s*["'][^"']*javascript:[^"']*["']/gi, '')
      // Remove dangerous CSS expressions
      .replace(/expression\s*\(/gi, '')
      // Trim whitespace
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
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
    // Enhanced cross-site cookie support for Vercel ↔ Render
    domain: undefined, // Let browser handle domain
  },
  // Enhanced session configuration for cross-site authentication
  rolling: true, // Reset expiration on activity
  proxy: true, // Trust proxy for secure cookies
};

// Session configuration is set up - no need to log details

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\bUNION\s+SELECT\b)/gi,
    /(\bDROP\s+TABLE\b)/gi,
    /(\bINSERT\s+INTO\b)/gi,
    /(\bDELETE\s+FROM\b)/gi,
    /(\bUPDATE\s+SET\b)/gi
  ];

  const checkForSQLInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }
    return false;
  };

  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Request contains potentially malicious content'
    });
  }

  next();
};

// Request size limiting middleware
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: 'Request Too Large',
      message: 'Request size exceeds maximum allowed limit'
    });
  }

  next();
};

// Enhanced rate limiting for specific endpoints
export const strictApiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 100,
  message: {
    error: 'Too many requests',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});