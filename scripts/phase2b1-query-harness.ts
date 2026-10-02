import assert from 'node:assert/strict';
import {
  calculateBookingSummary,
  getCasablancaCalendarDate,
  normalizeBookingPagination,
  parseBookingDateOnly,
} from '../server/src/utils/booking-query.js';

const portalMock = {
  getBookings: () => { throw new Error('full collection lookup is forbidden'); },
  hasBookingsForCustomerPhone: async (phone: string) => phone === '+212600000000',
  getBookingsByCustomerPhone: async (phone: string) => phone === '+212600000000'
    ? [{ bookingReference: 'ABC12345', customerPhone: phone }]
    : [],
};
assert.equal(await portalMock.hasBookingsForCustomerPhone('+212600000000'), true);
assert.deepEqual(await portalMock.getBookingsByCustomerPhone('+212600000000'), [
  { bookingReference: 'ABC12345', customerPhone: '+212600000000' },
]);
assert.deepEqual(await portalMock.getBookingsByCustomerPhone('+212611111111'), []);

let reminderQuery: { date: Date; statuses: string[] } | null = null;
const schedulerStorage = {
  getBookings: () => { throw new Error('scheduler full collection lookup is forbidden'); },
  getBookingsForReminderDate: async (date: Date, statuses: string[]) => {
    reminderQuery = { date, statuses };
    return [];
  },
};
const now = new Date('2026-10-02T23:30:00.000Z');
await schedulerStorage.getBookingsForReminderDate(getCasablancaCalendarDate(now, 1), ['CONFIRMED']);
assert.ok(reminderQuery);
assert.deepEqual(reminderQuery!.statuses, ['CONFIRMED']);
assert.equal(reminderQuery!.date.toISOString().slice(0, 10), '2026-10-04');

const summary = calculateBookingSummary([
  { status: 'PENDING', totalAmount: '100', paidAmount: '20' },
  { status: 'CONFIRMED', totalAmount: 200, paidAmount: 250 },
  { status: 'COMPLETED', totalAmount: '300', paidAmount: 100 },
  { status: 'CANCELLED', totalAmount: '400', paidAmount: 75 },
  { status: 'cancelled', totalAmount: 'not-a-number', paidAmount: 'bad' },
]);
assert.equal(summary.totalBookings, 5);
assert.equal(summary.pendingBookings, 1);
assert.equal(summary.confirmedBookings, 1);
assert.equal(summary.completedBookings, 1);
assert.equal(summary.cancelledBookings, 2);
assert.equal(summary.grossBookingValue, 600);
assert.equal(summary.collectedPayments, 445);
assert.equal(summary.outstandingAmount, 280);

assert.ok(parseBookingDateOnly('2026-10-02'));
assert.equal(parseBookingDateOnly('2026-02-30'), null);
assert.equal(parseBookingDateOnly('2026-1-2'), null);
assert.equal(parseBookingDateOnly('2026-10-03', false)!.toISOString(), '2026-10-03T00:00:00.000Z');
assert.equal(parseBookingDateOnly('2026-10-03', true)!.toISOString(), '2026-10-03T23:59:59.999Z');

const pagination = normalizeBookingPagination({ page: -3, limit: 1000, sort: { field: 'customerPhone', order: 1 } });
assert.equal(pagination.page, 1);
assert.equal(pagination.limit, 100);
assert.deepEqual(pagination.sort, { field: 'createdAt', order: 1 });
assert.equal(Object.keys(summary).some((key) => /customer|phone|email|notes|id/i.test(key)), false);

console.log('Phase 2B1 query harness: PASS');
