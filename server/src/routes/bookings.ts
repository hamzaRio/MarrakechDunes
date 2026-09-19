import express from 'express';
import { storage } from '../storage.js';
// Twilio removed - using free notification queue only

const router = express.Router();

/**
 * POST /api/bookings
 * Create a new booking with auto-deposit calculation
 */
router.post('/', async (req, res) => {
  try {
    const bookingData = { ...req.body, status: 'PENDING' };
    
    // Ensure totalAmount is present and valid
    if (!bookingData.totalAmount || Number(bookingData.totalAmount) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'totalAmount is required and must be greater than 0'
      });
    }
    
    // AUTO-CALCULATE DEPOSIT (30% of total, minimum 100 MAD)
    const totalAmount = Number(bookingData.totalAmount);
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

export default router;
