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

/**
 * GET /api/activities/:id
 * Get single activity by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await storage.getActivity(id);
    if (!activity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    return res.status(200).json(activity);
  } catch (error) {
    console.error('[ACTIVITIES] Error fetching activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity'
    });
  }
});

/**
 * GET /api/activities/:id/rating
 * Get activity rating
 */
router.get('/:id/rating', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rating = await storage.getActivityRating(id);
    return res.status(200).json(rating);
  } catch (error) {
    console.error('[ACTIVITIES] Error fetching activity rating:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity rating'
    });
  }
});

/**
 * PATCH /api/activities/:id
 * Update activity (partial update, used for price updates from dashboard)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityData = req.body;
    const updatedActivity = await storage.updateActivity(id, activityData);
    if (!updatedActivity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    return res.status(200).json(updatedActivity);
  } catch (error) {
    console.error('[ACTIVITIES] Error updating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update activity'
    });
  }
});

export default router;

