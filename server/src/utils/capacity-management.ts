import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

export interface CapacityStatus {
  currentBookings: number;
  maxCapacity: number;
  availableSpots: number;
  isFull: boolean;
  waitlistCount: number;
  overbookingAllowed: boolean;
  overbookingLimit: number;
  weatherDependent: boolean;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  activityId: string;
  preferredDate: Date;
  participants: number;
  priority: number;
  createdAt: Date;
  notified: boolean;
}

export interface CapacityResult {
  success: boolean;
  canBook: boolean;
  availableSpots: number;
  waitlistRequired: boolean;
  overbookingAllowed: boolean;
  warnings: string[];
  errors: string[];
}

export interface CapacityPolicy {
  maxOverbooking: number; // Percentage of max capacity
  waitlistEnabled: boolean;
  autoPromotion: boolean;
  weatherDependency: boolean;
  advanceBookingLimit: number; // Days in advance
}

const DEFAULT_CAPACITY_POLICY: CapacityPolicy = {
  maxOverbooking: 10, // 10% overbooking allowed
  waitlistEnabled: true,
  autoPromotion: true,
  weatherDependency: true,
  advanceBookingLimit: 90 // 90 days in advance
};

export class CapacityManagementSystem {
  private policy: CapacityPolicy;
  private waitlist: Map<string, WaitlistEntry[]> = new Map();

  constructor(policy?: Partial<CapacityPolicy>) {
    this.policy = { ...DEFAULT_CAPACITY_POLICY, ...policy };
  }

