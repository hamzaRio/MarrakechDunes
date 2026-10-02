export const BOOKING_SORT_FIELDS = new Set([
  'createdAt', 'updatedAt', 'preferredDate', 'status', 'totalAmount', 'customerName'
]);

export function normalizeBookingPagination(options?: {
  page?: number;
  limit?: number;
  sort?: { field: string; order: 1 | -1 };
}) {
  const rawPage = Number(options?.page ?? 1);
  const rawLimit = Number(options?.limit ?? 50);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 50;
  const field = options?.sort?.field && BOOKING_SORT_FIELDS.has(options.sort.field)
    ? options.sort.field
    : 'createdAt';
  const order = options?.sort?.order === 1 ? 1 : -1;
  return { page, limit, sort: { field, order } as { field: string; order: 1 | -1 } };
}

export function parseBookingDateOnly(value: unknown, endOfDay = false): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(
    year, month - 1, day,
    endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0
  ));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function getCasablancaCalendarDate(now: Date, offsetDays: number): Date {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

export interface BookingSummaryInput {
  status?: string;
  totalAmount?: unknown;
  paidAmount?: unknown;
}

export function calculateBookingSummary(bookings: BookingSummaryInput[]) {
  const summary = {
    totalBookings: bookings.length,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    grossBookingValue: 0,
    collectedPayments: 0,
    outstandingAmount: 0,
  };

  for (const booking of bookings) {
    const status = String(booking.status ?? '').toUpperCase();
    const total = Number.isFinite(Number(booking.totalAmount)) ? Number(booking.totalAmount) : 0;
    const paid = Number.isFinite(Number(booking.paidAmount)) ? Number(booking.paidAmount) : 0;
    if (status === 'PENDING') summary.pendingBookings++;
    if (status === 'CONFIRMED') summary.confirmedBookings++;
    if (status === 'COMPLETED') summary.completedBookings++;
    if (status === 'CANCELLED') summary.cancelledBookings++;
    if (status !== 'CANCELLED') {
      summary.grossBookingValue += total;
      summary.outstandingAmount += Math.max(total - paid, 0);
    }
    summary.collectedPayments += paid;
  }
  return summary;
}
