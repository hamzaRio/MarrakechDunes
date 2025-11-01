/**
 * FREE Notification Queue System
 * Stores pending WhatsApp messages that admins can send via clickable links
 * 100% Free - No API costs, no subscriptions
 */

export interface PendingNotification {
  id: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'payment_confirmation' | 'reschedule' | 'cancellation' | 'auto_response';
  customerPhone: string;
  customerName: string;
  message: string;
  whatsappLink: string;
  createdAt: Date;
  priority: 'high' | 'medium' | 'low';
  bookingId?: string;
  metadata?: {
    activityName?: string;
    date?: string;
    amount?: number;
    originalMessage?: string; // For auto-responses, store the original customer message
    confidence?: number; // Auto-response confidence level
    needsReview?: boolean; // If true, admin should review before sending
  };
}

class FreeNotificationQueue {
  private queue: PendingNotification[] = [];
  private maxQueueSize = 100; // Keep last 100 notifications

  /**
   * Add notification to queue
   */
  addNotification(notification: Omit<PendingNotification, 'id' | 'createdAt'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingNotif: PendingNotification = {
      ...notification,
      id,
      createdAt: new Date()
    };

    this.queue.unshift(pendingNotif); // Add to beginning

    // Keep queue size manageable
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(0, this.maxQueueSize);
    }

    console.log(`[FREE NOTIFICATIONS] Added to queue: ${notification.type} for ${notification.customerName}`);
    return id;
  }

  /**
   * Get all pending notifications
   */
  getQueue(limit?: number): PendingNotification[] {
    if (limit) {
      return this.queue.slice(0, limit);
    }
    return [...this.queue];
  }

  /**
   * Get notifications by type
   */
  getByType(type: PendingNotification['type']): PendingNotification[] {
    return this.queue.filter(n => n.type === type);
  }

  /**
   * Get high priority notifications
   */
  getHighPriority(): PendingNotification[] {
    return this.queue.filter(n => n.priority === 'high');
  }

  /**
   * Remove notification from queue (after sending)
   */
  removeNotification(id: string): boolean {
    const index = this.queue.findIndex(n => n.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear old notifications (older than 7 days)
   */
  clearOldNotifications(): number {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(n => n.createdAt > sevenDaysAgo);
    return initialLength - this.queue.length;
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      total: this.queue.length,
      byType: {
        booking_confirmation: this.queue.filter(n => n.type === 'booking_confirmation').length,
        reminder_24h: this.queue.filter(n => n.type === 'reminder_24h').length,
        reminder_2h: this.queue.filter(n => n.type === 'reminder_2h').length,
        payment_confirmation: this.queue.filter(n => n.type === 'payment_confirmation').length,
        reschedule: this.queue.filter(n => n.type === 'reschedule').length,
        cancellation: this.queue.filter(n => n.type === 'cancellation').length,
        auto_response: this.queue.filter(n => n.type === 'auto_response').length,
      },
      byPriority: {
        high: this.queue.filter(n => n.priority === 'high').length,
        medium: this.queue.filter(n => n.priority === 'medium').length,
        low: this.queue.filter(n => n.priority === 'low').length,
      }
    };
  }

  /**
   * Generate WhatsApp link
   */
  generateWhatsAppLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
}

export const freeNotificationQueue = new FreeNotificationQueue();

// Clean up old notifications every hour
setInterval(() => {
  const removed = freeNotificationQueue.clearOldNotifications();
  if (removed > 0) {
    console.log(`[FREE NOTIFICATIONS] Cleaned up ${removed} old notifications`);
  }
}, 60 * 60 * 1000);

