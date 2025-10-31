import { type Request, type Response, type NextFunction } from 'express';
import { storage } from '../storage.js';

/**
 * Middleware to check admin authentication
 * All admin routes should be protected by this middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if session exists and user is authenticated
    if (!req.session || !(req.session as any).authenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const role = (req.session as any).role;
    
    // Allow both admin and superadmin
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    // Optionally verify user still exists in database
    const userId = (req.session as any).userId;
    if (userId) {
      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }
    }

    next();
  } catch (error) {
    console.error('[ADMIN] Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication check failed'
    });
  }
};

/**
 * Middleware to check superadmin authentication only
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session || !(req.session as any).authenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const role = (req.session as any).role;
    
    if (role !== 'superadmin') {
      return res.status(403).json({
        status: 'error',
        message: 'Superadmin access required'
      });
    }

    const userId = (req.session as any).userId;
    if (userId) {
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'superadmin') {
        req.session.destroy(() => {});
        return res.status(401).json({
          status: 'error',
          message: 'Superadmin access required'
        });
      }
    }

    next();
  } catch (error) {
    console.error('[ADMIN] Superadmin auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication check failed'
    });
  }
};

