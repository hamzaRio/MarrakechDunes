import { Router, type Request, type Response } from 'express';

const router = Router();

/**
 * POST /api/security-events
 * Log security events from client (non-critical, fails silently if not needed)
 */
router.post('/security-events', async (req: Request, res: Response) => {
  try {
    // This endpoint is optional - just acknowledge receipt
    // In a production system, you might log these to a security audit log
    const { event, details, timestamp } = req.body;
    
    // Log security event (only in development - production should use proper audit logging)
    if (event && process.env.NODE_ENV !== 'production') {
      console.log('[SECURITY] Client security event:', { event, timestamp, hasDetails: !!details });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Security event logged'
    });
  } catch (error) {
    // Fail silently for security events - don't expose errors
    return res.status(200).json({
      status: 'success',
      message: 'Security event logged'
    });
  }
});

export default router;

