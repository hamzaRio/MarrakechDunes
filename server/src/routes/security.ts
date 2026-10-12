import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { strictLimiter } from '../rate-limiters.js';

const router = Router();

/**
 * POST /api/security-events
 * Log security events from client (non-critical, fails silently if not needed)
 */
const securityEventSchema = z.object({
  event: z.string().trim().min(1).max(100),
  details: z.record(z.unknown()).optional(),
  timestamp: z.union([z.string().datetime(), z.number()]).optional(),
}).strict();

router.post('/security-events', strictLimiter, async (req: Request, res: Response) => {
  try {
    // This endpoint is optional - just acknowledge receipt
    // In a production system, you might log these to a security audit log
    const parsed = securityEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 'error', message: 'Invalid security event' });
    const { event, details, timestamp } = parsed.data;
    
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

