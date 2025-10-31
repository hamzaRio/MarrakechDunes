import { Router, type Request, type Response } from 'express';
import { storage } from '../storage.js';

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
    
    // TODO: Implement OTP generation and SMS sending logic
    // For now, log in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('[PORTAL] OTP requested for phone:', phone);
    }
    
    // For now, return success (OTP would be sent via SMS)
    return res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully'
    });
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
    
    // TODO: Implement OTP verification logic
    // For now, find bookings by phone number
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
      phone
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

export default router;

