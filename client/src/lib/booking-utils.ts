import type { BookingStatus, BookingType } from "marrakechdunes-shared/schema";

// Prefer the stored payment state. Amounts are a fallback only for legacy states.
export function getBookingPaymentSummary(booking: Pick<BookingType,
  'totalAmount' | 'paidAmount' | 'depositAmount' | 'paymentStatus' | 'paymentMethod'
>) {
  const amount = (value: unknown): number => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };
  const totalAmount = amount(booking.totalAmount);
  const paidAmount = amount(booking.paidAmount);
  const depositAmount = amount(booking.depositAmount);
  const storedStatus = String(booking.paymentStatus || '').toLowerCase();
  const paymentStatus: BookingType['paymentStatus'] =
    storedStatus === 'unpaid' || storedStatus === 'deposit_paid' || storedStatus === 'fully_paid'
      ? storedStatus
      : paidAmount <= 0 ? 'unpaid' : paidAmount < totalAmount ? 'deposit_paid' : 'fully_paid';
  const storedMethod = String(booking.paymentMethod || '').toLowerCase();
  const paymentMethod = storedMethod === 'cash_deposit' || storedMethod === 'deposit'
    ? 'cash_deposit' : 'cash';

  return {
    totalAmount,
    paidAmount,
    depositAmount,
    remainingAmount: Math.max(0, totalAmount - paidAmount),
    paymentStatus,
    paymentMethod,
    progress: totalAmount > 0 ? Math.min(100, Math.max(0, Math.round(paidAmount / totalAmount * 100))) : 0,
  };
}

export function getBookingDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z)?$/;

function localDateFromParts(year: number, month: number, day: number): Date | null {
  const utcDate = new Date(0);
  utcDate.setUTCFullYear(year, month - 1, day);
  utcDate.setUTCHours(0, 0, 0, 0);
  if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month - 1 || utcDate.getUTCDate() !== day) {
    return null;
  }

  const localDate = new Date(0);
  localDate.setFullYear(year, month - 1, day);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

/** Format a selected local calendar date without converting it through UTC. */
export function formatLocalDateOnly(date: Date): string {
  if (!Number.isFinite(date.getTime())) return '';
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Preserve date-only booking semantics when parsing API values for display. */
export function getBookingDateOnly(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    if (
      value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 &&
      value.getUTCMilliseconds() === 0
    ) {
      return localDateFromParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    }
    return value;
  }

  const match = DATE_ONLY_PATTERN.exec(value);
  if (match) {
    return localDateFromParts(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Return whole calendar days from the current Casablanca date to a booking date. */
export function getBookingCalendarDayDistance(
  value: Date | string | null | undefined,
  now = new Date(),
): number | null {
  const bookingDate = getBookingDateOnly(value);
  if (!bookingDate || !Number.isFinite(now.getTime())) return null;

  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(todayParts.find(part => part.type === type)?.value);
  const today = utcCalendarDay(getPart('year'), getPart('month'), getPart('day'));
  const bookingDay = utcCalendarDay(bookingDate.getFullYear(), bookingDate.getMonth() + 1, bookingDate.getDate());
  return today === null || bookingDay === null ? null : bookingDay - today;
}

export type BookingCalendarDayLabel = 'Past' | 'Today' | 'Tomorrow' | 'Within 2 days' | 'Future' | 'Date unavailable';

export function getBookingCalendarDayLabel(
  value: Date | string | null | undefined,
  now = new Date(),
): BookingCalendarDayLabel {
  const daysUntil = getBookingCalendarDayDistance(value, now);
  if (daysUntil === null) return 'Date unavailable';
  if (daysUntil < 0) return 'Past';
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === 2) return 'Within 2 days';
  return 'Future';
}

function utcCalendarDay(year: number, month: number, day: number): number | null {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime() / 86_400_000;
}

export function normalizeBookingDateOnlyInput(value: unknown): string {
  if (value instanceof Date) return formatLocalDateOnly(value);
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export function isBookingDateTodayOrLater(value: Date | string | null | undefined, now = new Date()): boolean {
  const daysUntil = getBookingCalendarDayDistance(value, now);
  return daysUntil !== null && daysUntil >= 0;
}

// Phase 4 correction pass §3: normalized to the product's canonical
// four-state booking lifecycle (PENDING/CONFIRMED/COMPLETED/CANCELLED),
// matching BookingStatus (narrowed in shared/schema.ts) and the transition
// guard actually enforced server-side in server/src/routes/admin.ts
// (ADMIN_ALLOWED_TRANSITIONS). This previously modeled a broader,
// never-implemented seven-state vocabulary (PAID/IN_PROGRESS/NO_SHOW), which
// meant getNextPossibleStatuses() only ever offered CANCELLED as a next step
// from CONFIRMED (COMPLETED and PAID/IN_PROGRESS were filtered out by
// BOOKING_STATUS_CONTROLS below) - wrong, since confirming and completing a
// booking is a real, everyday admin action. That filter is no longer needed
// now that VALID_TRANSITIONS itself only ever names canonical statuses.
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Final state
  CANCELLED: [], // Final state
};

export function normalizeBookingStatus(status: BookingStatus | string | null | undefined): string {
  return String(status || '').toUpperCase();
}

export function getStatusDisplayName(status: BookingStatus | string): string {
  const displayNames: Record<BookingStatus, string> = {
    PENDING: 'Pending Confirmation',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Tour Completed',
    CANCELLED: 'Cancelled',
  };

  const normalizedStatus = normalizeBookingStatus(status);
  return displayNames[normalizedStatus as BookingStatus] || normalizedStatus;
}

export function getStatusColor(status: BookingStatus | string): string {
  const colors: Record<BookingStatus, string> = {
    PENDING: 'yellow',
    CONFIRMED: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };

  return colors[normalizeBookingStatus(status) as BookingStatus] || 'gray';
}

export function getNextPossibleStatuses(currentStatus: BookingStatus | string): BookingStatus[] {
  const normalizedStatus = normalizeBookingStatus(currentStatus) as BookingStatus;
  return VALID_TRANSITIONS[normalizedStatus] || [];
}

export function isFinalStatus(status: BookingStatus | string): boolean {
  return ['COMPLETED', 'CANCELLED'].includes(normalizeBookingStatus(status));
}

export function validateStatusTransition(
  from: BookingStatus | string,
  to: BookingStatus | string
): { valid: boolean; reason?: string } {
  const normalizedFrom = normalizeBookingStatus(from) as BookingStatus;
  const normalizedTo = normalizeBookingStatus(to) as BookingStatus;
  const allowedTransitions = VALID_TRANSITIONS[normalizedFrom];
  
  if (!allowedTransitions) {
    return { valid: false, reason: `Invalid source status: ${normalizedFrom}` };
  }
  
  if (!allowedTransitions.includes(normalizedTo)) {
    return { valid: false, reason: `Cannot transition from ${normalizedFrom} to ${normalizedTo}` };
  }
  
  return { valid: true };
}
