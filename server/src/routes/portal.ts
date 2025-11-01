import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';
import { twilioService } from '../services/twilio-service.js';
import { reschedulingSystem } from '../utils/rescheduling-system.js';

const router = Router();

/**
 * POST /api/portal/request-otp
 * Request OTP for customer portal login
 */
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    // Check if customer has bookings
    const bookings = await storage.getBookings();
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    
    if (customerBookings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No bookings found for this phone number'
      });
    }

    // Send OTP via Twilio (or dev mode fallback)
    const result = await twilioService.sendOTP(phone);
    
    if (result.success) {
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: result.message
      });
    }
  } catch (error) {
    console.error('[PORTAL] Error requesting OTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send OTP'
    });
  }
});

/**
 * POST /api/portal/login
 * Customer portal login with OTP
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone and OTP are required'
      });
    }

    // Verify OTP using Twilio service
    const verification = twilioService.verifyOTP(phone, otp);
    
    if (!verification.valid) {
      return res.status(401).json({
        status: 'error',
        message: verification.message
      });
    }

    // Find bookings to confirm customer exists
    const bookings = await storage.getBookings();
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    
    if (customerBookings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No bookings found for this phone number'
      });
    }

    // Set session for customer portal
    if (req.session) {
      (req.session as any).portalPhone = phone;
      (req.session as any).portalAuthenticated = true;
    }

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      phone,
      bookingsCount: customerBookings.length
    });
  } catch (error) {
    console.error('[PORTAL] Error logging in:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to login'
    });
  }
});

/**
 * GET /api/portal/me/bookings
 * Get customer's bookings (requires portal authentication)
 */
router.get('/me/bookings', async (req: Request, res: Response) => {
  try {
    if (!req.session || !(req.session as any).portalAuthenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }
    
    const phone = (req.session as any).portalPhone;
    if (!phone) {
      return res.status(401).json({
        status: 'error',
        message: 'Session invalid'
      });
    }
    
    const bookings = await storage.getBookings();
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    
    return res.status(200).json(customerBookings);
  } catch (error) {
    console.error('[PORTAL] Error fetching customer bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * POST /api/portal/me/bookings/:id/reschedule
 * Request to reschedule a booking (customer initiated)
 */
router.post('/me/bookings/:id/reschedule', async (req: Request, res: Response) => {
  try {
    if (!req.session || !(req.session as any).portalAuthenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    const { id } = req.params;
    const { newDate, reason } = req.body;
    const phone = (req.session as any).portalPhone;

    if (!newDate) {
      return res.status(400).json({
        status: 'error',
        message: 'New date is required'
      });
    }

    const booking = await storage.getBooking(id);
    
    if (!booking || booking.customerPhone !== phone) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or not authorized'
      });
    }

    // Check if booking can be rescheduled
    const canReschedule = reschedulingSystem.canReschedule(booking);
    if (!canReschedule.success) {
      return res.status(400).json({
        status: 'error',
        message: canReschedule.errors?.[0] || 'Booking cannot be rescheduled',
        errors: canReschedule.errors || []
      });
    }

    // Process reschedule
    const request = {
      bookingId: id,
      newDate: new Date(newDate),
      reason: reason || 'Customer requested reschedule',
      customerRequested: true
    };

    const result = await reschedulingSystem.processReschedule(booking, request);
    
    if (result.success) {
      // Update booking in database
      const updatedBooking = await storage.updateBooking(id, {
        preferredDate: result.newDate,
        rescheduleCount: (booking.rescheduleCount || 0) + 1,
        rescheduleFee: result.fee,
        status: 'PENDING', // Reset to pending for admin approval
        notes: `${booking.notes || ''}\n[Reschedule Request] ${reason || 'No reason provided'} - Customer requested. New date: ${newDate}`.trim()
      });

      // Notify customer
      await twilioService.sendWhatsApp(phone, `✅ Reschedule request received! We'll confirm the new date: ${new Date(newDate).toLocaleDateString()}`);

      return res.status(200).json({
        status: 'success',
        message: 'Reschedule request sent. We will contact you shortly to confirm.',
        booking: updatedBooking,
        fee: result.fee,
        newDate: result.newDate
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Reschedule failed',
        errors: result.errors || [],
        warnings: result.warnings || []
      });
    }
  } catch (error) {
    console.error('[PORTAL] Reschedule error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process reschedule request'
    });
  }
});

/**
 * POST /api/portal/me/bookings/:id/cancel
 * Request to cancel a booking (customer initiated)
 */
router.post('/me/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    if (!req.session || !(req.session as any).portalAuthenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const phone = (req.session as any).portalPhone;

    const booking = await storage.getBooking(id);
    
    if (!booking || booking.customerPhone !== phone) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found or not authorized'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel completed booking'
      });
    }

    // Update booking to cancelled
    const updatedBooking = await storage.updateBooking(id, {
      status: 'CANCELLED',
      notes: `${booking.notes || ''}\n[Cancelled by Customer] ${reason || 'No reason provided'}`.trim()
    });

    // Notify customer
    await twilioService.sendWhatsApp(phone, `📋 Your booking has been cancelled. We're sorry to see you go! If you have questions, please contact us.`);

    return res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('[PORTAL] Cancel error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking'
    });
  }
});

/**
 * POST /api/portal/logout
 * Logout from customer portal
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    if (req.session) {
      delete (req.session as any).portalPhone;
      delete (req.session as any).portalAuthenticated;
    }

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('[PORTAL] Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to logout'
    });
  }
});

export default router;

