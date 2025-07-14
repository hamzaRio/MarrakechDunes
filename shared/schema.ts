import { z, ZodType } from 'zod';

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
  image: string;
  photos?: string[];
  category: string;
  isActive: boolean;
  seasonalPricing?: any;
  getyourguidePrice?: number;
  availability?: string;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingType {
  _id: string;
  id?: string;
  customerName: string;
  customerPhone: string;
  activityId: string;
  numberOfPeople: number;
  preferredDate: Date;
  status: string;
  totalAmount: string;
  notes?: string;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid';
  paymentMethod?: 'cash' | 'cash_deposit';
  paidAmount: number;
  depositAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  title: string;
  verified: boolean;
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

// Zod validation schemas (with explicit typing)
export const insertUserSchema: ZodType<InsertUser> = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(['admin', 'superadmin']),
});

export const insertActivitySchema: ZodType<InsertActivity> = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.string().min(1),
  currency: z.string().default('MAD'),
  image: z.string().min(1),
  photos: z.array(z.string()).optional(),
  category: z.string().min(1),
  isActive: z.boolean().default(true),
  seasonalPricing: z.any().optional(),
  getyourguidePrice: z.number().optional(),
  availability: z.string().optional(),
});

export const insertBookingSchema: ZodType<InsertBooking> = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  activityId: z.string().min(1),
  numberOfPeople: z.number().min(1),
  preferredDate: z.date(),
  status: z.string().default('pending'),
  totalAmount: z.string().min(1),
  notes: z.string().optional(),
  paymentStatus: z.enum(['unpaid', 'deposit_paid', 'fully_paid']).default('unpaid'),
  paymentMethod: z.enum(['cash', 'cash_deposit']).optional(),
  paidAmount: z.number().default(0),
  depositAmount: z.number().optional(),
});

export const insertAuditLogSchema: ZodType<InsertAuditLog> = z.object({
  userId: z.string().min(1),
  action: z.string().min(1),
  details: z.string().optional(),
});

export const insertReviewSchema: ZodType<InsertReview> = z.object({
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

// Insert types for database operations
export type InsertUser = z.infer<typeof rawUserSchema>;
export type InsertActivity = z.infer<typeof rawActivitySchema>;
export type InsertBooking = z.infer<typeof rawBookingSchema>;
export type InsertAuditLog = z.infer<typeof rawAuditSchema>;
export type InsertReview = z.infer<typeof rawReviewSchema>;

// Internal raw schemas for inference
const rawUserSchema = insertUserSchema;
const rawActivitySchema = insertActivitySchema;
const rawBookingSchema = insertBookingSchema;
const rawAuditSchema = insertAuditLogSchema;
const rawReviewSchema = insertReviewSchema;
