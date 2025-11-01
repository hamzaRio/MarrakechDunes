/**
 * Automated Notification Scheduler
 * Runs scheduled jobs to send automated reminders and notifications
 */

import { storage } from '../storage.js';
import { whatsappService } from '../whatsapp-service.js';
import type { BookingWithActivity } from 'marrakechdunes-shared/schema';

// Simple scheduler using setInterval (can be replaced with node-cron later)
class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('[SCHEDULER] Scheduler already running');
      return;
    }

    console.log('[SCHEDULER] Starting notification scheduler...');
    this.isRunning = true;

    // Check for reminders every hour
    this.intervalId = setInterval(async () => {
      try {
        await this.processReminders();
      } catch (error) {
        console.error('[SCHEDULER] Error processing reminders:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Run immediately on startup
    this.processReminders();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SCHEDULER] Scheduler stopped');
  }

  /**
   * Process all pending reminders
   */
  private async processReminders(): Promise<void> {
    console.log('[SCHEDULER] Processing reminders...');
    
    try {
      const bookings = await storage.getBookings();
      const now = new Date();
      
      // Find bookings that need reminders
      const bookings24h = this.getBookingsNeedingReminder(bookings, 24, now);
      const bookings2h = this.getBookingsNeedingReminder(bookings, 2, now);
      
      console.log(`[SCHEDULER] Found ${bookings24h.length} bookings needing 24h reminders, ${bookings2h.length} needing 2h reminders`);
      
      // Send 24h reminders
      for (const booking of bookings24h) {
        try {
          await this.sendReminder(booking, '24h');
          console.log(`[SCHEDULER] Sent 24h reminder for booking ${booking._id || booking.id}`);
        } catch (error) {
          console.error(`[SCHEDULER] Failed to send 24h reminder for booking ${booking._id || booking.id}:`, error);
        }
      }
      
      // Send 2h reminders
      for (const booking of bookings2h) {
        try {
          await this.sendReminder(booking, '2h');
          console.log(`[SCHEDULER] Sent 2h reminder for booking ${booking._id || booking.id}`);
        } catch (error) {
          console.error(`[SCHEDULER] Failed to send 2h reminder for booking ${booking._id || booking.id}:`, error);
        }
      }
      
      console.log('[SCHEDULER] Reminders processing completed');
    } catch (error) {
      console.error('[SCHEDULER] Error processing reminders:', error);
    }
  }

  /**
   * Get bookings that need reminders
   */
  private getBookingsNeedingReminder(
    bookings: BookingWithActivity[],
    hoursBefore: number,
    now: Date
  ): BookingWithActivity[] {
    return bookings.filter(booking => {
      // Only send reminders for confirmed bookings
      if (booking.status !== 'CONFIRMED' && booking.status !== 'PAID') {
        return false;
      }
      
      const bookingDate = new Date(booking.preferredDate);
      const timeDiff = bookingDate.getTime() - now.getTime();
      const hoursUntil = timeDiff / (1000 * 60 * 60);
      
      // Check if booking is within the reminder window (hoursBefore to hoursBefore-1)
      return hoursUntil > 0 && hoursUntil <= hoursBefore && hoursUntil > (hoursBefore - 1);
    });
  }

  /**
   * Send reminder notification using Twilio WhatsApp
   */
  private async sendReminder(booking: BookingWithActivity, type: '24h' | '2h'): Promise<void> {
    if (!booking.activity) {
      console.warn(`[SCHEDULER] Cannot send reminder - booking ${booking._id || booking.id} has no activity`);
      return;
    }

    try {
      // Try Twilio WhatsApp first (preferred)
      const { twilioService } = await import('../services/twilio-service.js');
      const hoursBefore = type === '24h' ? 24 : 2;
      
      const sent = await twilioService.sendReminder({
        customerPhone: booking.customerPhone,
        activityName: booking.activity.name || 'Activity',
        preferredDate: booking.preferredDate,
        paymentStatus: booking.paymentStatus,
        numberOfPeople: booking.numberOfPeople
      }, hoursBefore);

      if (sent) {
        console.log(`[SCHEDULER] Twilio reminder sent for booking ${booking._id || booking.id}`);
        return;
      }
    } catch (twilioError) {
      console.warn(`[SCHEDULER] Twilio reminder failed, falling back to WhatsApp service:`, twilioError);
    }

    // Fallback to FREE notification queue
    const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
    const hoursBefore = type === '24h' ? 24 : 2;
    const activityName = booking.activity.name || 'Activity';
    const date = new Date(booking.preferredDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const paymentReminder = booking.paymentStatus === 'unpaid' 
      ? '\n💰 Remember to bring cash payment'
      : booking.paymentStatus === 'deposit_paid'
      ? '\n💰 Balance payment due on arrival'
      : '\n✅ Payment received';

    const message = `⏰ *Reminder: ${hoursBefore}h until your activity!*

*${activityName}*
📅 ${date}
👥 ${booking.numberOfPeople || 1} ${booking.numberOfPeople === 1 ? 'person' : 'people'}${paymentReminder}

See you soon! 🏜️`.trim();

    freeNotificationQueue.addNotification({
      type: type === '24h' ? 'reminder_24h' : 'reminder_2h',
      customerPhone: booking.customerPhone,
      customerName: booking.customerName,
      message,
      whatsappLink: freeNotificationQueue.generateWhatsAppLink(booking.customerPhone, message),
      priority: type === '2h' ? 'high' : 'medium',
      bookingId: booking._id || booking.id,
      metadata: {
        activityName,
        date: booking.preferredDate.toString()
      }
    });
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();

