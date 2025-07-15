import { z } from 'zod';
/* ------------------------ Zod Schemas ------------------------ */
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
    image: z.string().min(1),
    photos: z.array(z.string()).optional(),
    category: z.string().min(1),
    isActive: z.boolean().default(true),
    seasonalPricing: z.any().optional(),
    getyourguidePrice: z.number().optional(),
    availability: z.string().optional(),
});
export const insertBookingSchema = z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    activityId: z.string().min(1),
    numberOfPeople: z.number().min(1),
    preferredDate: z.union([z.date(), z.string()]),
    status: z.string().default('pending'),
    totalAmount: z.string().min(1),
    notes: z.string().optional(),
    paymentStatus: z.enum(['unpaid', 'deposit_paid', 'fully_paid']).default('unpaid'),
    paymentMethod: z.enum(['cash', 'cash_deposit']).optional(),
    paidAmount: z.number().default(0),
    depositAmount: z.number().optional(),
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
