import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage.js';

const router = Router();

const publicReviewSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  activityId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(1),
  comment: z.string().min(1),
});

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
    const parsedReview = publicReviewSchema.safeParse(req.body);
    if (!parsedReview.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid review data',
        errors: parsedReview.error.flatten().fieldErrors,
      });
    }

    const review = await storage.createReview({
      ...parsedReview.data,
      verified: false,
      approved: false,
    });
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

