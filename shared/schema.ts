import { z } from 'zod';

// TypeScript interfaces for the application data models
export interface UserType {
  _id: string;
  id?: string;
  username: string;
  password: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityType {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  imageUrls: string[];
  category: string;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  seasonalPricing?: any;
  getyourguidePrice?: number;
  availability?: string;
  duration?: string;
  location?: string;
  maxParticipants?: number;
  difficulty?: string;
  rating?: number;
  // Capacity management
  capacitySettings?: {
    maxParticipants: number;
    weatherDependent: boolean;
    requiresGuide: boolean;
    requiresEquipment: boolean;
    overbookingAllowed: boolean;
    overbookingLimit?: number;
  };
  // Dynamic pricing
  dynamicPricingEnabled?: boolean;
  pricingConfig?: DynamicPricingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingType {
  _id: string;
  id?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  activityId: string;
  numberOfPeople: number;
  preferredDate: Date;
  participantNames?: string[];
  status: BookingStatus;
  totalAmount: string;
  notes?: string;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid';
  paymentMethod?: 'cash' | 'cash_deposit';
  paidAmount: number;
  depositAmount?: number;
  // Group booking fields
  isGroupBooking?: boolean;
  groupCoordinator?: {
    name: string;
    phone: string;
  };
  participants?: Array<{
    name: string;
    phone: string;
  }>;
  groupDiscountPct?: number;
  // Rescheduling fields
  rescheduleCount?: number;
  rescheduleFee?: number;
  originalDate?: Date;
  // Cancellation fields
  cancellationReason?: CancellationReason;
  cancellationDate?: Date;
  refundAmount?: number;
  refundStatus?: 'none' | 'partial' | 'full';
  // Audit trail
  statusHistory?: Array<{
    status: BookingStatus;
    changedBy: string;
    changedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PAID' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type CancellationReason = 
  | 'WEATHER' 
  | 'EMERGENCY' 
  | 'TRAVEL' 
  | 'HEALTH' 
  | 'OTHER';

export interface AuditLogType {
  _id: string;
  id?: string;
  userId: string;
  action: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewType {
  _id: string;
  id?: string;
  customerName: string;
  customerEmail: string;
  activityId: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingWithActivity extends BookingType {
  activity?: ActivityType;
}

export interface ReviewWithActivity extends ReviewType {
  activity?: ActivityType;
}

// New types for enhanced features
export interface PricingQuote {
  basePrice: number;
  seasonalAdjustment: number;
  demandAdjustment: number;
  groupDiscount: number;
  finalPrice: number;
  breakdown: {
    base: number;
    seasonal: number;
    demand: number;
    group: number;
    total: number;
  };
}

export interface WaitlistEntry {
  _id: string;
  bookingId: string;
  activityId: string;
  position: number;
  customerName: string;
  customerPhone: string;
  preferredDate: Date;
  createdAt: Date;
}

export interface PortalSession {
  _id: string;
  phone: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface BusinessIntelligence {
  revenue: {
    daily: number;
    monthly: number;
    seasonal: Array<{ month: string; amount: number }>;
    profitabilityByActivity: Array<{ activityId: string; name: string; revenue: number; profit: number }>;
    guidePerformance: Array<{ guideId: string; name: string; revenue: number; rating: number }>;
  };
  customers: {
    segments: Array<{ segment: string; count: number; percentage: number }>;
    repeatRate: number;
    lifetimeValue: number;
    churnScore: number;
  };
  operations: {
    capacityUtilization: number;
    weatherImpact: Array<{ condition: string; bookings: number; cancellations: number }>;
    cancellationReasons: Array<{ reason: string; count: number; percentage: number }>;
    bookingPatterns: Array<{ hour: number; bookings: number }>;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  timing: 'immediate' | 'scheduled';
}

export interface DynamicPricingConfig {
  seasonal: {
    peak: { months: number[]; adjustment: number };
    shoulder: { months: number[]; adjustment: number };
    low: { months: number[]; adjustment: number };
  };
  demand: {
    high: { threshold: number; adjustment: number };
    medium: { threshold: number; adjustment: number };
    low: { threshold: number; adjustment: number };
  };
  group: {
    small: { min: number; max: number; discount: number };
    medium: { min: number; max: number; discount: number };
    large: { min: number; max: number; discount: number };
  };
}

// Zod validation schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(['admin', 'superadmin']),
});

export const insertActivitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.string().min(1),
  currency: z.string().default('MAD'),
  imageUrls: z.array(z.string().min(1)),
  category: z.string().min(1),
  isActive: z.boolean().default(true),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
  seasonalPricing: z.any().optional(),
  getyourguidePrice: z.number().optional(),
  availability: z.string().optional(),
  duration: z.string().optional(),
});

export const insertBookingSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  activityId: z.string().min(1),
  numberOfPeople: z.number().min(1),
  preferredDate: z.date(),
  participantNames: z.array(z.string()).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('PENDING'),
  totalAmount: z.string().min(1),
  notes: z.string().optional(),
  paymentStatus: z.enum(['unpaid', 'deposit_paid', 'fully_paid']).default('unpaid'),
  paymentMethod: z.enum(['cash', 'cash_deposit']).default('cash'),
  paidAmount: z.number().default(0),
  depositAmount: z.number().optional(),
  // Group booking fields
  isGroupBooking: z.boolean().optional(),
  groupCoordinator: z.object({
    name: z.string(),
    phone: z.string()
  }).optional(),
  participants: z.array(z.object({
    name: z.string(),
    phone: z.string()
  })).optional(),
  groupDiscountPct: z.number().optional(),
  // Rescheduling fields
  rescheduleCount: z.number().default(0),
  rescheduleFee: z.number().optional(),
  originalDate: z.date().optional(),
  // Cancellation fields
  cancellationReason: z.enum(['WEATHER', 'EMERGENCY', 'TRAVEL', 'HEALTH', 'OTHER']).optional(),
  cancellationDate: z.date().optional(),
  refundAmount: z.number().optional(),
  refundStatus: z.enum(['none', 'partial', 'full']).optional(),
  // Audit trail
  statusHistory: z.array(z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    changedBy: z.string(),
    changedAt: z.date(),
    reason: z.string().optional()
  })).optional(),
});

