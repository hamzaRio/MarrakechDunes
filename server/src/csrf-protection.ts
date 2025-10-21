import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Custom CSRF protection implementation
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly COOKIE_NAME = 'marrakech.csrf';
  private static readonly HEADER_NAME = 'x-csrf-token';

  // Generate a secure random token
  private static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  // Get token from request (header or body)
  private static getTokenFromRequest(req: Request): string | null {
    return req.headers[this.HEADER_NAME] as string || 
           req.body?._csrf || 
           req.query?._csrf as string || 
           null;
  }

  // Get token from cookie
  private static getTokenFromCookie(req: Request): string | null {
    return req.cookies?.[this.COOKIE_NAME] || null;
  }

  // Verify token using double-submit cookie pattern
  private static verifyToken(req: Request): boolean {
    const tokenFromRequest = this.getTokenFromRequest(req);
    const tokenFromCookie = this.getTokenFromCookie(req);

    if (!tokenFromRequest || !tokenFromCookie) {
      return false;
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    try {
      const requestBuffer = Buffer.from(tokenFromRequest, 'hex');
      const cookieBuffer = Buffer.from(tokenFromCookie, 'hex');
      
      return requestBuffer.length === cookieBuffer.length &&
             crypto.timingSafeEqual(requestBuffer, cookieBuffer);
    } catch (error) {
      return false;
    }
  }

  // Middleware to generate and set CSRF token
  static generateTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = this.generateToken();
    
    // Set token in cookie
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: false, // Allow client-side access for double-submit
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Add token to response for client-side access
    res.locals.csrfToken = token;
    (req as any).csrfToken = () => token;
    
    next();
  };

  // Middleware to verify CSRF token
  static verifyTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for specific paths
    const skipPaths = [
      '/api/security-events',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/session/init',
      '/api/bookings',
      '/api/admin/bookings', // Allow admin booking operations
      '/api/reviews',
      '/api/notifications' // Email notifications - external service integration
    ];

    if (skipPaths.some(path => req.path === path || req.path.startsWith(path))) {
      return next();
    }

    // Skip CSRF for DELETE operations and export endpoints
    if (req.method === 'DELETE' || req.path.startsWith('/api/admin/export')) {
      return next();
    }

    if (!this.verifyToken(req)) {
      return res.status(403).json({
        error: 'CSRF token mismatch',
        message: 'Invalid or missing CSRF token'
      });
    }

    next();
  };

  // Get CSRF token for client-side use
  static getToken(req: Request): string | null {
    return this.getTokenFromCookie(req);
  }
}

// Export middleware functions
export const generateCSRFToken = CSRFProtection.generateTokenMiddleware;
export const verifyCSRFToken = CSRFProtection.verifyTokenMiddleware;
export const getCSRFToken = CSRFProtection.getToken;
