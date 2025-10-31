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

/**
 * GET /api/reviews/:id
 * Get single review by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await storage.getReview(id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    return res.status(200).json(review);
  } catch (error) {
    console.error('[REVIEWS] Error fetching review:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch review'
    });
  }
});

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const reviewData = req.body;
    const review = await storage.createReview(reviewData);
    return res.status(201).json(review);
  } catch (error) {
    console.error('[REVIEWS] Error creating review:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create review'
    });
  }
});

export default router;

