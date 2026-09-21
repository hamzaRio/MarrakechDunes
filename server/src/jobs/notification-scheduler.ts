/**
 * Automated Notification Scheduler
 * Runs scheduled jobs to send automated reminders and notifications
 */

import { storage } from '../storage.js';
import { whatsappService } from '../whatsapp-service.js';
import type { BookingWithActivity } from 'marrakechdunes-shared/schema';
import { formatBookingDateOnly } from '../utils/booking-date.js';

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
      // Bookings carry a calendar date, not an appointment time. Queue one
      // reminder for tomorrow instead of manufacturing 24h/2h precision.
      const bookings24h = this.getBookingsNeedingReminder(bookings, 1, now);
      const bookings2h: BookingWithActivity[] = [];
      
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
    daysBefore: number,
    now: Date
  ): BookingWithActivity[] {
    return bookings.filter(booking => {
      // Only send reminders for confirmed bookings. (The 'PAID' status
      // referenced here previously doesn't exist in the canonical
      // PENDING/CONFIRMED/COMPLETED/CANCELLED vocabulary - see Phase 4
      // correction pass §3 - and no booking was ever actually assigned
      // that value, so this narrows to the check that was already the
      // only one that could ever match.)
      if (booking.status !== 'CONFIRMED') {
        return false;
      }
      
      const dateOnly = new Date(booking.preferredDate);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const todayUtc = new Date(`${today}T00:00:00.000Z`).getTime();
      return (dateOnly.getTime() - todayUtc) / 86400000 === daysBefore;
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

    // Use FREE notification queue (Twilio removed)
    const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
    const activityName = booking.activity.name || 'Activity';
    const date = formatBookingDateOnly(new Date(booking.preferredDate));

    const paymentReminder = booking.paymentStatus === 'unpaid' 
      ? '\n💰 Remember to bring cash payment'
      : booking.paymentStatus === 'deposit_paid'
      ? '\n💰 Balance payment due on arrival'
      : '\n✅ Payment received';

    const message = `⏰ *Reminder: Your activity is tomorrow!*

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

