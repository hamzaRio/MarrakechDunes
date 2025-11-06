import express from 'express';
import { z } from 'zod';
import { PaymentStatus, PaymentType } from '../types/finance.js';
import { storage } from '../storage.js';
// Twilio removed - using free notification queue only

const router = express.Router();

const paymentUpdateSchema = z.object({
  type: z.nativeEnum(PaymentType),
  paidAmount: z.number().nonnegative(),
});

/**
 * POST /api/bookings
 * Create a new booking with auto-deposit calculation
 */
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // AUTO-CALCULATE DEPOSIT (30% of total, minimum 100 MAD)
    const totalAmount = Number(bookingData.totalAmount) || 0;
    if (totalAmount > 0) {
      // Calculate 30% deposit (rounded to nearest 10)
      const calculatedDeposit = Math.round(totalAmount * 0.3 / 10) * 10;
      const minDeposit = 100; // Minimum deposit
      bookingData.depositAmount = Math.max(calculatedDeposit, minDeposit);
      
      // Set payment method based on deposit preference
      // If customer wants deposit system, use cash_deposit, otherwise cash
      if (!bookingData.paymentMethod) {
        // Default: offer deposit option but start as unpaid
        bookingData.paymentMethod = 'cash_deposit';
        bookingData.paymentStatus = 'unpaid';
      }
    }
    
    const booking = await storage.createBooking(bookingData);
    
    // Send WhatsApp confirmation via FREE notification queue
    try {
      // Fetch activity name for confirmation
      const activity = await storage.getActivity(bookingData.activityId);
      const activityName = activity?.name || 'Activity';
      
      const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
      const date = new Date(bookingData.preferredDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const total = typeof bookingData.totalAmount === 'string' ? bookingData.totalAmount : `${bookingData.totalAmount} MAD`;
      const deposit = bookingData.depositAmount ? `${bookingData.depositAmount} MAD` : null;

      const message = `🎉 *Booking Confirmed!*

Activity: ${activityName}
Date: ${date}
People: ${bookingData.numberOfPeople}
Total: ${total}${deposit ? `\nDeposit Required: ${deposit}` : ''}

Payment: ${bookingData.depositAmount ? 'Deposit required before activity' : 'Cash on arrival'}

We'll send you a reminder 24 hours before your activity!

Thank you for choosing MarrakechDunes! 🏜️`.trim();

      freeNotificationQueue.addNotification({
        type: 'booking_confirmation',
        customerPhone: bookingData.customerPhone,
        customerName: bookingData.customerName,
        message,
        whatsappLink: freeNotificationQueue.generateWhatsAppLink(bookingData.customerPhone, message),
        priority: 'high',
        bookingId: booking._id || booking.id,
        metadata: {
          activityName,
          date: bookingData.preferredDate,
          amount: bookingData.depositAmount
        }
      });
    } catch (notificationError) {
      // Don't fail booking creation if notification fails
      console.error('[BOOKINGS] Failed to send confirmation:', notificationError);
    }
    
    return res.status(201).json(booking);
  } catch (error) {
    console.error('[BOOKINGS] Error creating booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create booking'
    });
  }
});

/**
 * GET /api/bookings/:id
 * Get single booking by ID
 */
router.get('/:id', async (req, res) => {
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
    console.error('[BOOKINGS] Error fetching booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking'
    });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Update booking status
 */
router.patch('/:id/status', async (req, res) => {
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
    console.error('[BOOKINGS] Error updating booking status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update booking status'
    });
  }
});

router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, paidAmount } = paymentUpdateSchema.parse(req.body);

    const booking = await storage.getBooking(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const total = Number(booking.totalAmount) ?? 0;
    const newPaid = Math.min(total, Number(paidAmount));

    let status: 'unpaid' | 'deposit_paid' | 'fully_paid' = 'unpaid';
    if (newPaid <= 0) status = 'unpaid';
    else if (newPaid < total) {
      status = type === PaymentType.DEPOSIT
        ? 'deposit_paid'
        : 'unpaid';
    } else {
      status = 'fully_paid';
    }

    // Map payment type to expected values
    let paymentMethod: 'cash' | 'cash_deposit' = 'cash';
    if (type === PaymentType.CASH) paymentMethod = 'cash';
    else if (type === PaymentType.DEPOSIT) paymentMethod = 'cash_deposit';
    else paymentMethod = 'cash';

    // Update booking with payment information
    const updatedBooking = await storage.updateBooking(id, {
      paidAmount: newPaid,
      paymentStatus: status,
      paymentMethod: paymentMethod,
    });

    // Send payment confirmation via FREE notification queue (async)
    try {
      const activity = booking.activity ? await storage.getActivity((booking.activity as any)._id || (booking.activity as any).id) : null;
      const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
      const remaining = total - newPaid;
      
      const message = `✅ *Payment Received!*

Activity: ${activity?.name || 'Activity'}
Paid: ${newPaid} MAD${remaining > 0 ? `\nRemaining: ${remaining} MAD` : '\n✅ Fully Paid'}

Thank you for your payment! See you at your activity! 🎉`.trim();

      freeNotificationQueue.addNotification({
        type: 'payment_confirmation',
        customerPhone: booking.customerPhone,
        customerName: booking.customerName,
        message,
        whatsappLink: freeNotificationQueue.generateWhatsAppLink(booking.customerPhone, message),
        priority: 'medium',
        bookingId: booking._id || booking.id,
        metadata: {
          activityName: activity?.name || 'Activity',
          amount: newPaid
        }
      });
    } catch (notificationError) {
      console.error('[BOOKINGS] Failed to send payment confirmation:', notificationError);
    }

    res.json({ success: true, payment: {
      type,
      paidAmount: newPaid,
      remaining: Math.max(0, total - newPaid),
      status,
    }});
  } catch (e) {
    console.error('Payment update error', e);
    res.status(400).json({ error: 'Invalid payment payload' });
  }
});

export default router;
