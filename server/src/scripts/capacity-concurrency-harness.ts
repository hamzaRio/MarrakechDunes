// M4 verification: proves storage.confirmBookingWithCapacity() does not
// overbook under concurrent confirmation requests, using a disposable
// MongoDB replica set (transactions/causal consistency require a replica
// set, which is why this isn't a plain standalone mongod).
//
// Scenario (matches the owner-specified acceptance test): an activity with
// capacity=10, 8 seats already CONFIRMED, and two PENDING bookings of 2
// people each are confirmed at the same time. Exactly one confirmation
// must succeed and the other must be rejected with CAPACITY_EXCEEDED - the
// occupied total must end at exactly 10, never 12. Repeated 5 times with a
// fresh replica set each run.
//
// Run with: npx tsx src/scripts/capacity-concurrency-harness.ts
// (from server/, after `npm install` has pulled in the mongodb-memory-server
// devDependency added for this test)
//
// KNOWN ENVIRONMENT LIMITATION (as of this hardening session): this
// container's network allowlist does not include fastdl.mongodb.org, so
// mongodb-memory-server cannot download a mongod binary here -
// MongoMemoryReplSet.create() fails with a 403/"download failed" error
// before any assertion runs. This script is correct and ready to run in
// an environment with that network access (or a pre-cached mongod
// binary via MONGOMS_DOWNLOAD_DIR) - it has NOT been successfully
// executed in this session, and M4's concurrency claim rests on the code
// review/atomic-$inc design in storage.ts, not on this test's output.
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function run(): Promise<boolean> {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  const uri = replSet.getUri('capacity_test');
  await mongoose.connect(uri);

  try {
    // Register schemas/models (storage.ts does this as a module side effect).
    const storageModule = await import('../storage.js');
    const storage: any = storageModule.storage;

    const Activity = mongoose.model('Activity');
    const Booking = mongoose.model('Booking');

    const activity = await Activity.create({
      name: 'Concurrency Test Activity',
      description: 'test',
      category: 'test',
      location: 'test',
      price: 100,
      duration: '1h',
      maxParticipants: 10,
      capacitySettings: { maxParticipants: 10, overbookingAllowed: false },
      isActive: true,
      approvalStatus: 'approved',
    });

    const dateKey = '2030-01-01T00:00:00.000Z';
    // 8 seats already confirmed via 4 separate bookings (realistic shape).
    for (let i = 0; i < 4; i++) {
      await Booking.create({
        customerName: `Existing ${i}`,
        customerPhone: '+00000000',
        activityId: activity._id,
        numberOfPeople: 2,
        preferredDate: new Date(dateKey),
        status: 'CONFIRMED',
        totalAmount: '100',
        capacityReserved: 2,
      });
    }
    // Seed the capacity counter to match (normally done lazily by
    // confirmBookingWithCapacity's ensure-exists step, but we seed the
    // occupied count directly here since the 8 are already CONFIRMED,
    // not confirmed through the atomic path).
    const CapacityCounter = mongoose.model('CapacityCounter');
    await CapacityCounter.create({ activityId: String(activity._id), dateKey: dateKey.slice(0, 10), occupied: 8 });

    const pendingA = await Booking.create({
      customerName: 'Pending A', customerPhone: '+1', activityId: activity._id,
      numberOfPeople: 2, preferredDate: new Date(dateKey), status: 'PENDING', totalAmount: '100',
    });
    const pendingB = await Booking.create({
      customerName: 'Pending B', customerPhone: '+2', activityId: activity._id,
      numberOfPeople: 2, preferredDate: new Date(dateKey), status: 'PENDING', totalAmount: '100',
    });

    const [resultA, resultB] = await Promise.all([
      storage.confirmBookingWithCapacity(String(pendingA._id), 10),
      storage.confirmBookingWithCapacity(String(pendingB._id), 10),
    ]);

    const successes = [resultA, resultB].filter((r) => r.ok).length;
    const finalCounter = await CapacityCounter.findOne({ activityId: String(activity._id), dateKey: dateKey.slice(0, 10) });
    const occupied = finalCounter?.occupied ?? -1;

    const pass = successes === 1 && occupied === 10;
    console.log(`[capacity-concurrency] successes=${successes} occupied=${occupied} -> ${pass ? 'PASS' : 'FAIL'}`);
    return pass;
  } finally {
    await mongoose.disconnect();
    await replSet.stop();
  }
}

async function main() {
  const results: boolean[] = [];
  for (let i = 1; i <= 5; i++) {
    console.log(`[capacity-concurrency] run ${i}/5`);
    results.push(await run());
  }
  const allPass = results.every(Boolean);
  console.log(allPass ? '[capacity-concurrency] ALL RUNS PASSED' : '[capacity-concurrency] FAILED - overbooking or wrong success count occurred');
  process.exitCode = allPass ? 0 : 1;
}

main().catch((error) => {
  console.error('[capacity-concurrency] harness error:', error);
  process.exitCode = 1;
});
