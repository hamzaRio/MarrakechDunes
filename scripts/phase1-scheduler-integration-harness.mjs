import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

assert.equal((await import('../server/dist/jobs/notification-scheduler.js')).depositExpirationEnabled(), false);
assert.equal((await import('../server/dist/jobs/notification-scheduler.js')).depositExpirationEnabled('false'), false);
assert.equal((await import('../server/dist/jobs/notification-scheduler.js')).depositExpirationEnabled(' true'), false);
assert.equal((await import('../server/dist/jobs/notification-scheduler.js')).depositExpirationEnabled('true'), true);
const source = await readFile(new URL('../server/src/index.ts', import.meta.url), 'utf8');
assert.match(source, /runtimeConfig\.role === 'api'/);
assert.match(source, /notificationScheduler/);
assert.match(await readFile(new URL('../server/src/services/scheduler-lease.ts', import.meta.url), 'utf8'), /findOneAndUpdate/);

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
const uri = repl.getUri('phase1_scheduler');
const client = new MongoClient(uri);
try {
  await client.connect();
  const bookings = client.db('phase1_scheduler').collection('bookings');
  const now = new Date();
  await bookings.insertMany([
    { bookingReference: 'SCHED-UNPAID', status: 'PENDING', totalAmount: '200', paidAmount: 0, depositDeadline: new Date(now.getTime() - 60_000) },
    { bookingReference: 'SCHED-DEPOSIT', status: 'PENDING', totalAmount: '200', paidAmount: 100, depositDeadline: new Date(now.getTime() - 60_000) },
    { bookingReference: 'SCHED-CONFIRMED', status: 'CONFIRMED', totalAmount: '200', paidAmount: 0, depositDeadline: new Date(now.getTime() - 60_000) },
    { bookingReference: 'SCHED-COMPLETED', status: 'COMPLETED', totalAmount: '200', paidAmount: 0, depositDeadline: new Date(now.getTime() - 60_000) },
  ]);
  process.env.DATABASE_URL = uri;
  process.env.MONGO_AUTO_INDEX = 'false';
  const { connectToDatabase } = await import('../server/dist/db.js');
  await connectToDatabase();
  const { storage } = await import('../server/dist/storage.js');
  const { acquireSchedulerLease, releaseSchedulerLease, initializeSchedulerLeaseIndexes } = await import('../server/dist/services/scheduler-lease.js');
  await initializeSchedulerLeaseIndexes();
  const leaseName = `phase1-acceptance-${Date.now()}`;
  const [leaseA, leaseB] = await Promise.all([
    acquireSchedulerLease(leaseName, 'instance-a', now, 1000),
    acquireSchedulerLease(leaseName, 'instance-b', now, 1000),
  ]);
  assert.equal([leaseA, leaseB].filter(Boolean).length, 1, 'only one scheduler instance may hold the lease');
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(await acquireSchedulerLease(leaseName, 'instance-recovered', new Date(now.getTime() + 1101), 1000), true, 'expired lease must be recoverable');
  await releaseSchedulerLease(leaseName, 'instance-recovered');
  const expired = await storage.expirePendingDepositDeadlines(now);
  assert.equal(expired.length, 1);
  const states = await bookings.find({ bookingReference: /^SCHED-/ }).sort({ bookingReference: 1 }).toArray();
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-UNPAID').status, 'CANCELLED');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-DEPOSIT').status, 'PENDING');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-CONFIRMED').status, 'CONFIRMED');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-COMPLETED').status, 'COMPLETED');
  console.log('Phase 1 scheduler integration: PASS (role gating, opt-in, expiry eligibility, protected states, replica-set lease source)');
} finally {
  const { default: mongoose } = await import('mongoose');
  await mongoose.disconnect();
  await client.close();
  await repl.stop();
}
