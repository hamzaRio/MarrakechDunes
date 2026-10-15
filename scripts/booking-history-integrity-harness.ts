import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
try {
  await mongoose.connect(replicaSet.getUri('booking_history_test'));
  const { storage } = await import('../server/src/storage.ts');
  const Activity = mongoose.model('Activity');
  const Booking = mongoose.model('Booking');
  await Promise.all([Activity.init(), Booking.init()]);

  const activity = await Activity.create({ name: 'Original excursion', description: 'Test', price: '120', currency: 'MAD', category: 'Test', imageUrls: [], isActive: true, approvalStatus: 'approved' });
  const missingId = new mongoose.Types.ObjectId();
  const legacy = await Booking.create({ customerName: 'Fixture', customerPhone: '000', activityId: missingId, numberOfPeople: 1, preferredDate: new Date('2040-09-22'), status: 'COMPLETED', totalAmount: '120', paymentStatus: 'deposit_paid', paidAmount: 30 });
  const historical = await storage.getBooking(String(legacy._id));
  assert.equal(historical?.activityId, String(missingId));
  assert.equal(historical?.activity?.name, 'Activité supprimée ou indisponible');
  assert.equal(historical?.status, 'COMPLETED');
  assert.equal(historical?.paidAmount, 30);
  const listed = await storage.getBookingsPaginated({ page: 1, limit: 10 });
  assert.equal(listed.bookings.find((row) => row._id === String(legacy._id))?.activity?.name, 'Activité supprimée ou indisponible');

  const booking = await storage.createBooking({ customerName: 'Fixture', customerPhone: '000', activityId: String(activity._id), numberOfPeople: 1, preferredDate: new Date('2040-09-23'), status: 'PENDING', totalAmount: '120', paymentStatus: 'unpaid', paidAmount: 0 } as any);
  assert.deepEqual(booking.activitySnapshot, { name: 'Original excursion', price: '120', currency: 'MAD' });
  await Booking.create({ customerName: 'Fixture', customerPhone: '000', activityId: missingId, numberOfPeople: 1, preferredDate: new Date('2040-10-01'), status: 'CANCELLED', totalAmount: '50', paymentStatus: 'fully_paid', paidAmount: 50 });
  const financial = await storage.getBookingSummary();
  assert.equal(financial.collectedPayments, 80, 'cancelled paid bookings still represent recorded cash');
  assert.equal(financial.outstandingAmount, 210, 'cancelled bookings must not create a collection balance');
  assert.equal(financial.grossBookingValue, 240, 'cancelled bookings must not inflate active booking value');
  await Activity.updateOne({ _id: activity._id }, { $set: { name: 'Renamed excursion', price: '150' } });
  assert.equal((await storage.getBooking(booking._id))?.activity?.name, 'Original excursion');
  await assert.rejects(storage.deleteActivity(String(activity._id)), (error: any) => error.code === 'ACTIVITY_HAS_BOOKINGS');
  await Activity.updateOne({ _id: activity._id }, { $set: { isActive: false } });
  await assert.rejects(storage.createBooking({ customerName: 'Fixture', customerPhone: '000', activityId: String(activity._id), numberOfPeople: 1, preferredDate: new Date('2040-09-24'), totalAmount: '150' } as any), (error: any) => error.code === 'ACTIVITY_UNAVAILABLE');
  assert.equal((await storage.getBooking(booking._id))?.activity?.name, 'Original excursion');

  const disposable = await Activity.create({ name: 'Disposable', description: 'Test', price: '50', category: 'Test', imageUrls: [], isActive: true });
  const race = await Promise.allSettled([
    storage.createBooking({ customerName: 'Fixture', customerPhone: '000', activityId: String(disposable._id), numberOfPeople: 1, preferredDate: new Date('2040-09-25'), totalAmount: '50' } as any),
    storage.deleteActivity(String(disposable._id)),
  ]);
  const raceBooking = await Booking.findOne({ activityId: disposable._id });
  const raceActivity = await Activity.findById(disposable._id);
  assert.ok(!raceBooking || raceActivity, 'concurrent deletion orphaned a booking');
  assert.ok(race.some((result) => result.status === 'rejected'), 'both conflicting operations unexpectedly succeeded');
  console.log('booking history, snapshot, deletion and race: PASS');
} finally {
  await mongoose.disconnect();
  await replicaSet.stop();
}
