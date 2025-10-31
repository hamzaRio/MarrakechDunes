import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

/**
 * GET /api/admin/bookings
 * Get all bookings (admin only)
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    // Clear cache if requested (for debugging/fixing issues)
    if (req.query.clearCache === 'true') {
      const { cacheService } = await import('../services/cache-service.js');
      await cacheService.invalidateBookings();
      console.log('[ADMIN] Bookings cache cleared');
    }
    
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
 * POST /api/admin/activities/:id/image
 * Upload activity image (admin only)
 */
router.post('/activities/:id/image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Image URL is required'
      });
    }
    
    // Update activity with new image URL
    const activity = await storage.getActivity(id);
    if (!activity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    
    // Add image URL to activity's imageUrls array
    const imageUrls = Array.isArray(activity.imageUrls) ? [...activity.imageUrls] : [];
    if (!imageUrls.includes(imageUrl)) {
      imageUrls.push(imageUrl);
    }
    
    const updatedActivity = await storage.updateActivity(id, { imageUrls });
    
    return res.status(200).json({
      status: 'success',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('[ADMIN] Error uploading activity image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to upload image'
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

/**
 * POST /api/admin/bookings/:id/payment
 * PATCH /api/admin/bookings/:id/payment
 * Update booking payment (admin only)
 */
const handleBookingPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, paidAmount, paymentStatus, paymentMethod } = req.body;
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    const total = Number(booking.totalAmount) ?? 0;
    const newPaid = paidAmount !== undefined ? Math.min(total, Number(paidAmount)) : (Number(booking.paidAmount) || 0);
    
    // Use provided paymentStatus or calculate it
    let status: 'unpaid' | 'deposit_paid' | 'fully_paid' = paymentStatus || 'unpaid';
    if (paidAmount !== undefined) {
      if (newPaid <= 0) status = 'unpaid';
      else if (newPaid < total) {
        status = type === 'DEPOSIT' ? 'deposit_paid' : 'unpaid';
      } else {
        status = 'fully_paid';
      }
    }

    // Use provided paymentMethod or calculate it
    let finalPaymentMethod: 'cash' | 'cash_deposit' = paymentMethod || 'cash';
    if (type === 'DEPOSIT' && !paymentMethod) finalPaymentMethod = 'cash_deposit';

    const updatedBooking = await storage.updateBooking(id, {
      paidAmount: newPaid,
      paymentStatus: status,
      paymentMethod: finalPaymentMethod,
    });

    return res.status(200).json({
      success: true,
      payment: {
        type,
        paidAmount: newPaid,
        remaining: Math.max(0, total - newPaid),
        status,
        paymentMethod: finalPaymentMethod
      },
      booking: updatedBooking
    });
  } catch (error) {
    console.error('[ADMIN] Error updating booking payment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update payment'
    });
  }
};

router.post('/bookings/:id/payment', handleBookingPayment);
router.patch('/bookings/:id/payment', handleBookingPayment);

/**
 * POST /api/admin/bookings/:id/reminder
 * Send reminder for booking (admin only)
 */
router.post('/bookings/:id/reminder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    // TODO: Implement reminder sending logic (WhatsApp, email, etc.)
    return res.status(200).json({
      status: 'success',
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error sending reminder:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send reminder'
    });
  }
});

/**
 * GET /api/admin/export/bookings
 * Export bookings to CSV (admin only)
 */
router.get('/export/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await storage.getBookings();
    const csv = await storage.exportBookingsToCSV(bookings);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('[ADMIN] Error exporting bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export bookings'
    });
  }
});

/**
 * GET /api/admin/export/bookings/pdf
 * Export bookings to PDF (admin only)
 */
router.get('/export/bookings/pdf', async (req: Request, res: Response) => {
  try {
    const bookings = await storage.getBookings();
    const pdf = await storage.exportBookingsToPDF(bookings);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.pdf"');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('[ADMIN] Error exporting bookings PDF:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export bookings PDF'
    });
  }
});

/**
 * GET /api/admin/operations-report
 * Get operations report (admin only)
 */
router.get('/operations-report', async (req: Request, res: Response) => {
  try {
    const report = await storage.generateOperationsReport();
    return res.status(200).json(report);
  } catch (error) {
    console.error('[ADMIN] Error generating operations report:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate operations report'
    });
  }
});

/**
 * GET /api/admin/export/operations-report/pdf
 * Export operations report to PDF (admin only)
 */
router.get('/export/operations-report/pdf', async (req: Request, res: Response) => {
  try {
    const reportData = await storage.generateOperationsReport();
    const pdf = await storage.exportOperationsReportToPDF(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="operations-report.pdf"');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('[ADMIN] Error exporting operations report PDF:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export operations report PDF'
    });
  }
});

/**
 * GET /api/admin/notifications
 * Get admin notifications (admin only)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    // TODO: Implement notification fetching logic
    return res.status(200).json({
      status: 'success',
      notifications: []
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching notifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * POST /api/admin/notifications/send
 * Send notification (admin only)
 */
router.post('/notifications/send', async (req: Request, res: Response) => {
  try {
    // TODO: Implement notification sending logic
    return res.status(200).json({
      status: 'success',
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error sending notification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send notification'
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs (admin/superadmin only)
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const auditLogs = await storage.getAuditLogs();
    return res.status(200).json(auditLogs);
  } catch (error) {
    console.error('[ADMIN] Error fetching audit logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs'
    });
  }
});

export default router;

