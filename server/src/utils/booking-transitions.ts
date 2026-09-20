import type { BookingStatus } from "marrakechdunes-shared/schema";

// Phase 4 correction pass §3: normalized to the product's canonical
// four-state booking lifecycle (PENDING/CONFIRMED/COMPLETED/CANCELLED).
// This previously modeled a broader, never-implemented seven-state
// vocabulary (PAID/IN_PROGRESS/NO_SHOW) that didn't match BookingStatus
// (also narrowed in shared/schema.ts) or the actual transition guard now
// enforced in server/src/routes/admin.ts. This utility remains unused
// (zero imports anywhere in server/src) - normalized rather than removed,
// since it's harmless dead code and deleting it isn't required to fix the
// vocabulary mismatch. See ADMIN_ALLOWED_TRANSITIONS in admin.ts, which is
// the guard that actually runs in production and matches this exactly.
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Final state
  CANCELLED: [], // Final state
};

export function validateStatusTransition(
  from: BookingStatus,
  to: BookingStatus
): { valid: boolean; reason?: string } {
  const allowedTransitions = VALID_TRANSITIONS[from];

  if (!allowedTransitions) {
    return { valid: false, reason: `Invalid source status: ${from}` };
  }

  if (!allowedTransitions.includes(to)) {
    return { valid: false, reason: `Cannot transition from ${from} to ${to}` };
  }

  return { valid: true };
}

export function getStatusDisplayName(status: BookingStatus): string {
  const displayNames: Record<BookingStatus, string> = {
    PENDING: 'Pending Confirmation',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Tour Completed',
    CANCELLED: 'Cancelled',
  };

  return displayNames[status];
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    PENDING: 'yellow',
    CONFIRMED: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };

  return colors[status];
}

export function isFinalStatus(status: BookingStatus): boolean {
  return ['COMPLETED', 'CANCELLED'].includes(status);
}

export function getNextPossibleStatuses(currentStatus: BookingStatus): BookingStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}
