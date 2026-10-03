export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type CanonicalBookingStatus = (typeof BOOKING_STATUSES)[number];

export const MAX_OVERRIDE_REASON_LENGTH = 500;

export function normalizeOverrideReason(value: unknown): { valid: true; value: string } | { valid: false } {
  if (typeof value === 'undefined') return { valid: true, value: '' };
  if (typeof value !== 'string') return { valid: false };
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_OVERRIDE_REASON_LENGTH
    ? { valid: true, value: trimmed }
    : { valid: false };
}

export function hasAuthorizedSuperadminOverride(role: unknown, force: unknown, reason: unknown): boolean {
  const normalized = normalizeOverrideReason(reason);
  return role === 'superadmin' && force === true && normalized.valid && normalized.value.length > 0;
}

export class BookingStatusAuditError extends Error {
  constructor(cause: unknown) {
    super('Failed to record booking status override');
    this.cause = cause;
    this.name = 'BookingStatusAuditError';
  }

  cause: unknown;
}

export const ADMIN_ALLOWED_TRANSITIONS: Record<CanonicalBookingStatus, readonly CanonicalBookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function evaluateBookingStatusChange(input: {
  currentStatus: string;
  targetStatus: string;
  role: unknown;
  force?: unknown;
  overrideReason?: unknown;
}): { allowed: true; forced: boolean } | { allowed: false; reason: string } {
  const currentStatus = input.currentStatus.toUpperCase();
  const targetStatus = input.targetStatus.toUpperCase();
  if (!BOOKING_STATUSES.includes(targetStatus as CanonicalBookingStatus)) {
    return { allowed: false, reason: 'Invalid booking status' };
  }
  if (currentStatus === targetStatus) return { allowed: true, forced: false };

  const normalTransitions = ADMIN_ALLOWED_TRANSITIONS[currentStatus as CanonicalBookingStatus] ?? [];
  if (normalTransitions.includes(targetStatus as CanonicalBookingStatus)) {
    return { allowed: true, forced: false };
  }

  const reason = typeof input.overrideReason === 'string' ? input.overrideReason.trim() : '';
  if (input.role === 'superadmin' && input.force === true && reason.length > 0) {
    return { allowed: true, forced: true };
  }
  return { allowed: false, reason: `Cannot change booking from ${currentStatus} to ${targetStatus}.` };
}

/**
 * Keep an authorized override's audit and status mutation in one ordered
 * sequence. An audit failure therefore prevents the booking mutation, while
 * a failed mutation cannot trigger a follow-up notification.
 */
export async function executeBookingStatusMutation<T>(input: {
  requiresAudit: boolean;
  createAudit: () => Promise<void>;
  updateStatus: () => Promise<T | null>;
}): Promise<T | null> {
  if (input.requiresAudit) {
    try {
      await input.createAudit();
    } catch (error) {
      throw new BookingStatusAuditError(error);
    }
  }
  return input.updateStatus();
}
