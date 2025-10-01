import type { CancellationReason } from "marrakechdunes-shared/schema";

export interface CancellationPolicy {
  refundPercentage: number;
  fee: number;
  description: string;
}

export function calculateCancellationPolicy(
  bookingDate: Date,
  cancellationDate: Date,
  totalAmount: number,
  reason: CancellationReason
): CancellationPolicy {
  const hoursUntilBooking = (bookingDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
  
  // Free cancellation: 24+ hours before
  if (hoursUntilBooking >= 24) {
    return {
      refundPercentage: 100,
      fee: 0,
      description: 'Free cancellation (24+ hours notice)'
    };
  }
  
  // Partial refund: 12-24 hours before
  if (hoursUntilBooking >= 12) {
    return {
      refundPercentage: 75,
      fee: totalAmount * 0.25,
      description: '75% refund (12-24 hours notice)'
    };
  }
  
  // No refund: Less than 12 hours before
  if (hoursUntilBooking >= 6) {
    return {
      refundPercentage: 0,
      fee: totalAmount,
      description: 'No refund (less than 12 hours notice)'
    };
  }
  
  // Emergency cases - special handling
  if (reason === 'EMERGENCY' || reason === 'HEALTH') {
    return {
      refundPercentage: 50,
      fee: totalAmount * 0.5,
      description: '50% refund (emergency/health reasons)'
    };
  }
  
  // Default: No refund
  return {
    refundPercentage: 0,
    fee: totalAmount,
    description: 'No refund (less than 6 hours notice)'
  };
}

export function getCancellationReasonDisplay(reason: CancellationReason): string {
  const displayNames: Record<CancellationReason, string> = {
    WEATHER: 'Weather Conditions',
    EMERGENCY: 'Personal Emergency',
    TRAVEL: 'Travel Changes',
    HEALTH: 'Health Issues',
    OTHER: 'Other'
  };
  
  return displayNames[reason];
}
