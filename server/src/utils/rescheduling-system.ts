import type { BookingType } from "marrakechdunes-shared/schema";

export interface RescheduleRequest {
  bookingId: string;
  newDate: Date;
  reason?: string;
  customerRequested?: boolean;
}

export interface RescheduleResult {
  success: boolean;
  newDate: Date;
  fee: number;
  deadline: Date;
  warnings: string[];
  errors: string[];
}

export interface ReschedulePolicy {
  maxReschedules: number;
  deadlineHours: number;
  feeAmount: number;
  feeCurrency: string;
  allowedReasons: string[];
}

const DEFAULT_POLICY: ReschedulePolicy = {
  maxReschedules: 2,
  deadlineHours: 48, // 48 hours minimum notice
  feeAmount: 50,
  feeCurrency: 'MAD',
  allowedReasons: ['weather', 'emergency', 'travel', 'health', 'other']
};

export class ReschedulingSystem {
  private policy: ReschedulePolicy;

  constructor(policy?: Partial<ReschedulePolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  /**
   * Validate if a booking can be rescheduled
   */
  public canReschedule(booking: BookingType): RescheduleResult {
    const result: RescheduleResult = {
      success: false,
      newDate: new Date(),
      fee: 0,
      deadline: new Date(),
      warnings: [],
      errors: []
    };

    // Check if booking exists and is active
    if (!booking || booking.status === 'CANCELLED') {
      result.errors.push('Booking not found or already cancelled');
      return result;
    }

    // Check reschedule count
    const rescheduleCount = booking.rescheduleCount || 0;
    if (rescheduleCount >= this.policy.maxReschedules) {
      result.errors.push(`Maximum reschedules exceeded (${this.policy.maxReschedules})`);
      return result;
    }

    // Check if booking is too close to start time
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < this.policy.deadlineHours) {
      result.errors.push(`Rescheduling requires ${this.policy.deadlineHours} hours notice`);
      return result;
    }

    // Calculate fee
    result.fee = this.calculateRescheduleFee(booking, rescheduleCount);
    result.deadline = new Date(bookingDate.getTime() - (this.policy.deadlineHours * 60 * 60 * 1000));
    result.success = true;

    return result;
  }

  /**
   * Process a reschedule request
   */
  public async processReschedule(
    booking: BookingType, 
    request: RescheduleRequest
  ): Promise<RescheduleResult> {
    const validation = this.canReschedule(booking);
    
    if (!validation.success) {
      return validation;
    }

    // Validate new date
    const newDate = new Date(request.newDate);
    const now = new Date();
    const hoursUntilNew = (newDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilNew < this.policy.deadlineHours) {
      validation.errors.push(`New date must be at least ${this.policy.deadlineHours} hours in the future`);
      validation.success = false;
      return validation;
    }

    // Check for double booking (simplified - would need database check in real implementation)
    validation.warnings.push('Double-booking check required');

    // Calculate final fee
    validation.fee = this.calculateRescheduleFee(booking, booking.rescheduleCount || 0);
    validation.newDate = newDate;

    return validation;
  }

  /**
   * Calculate reschedule fee based on booking and attempt count
   */
  private calculateRescheduleFee(booking: BookingType, attemptCount: number): number {
    // Base fee
    let fee = this.policy.feeAmount;

    // Increase fee for multiple reschedules
    if (attemptCount > 0) {
      fee += (attemptCount * 25); // Additional 25 MAD per reschedule
    }

    // Reduce fee for high-value bookings
    const totalAmount = Number(booking.totalAmount) || 0;
    if (totalAmount > 1000) {
      fee = Math.max(fee * 0.5, 25); // 50% discount for high-value bookings
    }

    return fee;
  }

  /**
   * Get reschedule deadline for a booking
   */
  public getRescheduleDeadline(booking: BookingType): Date {
    const bookingDate = new Date(booking.preferredDate);
    return new Date(bookingDate.getTime() - (this.policy.deadlineHours * 60 * 60 * 1000));
  }

  /**
   * Check if reschedule deadline has passed
   */
  public isRescheduleDeadlinePassed(booking: BookingType): boolean {
    const deadline = this.getRescheduleDeadline(booking);
    return new Date() > deadline;
  }

  /**
   * Get available reschedule dates (excluding past dates and too-close dates)
   */
  public getAvailableRescheduleDates(booking: BookingType): Date[] {
    const now = new Date();
    const availableDates: Date[] = [];
    
    // Generate dates for next 90 days
    for (let i = 1; i <= 90; i++) {
      const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntil >= this.policy.deadlineHours) {
        availableDates.push(date);
      }
    }

    return availableDates;
  }

  /**
   * Update policy
   */
  public updatePolicy(newPolicy: Partial<ReschedulePolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Get current policy
   */
  public getPolicy(): ReschedulePolicy {
    return { ...this.policy };
  }
}

// Export singleton instance
export const reschedulingSystem = new ReschedulingSystem();
