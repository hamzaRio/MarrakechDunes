import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';

const router = Router();

/**
 * GET /api/reviews
 * Get all approved reviews, optionally filtered by activityId
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const activityId = req.query.activityId as string | undefined;
    const reviews = await storage.getReviews(activityId);
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('[REVIEWS] Error fetching reviews:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews'
    });
  }
});

export default router;

