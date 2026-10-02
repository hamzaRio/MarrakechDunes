import assert from 'node:assert/strict';
import {
  hashIdempotencyKey,
  resolveIdempotentCreate,
  toPublicBookingResult,
} from '../server/src/utils/booking-idempotency.js';

type Booking = {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  participantNames: string[];
  notes: string;
  idempotencyKeyHash: string;
  bookingReference: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  depositAmount: number;
  paidAmount: number;
};

const key = 'phase1b-test-key-0001';
const hash = hashIdempotencyKey(key);
const winner: Booking = {
  _id: 'internal-1',
  customerName: 'Private Customer',
  customerPhone: '+000000000',
  customerEmail: 'private@example.test',
  participantNames: ['Private Customer'],
  notes: 'private note',
  idempotencyKeyHash: hash,
  bookingReference: 'MD-ABCDEF1234',
  status: 'PENDING',
  paymentStatus: 'unpaid',
  totalAmount: '450',
  depositAmount: 140,
  paidAmount: 0,
};

let persisted: Booking | null = null;
let inserts = 0;
let notifications = 0;
const logs: string[] = [];

async function submit(idempotencyKeyHash: string, mode: 'normal' | 'duplicate' | 'reference-collision' = 'normal') {
  const result = await resolveIdempotentCreate({
    idempotencyKeyHash,
    findExisting: async (lookupHash) => persisted?.idempotencyKeyHash === lookupHash ? persisted : null,
    create: async () => {
      if (mode === 'duplicate') {
        persisted = winner;
        throw Object.assign(new Error('duplicate idempotency key'), { code: 11000 });
      }
      if (mode === 'reference-collision') {
        throw Object.assign(new Error('duplicate booking reference'), { code: 11000 });
      }
      inserts += 1;
      persisted = winner;
      return winner;
    },
  });
  if (result.created) {
    notifications += 1;
    logs.push(`created:${result.booking.bookingReference}`);
  }
  return result;
}

const first = await submit(hash);
assert.equal(first.created, true, 'first request creates the booking');
assert.equal(inserts, 1);
assert.equal(notifications, 1);
assert.equal(first.booking.bookingReference, winner.bookingReference);
assert.equal(JSON.stringify(first.booking).includes(key), false, 'raw idempotency key is not persisted');

const replay = await submit(hash);
assert.equal(replay.created, false, 'replay does not insert');
assert.equal(inserts, 1);
assert.equal(notifications, 1);
assert.equal(replay.booking.bookingReference, winner.bookingReference);

persisted = null;
const concurrent = await submit(hash, 'duplicate');
assert.equal(concurrent.created, false, 'duplicate-key race resolves to the winner');
assert.equal(concurrent.booking.bookingReference, winner.bookingReference);
assert.equal(inserts, 1);
assert.equal(notifications, 1);

persisted = null;
await assert.rejects(() => submit(hash, 'reference-collision'), /duplicate booking reference/);
assert.equal(persisted, null, 'reference collision is not treated as an idempotency replay');

const publicResult = toPublicBookingResult(winner);
assert.deepEqual(Object.keys(publicResult).sort(), [
  'bookingReference', 'bookingStatus', 'depositAmount', 'paymentStatus',
  'remainingAmount', 'status', 'totalAmount',
].sort());
for (const forbidden of ['_id', 'id', 'customerName', 'customerPhone', 'customerEmail', 'participantNames', 'notes', 'idempotencyKeyHash']) {
  assert.equal(forbidden in publicResult, false, `${forbidden} is not public`);
}
assert.equal(logs.some((entry) => entry.includes(key)), false, 'raw idempotency key is never logged');

console.log('Phase 1B idempotency harness: PASS');
