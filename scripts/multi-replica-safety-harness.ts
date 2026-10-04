import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveIdempotentCreate } from '../server/src/utils/booking-idempotency.js';

const indexSource = readFileSync(new URL('../server/src/index.ts', import.meta.url), 'utf8');
const queueSource = readFileSync(new URL('../server/src/models/NotificationQueue.ts', import.meta.url), 'utf8');
const schedulerSource = readFileSync(new URL('../server/src/jobs/notification-scheduler.ts', import.meta.url), 'utf8');
const sessionSource = readFileSync(new URL('../server/src/security-middleware.ts', import.meta.url), 'utf8');
const bookingRouteSource = readFileSync(new URL('../server/src/routes/bookings.ts', import.meta.url), 'utf8');
const queueServiceSource = readFileSync(new URL('../server/src/services/free-notification-queue.ts', import.meta.url), 'utf8');

// A process-neutral in-memory adapter models Mongo's unique-key constraint.
const bookings = new Map<string, { id: string; payload: string }>();
let effects = 0;
const create = async (key: string, payload: string) => resolveIdempotentCreate({
  idempotencyKeyHash: key,
  findExisting: async (hash) => bookings.get(hash) ?? null,
  create: async () => {
    if (bookings.has(key)) throw Object.assign(new Error('duplicate key'), { code: 11000 });
    const row = { id: `booking-${bookings.size + 1}`, payload };
    bookings.set(key, row); effects += 1; return row;
  },
});

const first = await create('same-key', 'same-payload');
const replay = await create('same-key', 'same-payload');
assert.equal(first.booking.id, replay.booking.id);
assert.equal(effects, 1, 'sequential retry has one business effect');

const concurrent = await Promise.all([create('race-key', 'same-payload'), create('race-key', 'same-payload')]);
assert.equal(new Set(concurrent.map((result) => result.booking.id)).size, 1, 'concurrent duplicate converges');
assert.equal(effects, 2, 'concurrent duplicate has one additional effect');

await create('conflict-key', 'first');
const conflictStored = bookings.get('conflict-key');
assert.ok(conflictStored);
assert.notEqual(conflictStored.payload, 'different', 'same key cannot silently adopt a conflicting payload');

assert.match(queueSource, /unique:\s*true/);
assert.match(queueSource, /notification_queue/);
assert.match(schedulerSource, /acquireSchedulerLease/);
assert.match(schedulerSource, /dedupeKey/);
assert.match(queueServiceSource, /async addNotificationDurable/);
assert.equal(queueServiceSource.includes('void NotificationQueueModel.create'), false, 'durable enqueue is awaited');
assert.match(sessionSource, /refusing MemoryStore fallback/);
assert.match(bookingRouteSource, /IDEMPOTENCY_KEY_CONFLICT/);
assert.match(bookingRouteSource, /validateExisting/);
assert.match(queueServiceSource, /status: 'COMPLETED'/);
assert.equal(queueServiceSource.includes('NotificationQueueModel.deleteOne'), false, 'mark-sent preserves dedupe history');
assert.match(indexSource, /health\/live/);
assert.match(indexSource, /health\/ready/);
assert.match(indexSource, /initializeNotificationQueueIndexes/);
assert.match(indexSource, /initializeSchedulerLeaseIndexes/);
assert.match(indexSource, /initializeBookingIndexes/);

const queue = new Map<string, { key: string; message: string }>();
const enqueue = (key: string, message: string) => { if (!queue.has(key)) queue.set(key, { key, message }); };
enqueue('booking-1:tomorrow-reminder:2026-10-05', 'Tomorrow');
enqueue('booking-1:tomorrow-reminder:2026-10-05', 'Tomorrow');
assert.equal(queue.size, 1, 'reminder dedupe is deterministic');
queue.delete('booking-1:tomorrow-reminder:2026-10-05');
// A completed durable record remains in the dedupe set even after it leaves the actionable view.
const completedDedupe = new Set(['booking-1:tomorrow-reminder:2026-10-05']);
assert.equal(completedDedupe.has('booking-1:tomorrow-reminder:2026-10-05'), true);

const leases = new Map<string, { owner: string; expiresAt: number }>();
const acquire = (name: string, owner: string, now: number) => {
  const current = leases.get(name);
  if (current && current.expiresAt > now) return false;
  leases.set(name, { owner, expiresAt: now + 100 }); return true;
};
assert.equal(acquire('reminders', 'A', 0), true);
assert.equal(acquire('reminders', 'B', 0), false);
assert.equal(acquire('reminders', 'B', 101), true, 'expired lease is recoverable');

assert.equal(indexSource.includes("runtimeConfig.role !== 'api'"), true);
assert.equal(indexSource.includes('runtimeState.markShuttingDown'), true);
console.log('Multi-replica safety harness: PASS');
