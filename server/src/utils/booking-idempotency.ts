import { createHash } from 'crypto';

export function hashIdempotencyKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 11000;
}

export async function resolveIdempotentCreate<T>({
  idempotencyKeyHash,
  findExisting,
  create,
}: {
  idempotencyKeyHash?: string;
  findExisting: (hash: string) => Promise<T | null>;
  create: () => Promise<T>;
}): Promise<{ booking: T; created: boolean }> {
  if (idempotencyKeyHash) {
    const existing = await findExisting(idempotencyKeyHash);
    if (existing) return { booking: existing, created: false };
  }

  try {
    return { booking: await create(), created: true };
  } catch (error) {
    if (idempotencyKeyHash && isDuplicateKeyError(error)) {
      const winner = await findExisting(idempotencyKeyHash);
      if (winner) return { booking: winner, created: false };
    }
    throw error;
  }
}

export function toPublicBookingResult(booking: any) {
  const totalAmount = Number(booking.totalAmount) || 0;
  const paidAmount = Number(booking.paidAmount) || 0;
  const depositAmount = Number(booking.depositAmount) || 0;
  return {
    status: 'success',
    bookingReference: booking.bookingReference,
    bookingStatus: String(booking.status || 'PENDING').toUpperCase(),
    paymentStatus: booking.paymentStatus || 'unpaid',
    totalAmount,
    depositAmount,
    remainingAmount: Math.max(0, totalAmount - paidAmount),
  };
}
