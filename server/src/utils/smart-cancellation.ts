import type { BookingType } from "marrakechdunes-shared/schema";

export interface CancellationRequest {
  bookingId: string;
  reason: CancellationReason;
  customerRequested?: boolean;
  notes?: string;
}

export interface CancellationResult {
  success: boolean;
  refundAmount: number;
  refundPercentage: number;
  processingFee: number;
  netRefund: number;
  deadline: Date;
  warnings: string[];
  errors: string[];
}

export enum CancellationReason {
  WEATHER = 'weather',
  EMERGENCY = 'emergency',
  TRAVEL = 'travel',
  HEALTH = 'health',
  OTHER = 'other'
}

export interface RefundPolicy {
  timeframes: {
    hours: number;
    refundPercentage: number;
    processingFee: number;
  }[];
  emergencyRefund: {
    refundPercentage: number;
    processingFee: number;
  };
  weatherRefund: {
    refundPercentage: number;
    processingFee: number;
  };
}

const DEFAULT_REFUND_POLICY: RefundPolicy = {
  timeframes: [
    { hours: 24, refundPercentage: 100, processingFee: 0 },    // 24+ hours: 100% refund
    { hours: 12, refundPercentage: 50, processingFee: 25 },   // 12-24 hours: 50% refund
    { hours: 6, refundPercentage: 25, processingFee: 50 },    // 6-12 hours: 25% refund
    { hours: 0, refundPercentage: 0, processingFee: 0 }        // <6 hours: No refund
  ],
  emergencyRefund: {
    refundPercentage: 100,
    processingFee: 0
  },
  weatherRefund: {
    refundPercentage: 100,
    processingFee: 0
  }
};

export class SmartCancellationSystem {
  private policy: RefundPolicy;

  constructor(policy?: Partial<RefundPolicy>) {
    this.policy = { ...DEFAULT_REFUND_POLICY, ...policy };
  }

  /**
   * Calculate refund for a cancellation request
   */
  public calculateRefund(
    booking: BookingType, 
    request: CancellationRequest
  ): CancellationResult {
    const result: CancellationResult = {
      success: false,
      refundAmount: 0,
      refundPercentage: 0,
      processingFee: 0,
      netRefund: 0,
      deadline: new Date(),
      warnings: [],
      errors: []
    };

    // Validate booking
    if (!booking || booking.status === 'CANCELLED') {
      result.errors.push('Booking not found or already cancelled');
      return result;
    }

    const totalAmount = Number(booking.totalAmount) || 0;
    const paidAmount = Number(booking.paidAmount) || 0;
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Handle emergency and weather cancellations
    if (request.reason === CancellationReason.EMERGENCY) {
      result.refundPercentage = this.policy.emergencyRefund.refundPercentage;
      result.processingFee = this.policy.emergencyRefund.processingFee;
      result.warnings.push('Emergency cancellation - full refund granted');
    } else if (request.reason === CancellationReason.WEATHER) {
      result.refundPercentage = this.policy.weatherRefund.refundPercentage;
      result.processingFee = this.policy.weatherRefund.processingFee;
      result.warnings.push('Weather cancellation - full refund granted');
    } else {
      // Apply standard refund policy based on time
      const applicablePolicy = this.policy.timeframes.find(
        timeframe => hoursUntil >= timeframe.hours
      ) || this.policy.timeframes[this.policy.timeframes.length - 1];

      result.refundPercentage = applicablePolicy.refundPercentage;
      result.processingFee = applicablePolicy.processingFee;
    }

    // Calculate refund amounts
    result.refundAmount = Math.round((paidAmount * result.refundPercentage) / 100);
    result.netRefund = Math.max(0, result.refundAmount - result.processingFee);
    result.deadline = new Date(bookingDate.getTime() - (24 * 60 * 60 * 1000)); // 24h before booking
    result.success = true;

    // Add warnings for low refunds
    if (result.refundPercentage < 50) {
      result.warnings.push(`Low refund due to late cancellation (${result.refundPercentage}%)`);
    }

    if (result.processingFee > 0) {
      result.warnings.push(`Processing fee: ${result.processingFee} MAD`);
    }

    return result;
  }

  /**
   * Process a cancellation request
   */
  public async processCancellation(
    booking: BookingType,
    request: CancellationRequest
  ): Promise<CancellationResult> {
    const refund = this.calculateRefund(booking, request);
    
    if (!refund.success) {
      return refund;
    }

    // Additional validations
    if (refund.netRefund < 0) {
      refund.errors.push('Refund amount cannot be negative');
      refund.success = false;
      return refund;
    }

    // Check if cancellation is too late
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) {
      refund.errors.push('Cannot cancel past bookings');
      refund.success = false;
      return refund;
    }

    return refund;
  }

  /**
   * Get cancellation deadline for a booking
   */
  public getCancellationDeadline(booking: BookingType): Date {
    const bookingDate = new Date(booking.preferredDate);
    return new Date(bookingDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before
  }

  /**
   * Check if cancellation deadline has passed
   */
  public isCancellationDeadlinePassed(booking: BookingType): boolean {
    const deadline = this.getCancellationDeadline(booking);
    return new Date() > deadline;
  }

  /**
   * Get refund estimate without processing cancellation
   */
  public getRefundEstimate(booking: BookingType, reason: CancellationReason): {
    refundPercentage: number;
    estimatedRefund: number;
    processingFee: number;
    netRefund: number;
  } {
    const totalAmount = Number(booking.totalAmount) || 0;
    const paidAmount = Number(booking.paidAmount) || 0;
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let processingFee = 0;

    if (reason === CancellationReason.EMERGENCY) {
      refundPercentage = this.policy.emergencyRefund.refundPercentage;
      processingFee = this.policy.emergencyRefund.processingFee;
    } else if (reason === CancellationReason.WEATHER) {
      refundPercentage = this.policy.weatherRefund.refundPercentage;
      processingFee = this.policy.weatherRefund.processingFee;
    } else {
      const applicablePolicy = this.policy.timeframes.find(
        timeframe => hoursUntil >= timeframe.hours
      ) || this.policy.timeframes[this.policy.timeframes.length - 1];

      refundPercentage = applicablePolicy.refundPercentage;
      processingFee = applicablePolicy.processingFee;
    }

    const estimatedRefund = Math.round((paidAmount * refundPercentage) / 100);
    const netRefund = Math.max(0, estimatedRefund - processingFee);

    return {
      refundPercentage,
      estimatedRefund,
      processingFee,
      netRefund
    };
  }

  /**
   * Update refund policy
   */
  public updatePolicy(newPolicy: Partial<RefundPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Get current policy
   */
  public getPolicy(): RefundPolicy {
    return { ...this.policy };
  }

  /**
   * Get cancellation reasons with descriptions
   */
  public getCancellationReasons(): Array<{ value: CancellationReason; label: string; description: string }> {
    return [
      {
        value: CancellationReason.WEATHER,
        label: 'Weather',
        description: 'Weather conditions make the activity unsafe or impossible'
      },
      {
        value: CancellationReason.EMERGENCY,
        label: 'Emergency',
        description: 'Personal or family emergency'
      },
      {
        value: CancellationReason.TRAVEL,
        label: 'Travel Issues',
        description: 'Flight delays, transportation problems'
      },
      {
        value: CancellationReason.HEALTH,
        label: 'Health',
        description: 'Illness or health-related issues'
      },
      {
        value: CancellationReason.OTHER,
        label: 'Other',
        description: 'Other reasons not listed above'
      }
    ];
  }
}

// Export singleton instance
export const smartCancellationSystem = new SmartCancellationSystem();
