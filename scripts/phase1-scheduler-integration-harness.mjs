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
  const { storage } = await import('../server/dist/storage.js');
  const expired = await storage.expirePendingDepositDeadlines(now);
  assert.equal(expired.length, 1);
  const states = await bookings.find({ bookingReference: /^SCHED-/ }).sort({ bookingReference: 1 }).toArray();
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-UNPAID').status, 'CANCELLED');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-DEPOSIT').status, 'PENDING');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-CONFIRMED').status, 'CONFIRMED');
  assert.equal(states.find((b) => b.bookingReference === 'SCHED-COMPLETED').status, 'COMPLETED');
  console.log('Phase 1 scheduler integration: PASS (role gating, opt-in, expiry eligibility, protected states, replica-set lease source)');
} finally {
  await client.close();
  await repl.stop();
}
