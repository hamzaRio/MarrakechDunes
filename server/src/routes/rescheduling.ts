import express from 'express';
import { z } from 'zod';
import { reschedulingSystem } from '../utils/rescheduling-system.js';
import { storage } from '../storage.js';

const router = express.Router();

const rescheduleRequestSchema = z.object({
  bookingId: z.string().min(1),
  newDate: z.string().datetime(),
  reason: z.string().optional(),
  customerRequested: z.boolean().optional().default(false)
});

// Check if booking can be rescheduled
router.get('/:bookingId/can-reschedule', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const result = reschedulingSystem.canReschedule(booking);
    res.json(result);
  } catch (error) {
    console.error('Reschedule check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available reschedule dates
router.get('/:bookingId/available-dates', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const availableDates = reschedulingSystem.getAvailableRescheduleDates(booking);
    res.json({ availableDates });
  } catch (error) {
    console.error('Available dates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process reschedule request
router.post('/:bookingId/reschedule', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const requestData = rescheduleRequestSchema.parse(req.body);
    
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const request = {
      bookingId,
      newDate: new Date(requestData.newDate),
      reason: requestData.reason,
      customerRequested: requestData.customerRequested
    };

    const result = await reschedulingSystem.processReschedule(booking, request);
    
    if (result.success) {
      // Update booking in database
      const updatedBooking = await storage.updateBooking(bookingId, {
        preferredDate: result.newDate,
        rescheduleCount: (booking.rescheduleCount || 0) + 1,
        rescheduleFee: result.fee
      });

      res.json({
        success: true,
        booking: updatedBooking,
        fee: result.fee,
        newDate: result.newDate,
        warnings: result.warnings
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors,
        warnings: result.warnings
      });
    }
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reschedule policy
router.get('/policy', (req, res) => {
  const policy = reschedulingSystem.getPolicy();
  res.json(policy);
});

export default router;
