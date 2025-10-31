import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';

const router = Router();

/**
 * GET /api/activities
 * Get all approved activities
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const activities = await storage.getActivities();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[ACTIVITIES] Error fetching activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

export default router;

