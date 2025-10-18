import express from 'express';
import { z } from 'zod';
import { smartCancellationSystem, CancellationReason } from '../utils/smart-cancellation.js';
import { storage } from '../storage.js';

const router = express.Router();

const cancellationRequestSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.nativeEnum(CancellationReason),
  customerRequested: z.boolean().optional().default(false),
  notes: z.string().optional()
});

// Get refund estimate
router.get('/:bookingId/refund-estimate', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.query;
    
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const estimate = smartCancellationSystem.getRefundEstimate(
      booking, 
      reason as CancellationReason || CancellationReason.OTHER
    );
    
    res.json(estimate);
  } catch (error) {
    console.error('Refund estimate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process cancellation
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const requestData = cancellationRequestSchema.parse(req.body);
    
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const request = {
      bookingId,
      reason: requestData.reason,
      customerRequested: requestData.customerRequested,
      notes: requestData.notes
    };

    const result = await smartCancellationSystem.processCancellation(booking, request);
    
    if (result.success) {
      // Update booking status
      const updatedBooking = await storage.updateBooking(bookingId, {
        status: 'CANCELLED',
        cancellationReason: requestData.reason.toString() as any,
        cancellationDate: new Date()
      });

      res.json({
        success: true,
        booking: updatedBooking,
        refund: {
          amount: result.netRefund,
          percentage: result.refundPercentage,
          processingFee: result.processingFee
        },
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
    console.error('Cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cancellation reasons
router.get('/reasons', (req, res) => {
  const reasons = smartCancellationSystem.getCancellationReasons();
  res.json(reasons);
});

// Get cancellation policy
router.get('/policy', (req, res) => {
  const policy = smartCancellationSystem.getPolicy();
  res.json(policy);
});

export default router;
