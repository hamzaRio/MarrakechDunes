/**
 * FREE Notification Queue System
 * Stores pending WhatsApp messages that admins can send via clickable links
 * 100% Free - No API costs, no subscriptions
 */
import mongoose from 'mongoose';
import { NotificationQueueModel } from '../models/NotificationQueue.js';

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
  dedupeKey?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

class FreeNotificationQueue {
  private queue: PendingNotification[] = [];
  private maxQueueSize = 100; // Keep last 100 notifications

  /**
   * Add notification to queue
   */
  async addNotificationDurable(notification: Omit<PendingNotification, 'id' | 'createdAt'>): Promise<string> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (process.env.NODE_ENV === 'production' && mongoose.connection.readyState !== 1) {
      console.error('[FREE NOTIFICATIONS] Durable queue unavailable; notification not enqueued');
      return id;
    }
    const pendingNotif: PendingNotification = {
      ...notification,
      id,
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await NotificationQueueModel.create({ ...pendingNotif, dedupeKey: notification.dedupeKey, status: 'PENDING' });
      } catch (error: any) {
        if (error?.code !== 11000) console.error('[FREE NOTIFICATIONS] Durable enqueue failed:', error?.name || 'Error');
        return id;
      }
    }

    this.queue.unshift(pendingNotif); // Add to beginning for development compatibility

    // Keep queue size manageable
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(0, this.maxQueueSize);
    }

    console.log(`[FREE NOTIFICATIONS] Added to queue: ${notification.type}`);
    return id;
  }

  /** Development/test compatibility wrapper. Production callers use addNotificationDurable. */
  addNotification(notification: Omit<PendingNotification, 'id' | 'createdAt'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingNotif: PendingNotification = { ...notification, id, createdAt: new Date() };
    this.queue.unshift(pendingNotif);
    if (this.queue.length > this.maxQueueSize) this.queue = this.queue.slice(0, this.maxQueueSize);
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

  async getQueueDurable(limit?: number): Promise<PendingNotification[]> {
    if (mongoose.connection.readyState !== 1) return process.env.NODE_ENV === 'production' ? [] : this.getQueue(limit);
    try {
      const rows = await NotificationQueueModel.find({ status: 'PENDING', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(limit || 100).lean();
      return rows.map((row: any) => ({ ...row, id: String(row._id), createdAt: new Date(row.createdAt) }));
    } catch { return process.env.NODE_ENV === 'production' ? [] : this.getQueue(limit); }
  }

  async getStatsDurable() {
    const rows = await this.getQueueDurable(1000);
    return {
      total: rows.length,
      byType: Object.fromEntries(['booking_confirmation', 'reminder_24h', 'reminder_2h', 'payment_confirmation', 'reschedule', 'cancellation', 'auto_response'].map((type) => [type, rows.filter((row) => row.type === type).length])),
      byPriority: Object.fromEntries(['high', 'medium', 'low'].map((priority) => [priority, rows.filter((row) => row.priority === priority).length])),
    };
  }

  async removeNotificationDurable(id: string): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      try {
        const result = await NotificationQueueModel.updateOne({ _id: id, status: 'PENDING' }, { $set: { status: 'COMPLETED' } });
        if (result.modifiedCount === 1) { this.removeNotification(id); return true; }
      } catch { /* compatibility fallback below */ }
    }
    return process.env.NODE_ENV === 'production' ? false : this.removeNotification(id);
  }
}

export const freeNotificationQueue = new FreeNotificationQueue();

// Clean up old notifications every hour
const notificationCleanupTimer = setInterval(() => {
  const removed = freeNotificationQueue.clearOldNotifications();
  if (removed > 0) {
    console.log(`[FREE NOTIFICATIONS] Cleaned up ${removed} old notifications`);
  }

}, 60 * 60 * 1000);
notificationCleanupTimer.unref?.();

export function stopNotificationQueueCleanup(): void {
  clearInterval(notificationCleanupTimer);
}

