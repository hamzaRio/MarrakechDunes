import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function main() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri('capacity_override_test'));
  try {
    const { storage } = await import('../storage.js');
    const Activity = mongoose.model('Activity');
    const Booking = mongoose.model('Booking');
    const CapacityCounter = mongoose.model('CapacityCounter');
    const AuditLog = mongoose.model('AuditLog');
    const activity = await Activity.create({ name: 'Override rollback', description: 'test', category: 'test', price: 1, imageUrls: [], maxParticipants: 1, capacitySettings: { maxParticipants: 1 } });
    const booking = await Booking.create({ customerName: 'Override', customerPhone: '1', activityId: activity._id, numberOfPeople: 2, preferredDate: new Date('2032-01-01T00:00:00.000Z'), status: 'PENDING', totalAmount: '1' });
    const originalCreate = AuditLog.create.bind(AuditLog);
    (AuditLog as any).create = async () => { throw new Error('induced audit failure'); };
    let failed = false;
    try {
      await storage.confirmBookingWithCapacity(String(booking._id), 1, { force: true, audit: { userId: 'test', action: 'BOOKING_STATUS_OVERRIDE', details: '{}' } });
    } catch { failed = true; }
    (AuditLog as any).create = originalCreate;
    const after = await Booking.findById(booking._id);
    const counter = await CapacityCounter.findOne({ activityId: String(activity._id), dateKey: '2032-01-01' });
    if (!failed || String(after?.status).toUpperCase() !== 'PENDING' || counter?.occupied) throw new Error('override audit failure did not roll back booking and capacity');
    console.log('[capacity-override-rollback] induced audit failure rollback: PASS');
  } finally {
    await mongoose.disconnect();
    await replSet.stop();
  }
}

main().catch((error) => { console.error('[capacity-override-rollback] FAIL', error); process.exitCode = 1; });