  /**
   * Check capacity for a booking request
   */
  public checkCapacity(
    activity: ActivityType,
    requestedDate: Date,
    participants: number,
    existingBookings: BookingType[]
  ): CapacityResult {
    const result: CapacityResult = {
      success: false,
      canBook: false,
      availableSpots: 0,
      waitlistRequired: false,
      overbookingAllowed: false,
      warnings: [],
      errors: []
    };

    // Validate activity
    if (!activity) {
      result.errors.push('Activity not found');
      return result;
    }

    const maxCapacity = activity.maxParticipants || 20;
    const weatherDependent = (activity as any).weatherDependent || false;

    // Calculate current bookings for the date
    const dateBookings = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.preferredDate);
      return bookingDate.toDateString() === requestedDate.toDateString() &&
             booking.status !== 'CANCELLED';
    });

    const currentBookings = dateBookings.reduce((sum, booking) => sum + (booking.numberOfPeople || 1), 0);
    const availableSpots = maxCapacity - currentBookings;

    result.availableSpots = Math.max(0, availableSpots);

    // Check if booking is possible
    if (participants <= availableSpots) {
      result.canBook = true;
      result.success = true;
      return result;
    }

    // Check overbooking policy
    const overbookingLimit = Math.round(maxCapacity * (this.policy.maxOverbooking / 100));
    const totalAfterBooking = currentBookings + participants;
    const overbookingSpots = maxCapacity + overbookingLimit;

    if (totalAfterBooking <= overbookingSpots) {
      result.canBook = true;
      result.overbookingAllowed = true;
      result.warnings.push(`Overbooking: ${totalAfterBooking - maxCapacity} spots over capacity`);
      result.success = true;
      return result;
    }

    // Check waitlist
    if (this.policy.waitlistEnabled) {
      result.waitlistRequired = true;
      result.warnings.push('Activity is full - you will be added to waitlist');
      result.success = true;
      return result;
    }

    result.errors.push('Activity is full and waitlist is not available');
    return result;
  }

  /**
   * Add to waitlist
   */
  public addToWaitlist(
    activityId: string,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    preferredDate: Date,
    participants: number
  ): WaitlistEntry {
    const waitlistEntry: WaitlistEntry = {
      id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerName,
      customerPhone,
      customerEmail,
      activityId,
      preferredDate,
      participants,
      priority: this.calculatePriority(preferredDate),
      createdAt: new Date(),
      notified: false
    };

    if (!this.waitlist.has(activityId)) {
      this.waitlist.set(activityId, []);
    }

    const activityWaitlist = this.waitlist.get(activityId)!;
    activityWaitlist.push(waitlistEntry);
    
    // Sort by priority (higher priority first)
    activityWaitlist.sort((a, b) => b.priority - a.priority);

    return waitlistEntry;
  }

  /**
   * Process waitlist when spots become available
   */
  public async processWaitlist(
    activityId: string,
    availableSpots: number,
    date: Date
  ): Promise<WaitlistEntry[]> {
    const activityWaitlist = this.waitlist.get(activityId) || [];
    const eligibleEntries = activityWaitlist.filter(entry => {
      const entryDate = new Date(entry.preferredDate);
      return entryDate.toDateString() === date.toDateString() && !entry.notified;
    });

    const promotedEntries: WaitlistEntry[] = [];
    let remainingSpots = availableSpots;

    for (const entry of eligibleEntries) {
      if (remainingSpots >= entry.participants) {
        entry.notified = true;
        promotedEntries.push(entry);
        remainingSpots -= entry.participants;
      } else {
        break;
      }
    }

    return promotedEntries;
  }

  /**
   * Get waitlist for an activity
   */
  public getWaitlist(activityId: string): WaitlistEntry[] {
    return this.waitlist.get(activityId) || [];
  }

  /**
   * Remove from waitlist
   */
  public removeFromWaitlist(activityId: string, entryId: string): boolean {
    const activityWaitlist = this.waitlist.get(activityId);
    if (!activityWaitlist) return false;

    const index = activityWaitlist.findIndex(entry => entry.id === entryId);
    if (index === -1) return false;

    activityWaitlist.splice(index, 1);
    return true;
  }

  /**
   * Get capacity status for an activity
   */
  public getCapacityStatus(
    activity: ActivityType,
    date: Date,
    existingBookings: BookingType[]
  ): CapacityStatus {
    const maxCapacity = activity.maxParticipants || 20;
    const dateBookings = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.preferredDate);
      return bookingDate.toDateString() === date.toDateString() &&
             booking.status !== 'CANCELLED';
    });

    const currentBookings = dateBookings.reduce((sum, booking) => sum + (booking.numberOfPeople || 1), 0);
    const availableSpots = Math.max(0, maxCapacity - currentBookings);
    const waitlist = this.getWaitlist(activity._id || activity.id || '');
    const waitlistCount = waitlist.filter(entry => {
      const entryDate = new Date(entry.preferredDate);
      return entryDate.toDateString() === date.toDateString();
    }).length;

    return {
      currentBookings,
      maxCapacity,
      availableSpots,
      isFull: availableSpots === 0,
      waitlistCount,
      overbookingAllowed: this.policy.maxOverbooking > 0,
      overbookingLimit: Math.round(maxCapacity * (this.policy.maxOverbooking / 100)),
      weatherDependent: (activity as any).weatherDependent || false
    };
  }

  /**
   * Check if activity is weather dependent
   */
  public isWeatherDependent(activity: ActivityType): boolean {
    return (activity as any).weatherDependent || false;
  }

  /**
   * Calculate priority for waitlist entry
   */
  private calculatePriority(preferredDate: Date): number {
    const now = new Date();
    const daysUntil = (preferredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    // Higher priority for dates further in the future
    return Math.max(0, daysUntil);
  }

  /**
   * Update capacity policy
   */
  public updatePolicy(newPolicy: Partial<CapacityPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Get current policy
   */
  public getPolicy(): CapacityPolicy {
    return { ...this.policy };
  }

  /**
   * Clear waitlist for an activity
   */
  public clearWaitlist(activityId: string): void {
    this.waitlist.delete(activityId);
  }

  /**
   * Get all waitlists
   */
  public getAllWaitlists(): Map<string, WaitlistEntry[]> {
    return new Map(this.waitlist);
  }
}

// Export singleton instance
export const capacityManagementSystem = new CapacityManagementSystem();
