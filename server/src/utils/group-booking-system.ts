import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

export interface GroupBookingRequest {
  activityId: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  participants: GroupParticipant[];
  preferredDate: Date;
  notes?: string;
}

export interface GroupParticipant {
  name: string;
  phone?: string;
  email?: string;
  specialRequirements?: string;
}

export interface GroupDiscount {
  minParticipants: number;
  maxParticipants: number;
  discountPercentage: number;
  description: string;
}

export interface GroupBookingResult {
  success: boolean;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  coordinatorInfo: {
    name: string;
    phone: string;
    email: string;
  };
  participants: GroupParticipant[];
  warnings: string[];
  errors: string[];
}

const DEFAULT_GROUP_DISCOUNTS: GroupDiscount[] = [
  {
    minParticipants: 2,
    maxParticipants: 4,
    discountPercentage: 5,
    description: 'Small group (2-4 people): 5% discount'
  },
  {
    minParticipants: 5,
    maxParticipants: 8,
    discountPercentage: 10,
    description: 'Medium group (5-8 people): 10% discount'
  },
  {
    minParticipants: 9,
    maxParticipants: 15,
    discountPercentage: 15,
    description: 'Large group (9-15 people): 15% discount'
  },
  {
    minParticipants: 16,
    maxParticipants: 999,
    discountPercentage: 20,
    description: 'Very large group (16+ people): 20% discount'
  }
];

export class GroupBookingSystem {
  private discounts: GroupDiscount[];

  constructor(customDiscounts?: GroupDiscount[]) {
    this.discounts = customDiscounts || DEFAULT_GROUP_DISCOUNTS;
  }

  /**
   * Calculate group booking pricing
   */
  public calculateGroupBooking(
    activity: ActivityType,
    request: GroupBookingRequest
  ): GroupBookingResult {
    const result: GroupBookingResult = {
      success: false,
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discountPercentage: 0,
      coordinatorInfo: {
        name: request.coordinatorName,
        phone: request.coordinatorPhone,
        email: request.coordinatorEmail
      },
      participants: request.participants,
      warnings: [],
      errors: []
    };

    // Validate inputs
    if (!activity) {
      result.errors.push('Activity not found');
      return result;
    }

    if (request.participants.length < 2) {
      result.errors.push('Group booking requires at least 2 participants');
      return result;
    }

    if (request.participants.length > (activity.maxParticipants || 20)) {
      result.errors.push(`Group size exceeds activity capacity (max: ${activity.maxParticipants || 20})`);
      return result;
    }

    // Calculate base pricing
    const basePrice = Number(activity.price) || 0;
    const participantCount = request.participants.length;
    result.totalAmount = basePrice * participantCount;

    // Find applicable discount
    const applicableDiscount = this.discounts.find(
      discount => participantCount >= discount.minParticipants && 
                 participantCount <= discount.maxParticipants
    );

    if (applicableDiscount) {
      result.discountPercentage = applicableDiscount.discountPercentage;
      result.discountAmount = Math.round((result.totalAmount * result.discountPercentage) / 100);
      result.finalAmount = result.totalAmount - result.discountAmount;
      result.warnings.push(applicableDiscount.description);
    } else {
      result.finalAmount = result.totalAmount;
      result.warnings.push('No group discount applicable');
    }

    // Add coordinator benefits
    result.warnings.push('Coordinator receives priority support and updates');
    result.warnings.push('Group bookings include dedicated WhatsApp group');

    result.success = true;
    return result;
  }

  /**
   * Create a group booking
   */
  public async createGroupBooking(
    activity: ActivityType,
    request: GroupBookingRequest
  ): Promise<GroupBookingResult> {
    const calculation = this.calculateGroupBooking(activity, request);
    
    if (!calculation.success) {
      return calculation;
    }

    // Additional validations for group bookings
    if (request.participants.length > 20) {
      calculation.warnings.push('Large group - may require special arrangements');
    }

    // Check for special requirements
    const hasSpecialRequirements = request.participants.some(
      p => p.specialRequirements && p.specialRequirements.trim().length > 0
    );

    if (hasSpecialRequirements) {
      calculation.warnings.push('Special requirements noted - will be communicated to guide');
    }

    return calculation;
  }

  /**
   * Get available group discounts
   */
  public getAvailableDiscounts(): GroupDiscount[] {
    return [...this.discounts];
  }

  /**
   * Get discount for specific group size
   */
  public getDiscountForGroupSize(participantCount: number): GroupDiscount | null {
    return this.discounts.find(
      discount => participantCount >= discount.minParticipants && 
                 participantCount <= discount.maxParticipants
    ) || null;
  }

  /**
   * Validate group booking request
   */
  public validateGroupBookingRequest(request: GroupBookingRequest): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate coordinator info
    if (!request.coordinatorName || request.coordinatorName.trim().length < 2) {
      errors.push('Coordinator name is required (minimum 2 characters)');
    }

    if (!request.coordinatorPhone || request.coordinatorPhone.trim().length < 10) {
      errors.push('Valid coordinator phone number is required');
    }

    if (!request.coordinatorEmail || !request.coordinatorEmail.includes('@')) {
      errors.push('Valid coordinator email is required');
    }

    // Validate participants
    if (!request.participants || request.participants.length < 2) {
      errors.push('At least 2 participants are required for group booking');
    }

    if (request.participants.length > 50) {
      errors.push('Maximum 50 participants allowed per group booking');
    }

    // Validate participant names
    request.participants.forEach((participant, index) => {
      if (!participant.name || participant.name.trim().length < 2) {
        errors.push(`Participant ${index + 1}: Name is required (minimum 2 characters)`);
      }
    });

    // Check for duplicate names
    const names = request.participants.map(p => p.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      warnings.push('Duplicate participant names detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate group booking summary
   */
  public generateGroupSummary(booking: GroupBookingResult): string {
    const lines = [
      `Group Booking Summary`,
      `====================`,
      `Coordinator: ${booking.coordinatorInfo.name}`,
      `Phone: ${booking.coordinatorInfo.phone}`,
      `Email: ${booking.coordinatorInfo.email}`,
      `Participants: ${booking.participants.length}`,
      `Total Amount: ${booking.totalAmount} MAD`,
      `Discount: ${booking.discountPercentage}% (${booking.discountAmount} MAD)`,
      `Final Amount: ${booking.finalAmount} MAD`,
      ``,
      `Participants:`,
      ...booking.participants.map((p, i) => `${i + 1}. ${p.name}${p.specialRequirements ? ` (${p.specialRequirements})` : ''}`)
    ];

    return lines.join('\n');
  }

  /**
   * Update group discounts
   */
  public updateDiscounts(newDiscounts: GroupDiscount[]): void {
    this.discounts = [...newDiscounts];
  }

  /**
   * Get current discounts
   */
  public getDiscounts(): GroupDiscount[] {
    return [...this.discounts];
  }
}

// Export singleton instance
export const groupBookingSystem = new GroupBookingSystem();