export const insertAuditLogSchema = z.object({
  userId: z.string().min(1),
  action: z.string().min(1),
  details: z.string().optional(),
});

export const insertReviewSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  activityId: z.string().min(1),
  bookingId: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1),
  comment: z.string().min(1),
  verified: z.boolean().default(false),
  approved: z.boolean().default(false),
});

// New validation schemas
export const statusTransitionSchema = z.object({
  from: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  to: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  reason: z.string().optional()
});

export const cancellationSchema = z.object({
  reason: z.enum(['WEATHER', 'EMERGENCY', 'TRAVEL', 'HEALTH', 'OTHER']),
  refundRequested: z.boolean().optional()
});

export const rescheduleSchema = z.object({
  newDate: z.date(),
  reason: z.string().optional()
});

export const pricingQuoteSchema = z.object({
  activityId: z.string(),
  date: z.date(),
  partySize: z.number().min(1)
});

export const portalLoginSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().min(4).max(6)
});

export const otpRequestSchema = z.object({
  phone: z.string().min(1)
});

// Insert types for database operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// New types for validation
export type StatusTransition = z.infer<typeof statusTransitionSchema>;
export type CancellationRequest = z.infer<typeof cancellationSchema>;
export type RescheduleRequest = z.infer<typeof rescheduleSchema>;
export type PricingQuoteRequest = z.infer<typeof pricingQuoteSchema>;
export type PortalLogin = z.infer<typeof portalLoginSchema>;
export type OTPRequest = z.infer<typeof otpRequestSchema>;