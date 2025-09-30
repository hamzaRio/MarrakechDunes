import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Extend Request interface for file uploads
interface RequestWithFiles extends Request {
  file?: any;
  files?: any;
}

// Request size limits to prevent DoS attacks
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request size exceeds maximum allowed limit'
    });
  }

  next();
};

// Enhanced rate limiting for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    error: 'Too many upload requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Security headers for file uploads
export const uploadSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

// IP whitelist for admin operations (optional)
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  // Only apply in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const allowedIPs = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin access not allowed from this IP address'
    });
  }

  next();
};

// Request logging for security monitoring
export const securityRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || '0'
    };

    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn('[SECURITY] Suspicious request:', logData);
    }

    // Log admin activities
    if (req.path.startsWith('/api/admin') && req.method !== 'GET') {
      console.log('[ADMIN] Action performed:', logData);
    }
  });

  next();
};

// Validate file uploads
export const validateFileUpload = (req: RequestWithFiles, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: any) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }
    
    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${file.size} bytes`);
    }
  };

  try {
    if (req.file) {
      validateFile(req.file);
    }
    
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      files.forEach(validateFile);
    }
    
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid file upload',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// API key validation for external services
export const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validAPIKey = process.env.API_KEY;

  // Skip validation if no API key is configured
  if (!validAPIKey) {
    return next();
  }

  // Skip validation for public endpoints
  const publicEndpoints = ['/api/health', '/api/activities', '/api/reviews'];
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  if (!apiKey || apiKey !== validAPIKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'Valid API key required for this endpoint'
    });
  }

  next();
};
