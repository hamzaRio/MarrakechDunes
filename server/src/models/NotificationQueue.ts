import mongoose from 'mongoose';

const notificationQueueSchema = new mongoose.Schema({
  dedupeKey: { type: String, unique: true, sparse: true },
  type: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String, required: true },
  message: { type: String, required: true },
  whatsappLink: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  bookingId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
}, { timestamps: true, collection: 'notification_queue' });

notificationQueueSchema.index({ createdAt: -1 });
notificationQueueSchema.index({ status: 1, createdAt: -1 });
notificationQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const NotificationQueueModel = mongoose.models.NotificationQueue
  ?? mongoose.model('NotificationQueue', notificationQueueSchema);

export async function initializeNotificationQueueIndexes(): Promise<void> {
  await NotificationQueueModel.init();
}
