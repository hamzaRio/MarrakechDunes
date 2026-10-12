import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function main() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri('capacity_legacy_test'));
  try {
    const { storage } = await import('../storage.js');
    const Activity = mongoose.model('Activity');
    const Booking = mongoose.model('Booking');
    const CapacityCounter = mongoose.model('CapacityCounter');
    const AuditLog = mongoose.model('AuditLog');
    const activity = await Activity.create({ name: 'Legacy capacity test', description: 'test', category: 'test', price: 1, imageUrls: [], maxParticipants: 10, capacitySettings: { maxParticipants: 10 } });
    const date = new Date('2031-01-02T00:00:00.000Z');

    const legacy = await Booking.create({ customerName: 'Legacy', customerPhone: '1', activityId: activity._id, numberOfPeople: 3, preferredDate: date, status: 'CONFIRMED', totalAmount: '1' });
    await Booking.updateOne({ _id: legacy._id }, { $unset: { capacityReserved: 1 } });
    if (await CapacityCounter.countDocuments() !== 0) throw new Error('fixture unexpectedly included a capacity counter');
    await storage.updateBookingStatusAtomic(String(legacy._id), 'CANCELLED');
    const afterCancel = await CapacityCounter.findOne({ activityId: String(activity._id), dateKey: '2031-01-02' });
    if (afterCancel?.occupied !== 0) throw new Error(`legacy cancel occupied=${afterCancel?.occupied}`);

    const legacyDelete = await Booking.create({ customerName: 'Legacy delete', customerPhone: '2', activityId: activity._id, numberOfPeople: 2, preferredDate: date, status: 'CONFIRMED', totalAmount: '1' });
    await Booking.updateOne({ _id: legacyDelete._id }, { $unset: { capacityReserved: 1 } });
    const deleted = await storage.deleteBookingAtomic(String(legacyDelete._id), { userId: 'test', action: 'BOOKING_DELETE', details: '{}' });
    if (!deleted.deleted) throw new Error('legacy delete failed');
    const afterDelete = await CapacityCounter.findOne({ activityId: String(activity._id), dateKey: '2031-01-02' });
    if (afterDelete?.occupied !== 0) throw new Error(`legacy delete occupied=${afterDelete?.occupied}`);
    if (await AuditLog.countDocuments({ action: 'BOOKING_DELETE' }) !== 1) throw new Error('delete audit missing');

    const legacyMove = await Booking.create({ customerName: 'Legacy move', customerPhone: '3', activityId: activity._id, numberOfPeople: 1, preferredDate: date, status: 'CONFIRMED', totalAmount: '1' });
    await Booking.updateOne({ _id: legacyMove._id }, { $unset: { capacityReserved: 1 } });
    let rejected = false;
    try { await storage.updateBooking(String(legacyMove._id), { preferredDate: new Date('2031-01-03T00:00:00.000Z') } as any); } catch { rejected = true; }
    if (!rejected) throw new Error('unsafe confirmed reschedule was accepted');
    console.log('[capacity-legacy-lifecycle] cancel/delete reconciliation and unsafe reschedule rejection: PASS');
  } finally {
    await mongoose.disconnect();
    await replSet.stop();
  }
}

main().catch((error) => { console.error('[capacity-legacy-lifecycle] FAIL', error); process.exitCode = 1; });
