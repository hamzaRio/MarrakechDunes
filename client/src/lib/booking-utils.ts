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

// Define valid status transitions
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PAID', 'CANCELLED'],
  PAID: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'NO_SHOW'],
  COMPLETED: [], // Final state
  CANCELLED: [], // Final state
  NO_SHOW: [] // Final state
};

const BOOKING_STATUS_CONTROLS: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export function normalizeBookingStatus(status: BookingStatus | string | null | undefined): string {
  return String(status || '').toUpperCase();
}

export function getStatusDisplayName(status: BookingStatus | string): string {
  const displayNames: Record<BookingStatus, string> = {
    PENDING: 'Pending Confirmation',
    CONFIRMED: 'Confirmed',
    PAID: 'Payment Received',
    IN_PROGRESS: 'Tour in Progress',
    COMPLETED: 'Tour Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show'
  };
  
  const normalizedStatus = normalizeBookingStatus(status);
  return displayNames[normalizedStatus as BookingStatus] || normalizedStatus;
}

export function getStatusColor(status: BookingStatus | string): string {
  const colors: Record<BookingStatus, string> = {
    PENDING: 'yellow',
    CONFIRMED: 'blue',
    PAID: 'green',
    IN_PROGRESS: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
    NO_SHOW: 'gray'
  };
  
  return colors[normalizeBookingStatus(status) as BookingStatus] || 'gray';
}

export function getNextPossibleStatuses(currentStatus: BookingStatus | string): BookingStatus[] {
  const normalizedStatus = normalizeBookingStatus(currentStatus) as BookingStatus;
  return (VALID_TRANSITIONS[normalizedStatus] || [])
    .filter((status) => BOOKING_STATUS_CONTROLS.includes(status));
}

export function isFinalStatus(status: BookingStatus | string): boolean {
  return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(normalizeBookingStatus(status));
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
