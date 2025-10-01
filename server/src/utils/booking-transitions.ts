import type { BookingStatus } from "marrakechdunes-shared/schema";

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
    PAID: 'Payment Received',
    IN_PROGRESS: 'Tour in Progress',
    COMPLETED: 'Tour Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show'
  };
  
  return displayNames[status];
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    PENDING: 'yellow',
    CONFIRMED: 'blue',
    PAID: 'green',
    IN_PROGRESS: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
    NO_SHOW: 'gray'
  };
  
  return colors[status];
}

export function isFinalStatus(status: BookingStatus): boolean {
  return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);
}

export function getNextPossibleStatuses(currentStatus: BookingStatus): BookingStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}
