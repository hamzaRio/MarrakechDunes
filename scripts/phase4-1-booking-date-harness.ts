import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatLocalDateOnly, getBookingCalendarDayDistance, getBookingCalendarDayLabel, getBookingDate, getBookingDateOnly, isBookingDateTodayOrLater, normalizeBookingDateOnlyInput } from '../client/src/lib/booking-utils.ts';
import { formatBookingDateOnly, isBookingDateInPast, parseBookingDateOnly } from '../server/src/utils/booking-date.ts';

const bookingRoute = readFileSync(new URL('../server/src/routes/bookings.ts', import.meta.url), 'utf8');
const adminRoutes = readFileSync(new URL('../server/src/routes/admin.ts', import.meta.url), 'utf8');
const storageSource = readFileSync(new URL('../server/src/storage.ts', import.meta.url), 'utf8');

const originalTimeZone = process.env.TZ;
try {
  process.env.TZ = 'Pacific/Kiritimati';
  const selectedLocalDate = new Date(2026, 8, 21);
  assert.equal(selectedLocalDate.toISOString().slice(0, 10), '2026-09-20', 'fixture demonstrates the prior UTC conversion bug');
  assert.equal(formatLocalDateOnly(selectedLocalDate), '2026-09-21');
  assert.equal(normalizeBookingDateOnlyInput(selectedLocalDate), '2026-09-21');
  assert.equal(formatLocalDateOnly(getBookingDateOnly('2026-09-21T00:00:00.000Z')!), '2026-09-21');

  process.env.TZ = 'America/Los_Angeles';
  const selectedLosAngelesDate = new Date(2026, 8, 21);
  assert.equal(formatLocalDateOnly(selectedLosAngelesDate), '2026-09-21');
  assert.equal(normalizeBookingDateOnlyInput(selectedLosAngelesDate), '2026-09-21');
  assert.equal(formatLocalDateOnly(getBookingDateOnly('2026-09-21')!), '2026-09-21');
  assert.equal(isBookingDateTodayOrLater('2026-09-21', new Date(2026, 8, 21, 12)), true);
  assert.equal(isBookingDateTodayOrLater('2026-09-20', new Date(2026, 8, 21, 12)), false);
  assert.equal(getBookingDate('2026-09-21T00:00:00.000Z')?.toISOString(), '2026-09-21T00:00:00.000Z', 'timestamp parsing remains instant-based');
} finally {
  if (originalTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimeZone;
}

const requestedDate = parseBookingDateOnly('2026-09-21');
assert.ok(requestedDate);
assert.equal(requestedDate.toISOString(), '2026-09-21T00:00:00.000Z');
assert.equal(parseBookingDateOnly('2026-2-21'), null);
assert.equal(parseBookingDateOnly('2026-02-30'), null);
assert.equal(parseBookingDateOnly('2026-13-01'), null);
assert.equal(parseBookingDateOnly(new Date('2026-09-21')), null);

const nowBeforeCasablancaMidnight = new Date('2026-09-20T23:30:00.000Z');
assert.equal(isBookingDateInPast(requestedDate, nowBeforeCasablancaMidnight), false, 'Casablanca today is allowed across UTC midnight');
assert.equal(isBookingDateInPast(parseBookingDateOnly('2026-09-20')!, nowBeforeCasablancaMidnight), true, 'yesterday in Casablanca is rejected');
assert.equal(isBookingDateTodayOrLater('2026-09-21', nowBeforeCasablancaMidnight), true, 'today stays upcoming before UTC midnight');
assert.equal(isBookingDateTodayOrLater('2026-09-20', nowBeforeCasablancaMidnight), false, 'yesterday is not upcoming before UTC midnight');
assert.equal(formatBookingDateOnly(requestedDate), 'Monday, September 21, 2026');
assert.equal(getBookingCalendarDayDistance('2026-09-21', nowBeforeCasablancaMidnight), 0, 'same Casablanca calendar date is Today');
assert.equal(getBookingCalendarDayDistance('2026-09-22', nowBeforeCasablancaMidnight), 1, 'next Casablanca calendar date is Tomorrow');
assert.equal(getBookingCalendarDayDistance('2026-09-23', nowBeforeCasablancaMidnight), 2, 'two calendar days ahead has no fabricated hour value');
assert.equal(getBookingCalendarDayDistance('2026-09-24', nowBeforeCasablancaMidnight), 3, 'later dates remain Future');
assert.equal(getBookingCalendarDayDistance('2026-09-20', nowBeforeCasablancaMidnight), -1, 'past dates remain distinguishable');
assert.equal(getBookingCalendarDayDistance('2026-02-30', nowBeforeCasablancaMidnight), null, 'invalid dates do not become a reminder urgency');
assert.equal(getBookingCalendarDayLabel('2026-09-21', nowBeforeCasablancaMidnight), 'Today');
assert.equal(getBookingCalendarDayLabel('2026-09-22', nowBeforeCasablancaMidnight), 'Tomorrow');
assert.equal(getBookingCalendarDayLabel('2026-09-23', nowBeforeCasablancaMidnight), 'Within 2 days');
assert.equal(getBookingCalendarDayLabel('2026-09-24', nowBeforeCasablancaMidnight), 'Future');

assert.match(bookingRoute, /getBookingsForActivityOnDate\(activityId,\s*requestedDate\)/, 'capacity lookup receives the normalized date');
assert.match(storageSource, /startOfDayUTC\s*=\s*new Date\(Date\.UTC\([\s\S]*?date\.getUTCFullYear\(\)/);
assert.match(storageSource, /preferredDate:\s*\{\s*\$gte:\s*startOfDayUTC,\s*\$lte:\s*endOfDayUTC\s*\}/, 'capacity lookup remains bounded to the exact UTC calendar day');

const bookingData = bookingRoute.match(/const bookingData:\s*Record<string,\s*any>\s*=\s*\{([\s\S]*?)\n\s*\};/)?.[1];
assert.ok(bookingData, 'public booking state object remains explicit');
assert.match(bookingData, /status:\s*'PENDING'/);
assert.match(bookingData, /paymentStatus:\s*'unpaid'/);
assert.match(bookingData, /paidAmount:\s*0/);
assert.match(bookingRoute, /status:\s*'PENDING',[\s\S]*?paymentStatus:\s*'unpaid'/, 'booking and payment state initialize independently');
const statusHandler = adminRoutes.match(/router\.patch\('\/bookings\/:id\/status',[\s\S]*?\n\}\);/)?.[0];
assert.ok(statusHandler, 'admin booking-status handler remains present');
const statusStorageUpdate = statusHandler.match(/storage\.updateBookingStatus\([^)]*\)/)?.[0];
assert.equal(statusStorageUpdate, 'storage.updateBookingStatus(id, normalizedStatus)');
assert.doesNotMatch(statusHandler, /updateBookingPayment/);
const paymentHandler = adminRoutes.match(/const handleBookingPayment = async[\s\S]*?^\};/m)?.[0];
assert.ok(paymentHandler, 'admin payment handler remains present');
assert.match(paymentHandler, /storage\.updateBookingPayment/);
assert.doesNotMatch(paymentHandler, /updateBookingStatus|status:\s*['"](?:PENDING|CONFIRMED|COMPLETED|CANCELLED)['"]/);
const cashReminderSource = readFileSync(new URL('../client/src/components/cash-booking-reminders.tsx', import.meta.url), 'utf8');
assert.match(cashReminderSource, /daysUntil\s*>=\s*0\s*&&\s*daysUntil\s*<=\s*2/, 'cash reminder window uses calendar dates');
assert.match(cashReminderSource, /getBookingCalendarDayLabel\(booking\.preferredDate\)/);
assert.doesNotMatch(cashReminderSource, /hoursUntil|Within 2 hours|Within 24 hours|Within 48 hours/);
const activePublicCopy = [
  readFileSync(new URL('../client/src/pages/activity-detail.tsx', import.meta.url), 'utf8'),
  readFileSync(new URL('../client/src/locales/en.json', import.meta.url), 'utf8'),
  readFileSync(new URL('../client/src/locales/fr.json', import.meta.url), 'utf8'),
].join('\n');
assert.doesNotMatch(activePublicCopy, /Instant Booking|Instant Confirmation|confirmation immédiatement|Réservation instantanée|Confirm & Pay|Booking confirmed!/i);

console.log('Phase 4.1 booking date harness passed.');
