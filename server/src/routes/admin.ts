import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';

const router = Router();

/**
 * GET /api/admin/bookings
 * Get all bookings (admin only)
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await storage.getBookings();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('[ADMIN] Error fetching bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Get single booking (admin only)
 */
router.get('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    return res.status(200).json(booking);
  } catch (error) {
    console.error('[ADMIN] Error fetching booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking'
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/status
 * Update booking status (admin only)
 */
router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBooking = await storage.updateBookingStatus(id, status);
    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('[ADMIN] Error updating booking status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update booking status'
    });
  }
});

/**
 * GET /api/admin/activities/all
 * Get all activities including pending (admin only)
 */
router.get('/activities/all', async (req: Request, res: Response) => {
  try {
    const activities = await storage.getAllActivities();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[ADMIN] Error fetching all activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

/**
 * GET /api/admin/activities
 * Get all activities (admin view)
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const activities = await storage.getAllActivities();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[ADMIN] Error fetching activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

/**
 * POST /api/admin/activities
 * Create new activity (admin only)
 */
router.post('/activities', async (req: Request, res: Response) => {
  try {
    const activityData = req.body;
    const activity = await storage.createActivity(activityData);
    return res.status(201).json(activity);
  } catch (error) {
    console.error('[ADMIN] Error creating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create activity'
    });
  }
});

/**
 * PUT /api/admin/activities/:id
 * Update activity (admin only)
 */
router.put('/activities/:id', async (req: Request, res: Response) => {
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
    console.error('[ADMIN] Error updating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update activity'
    });
  }
});

/**
 * PATCH /api/admin/activities/:id
 * Partial update activity (admin only)
 */
router.patch('/activities/:id', async (req: Request, res: Response) => {
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
    console.error('[ADMIN] Error updating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update activity'
    });
  }
});

/**
 * DELETE /api/admin/activities/:id
 * Delete activity (admin only)
 */
router.delete('/activities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteActivity(id);
    return res.status(200).json({
      status: 'success',
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete activity'
    });
  }
});

/**
 * GET /api/admin/activities/:id/getyourguide-price
 * Get GetYourGuide price for activity (admin only)
 */
router.get('/activities/:id/getyourguide-price', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // This would integrate with GetYourGuide API
    // For now, return a placeholder
    return res.status(200).json({
      status: 'success',
      price: null,
      message: 'GetYourGuide price lookup not yet implemented'
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching GYG price:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch GetYourGuide price'
    });
  }
});

export default router;

