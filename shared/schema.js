"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertReviewSchema = exports.insertAuditLogSchema = exports.insertBookingSchema = exports.insertActivitySchema = exports.insertUserSchema = void 0;
const zod_1 = require("zod");
// Zod validation schemas
exports.insertUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
    role: zod_1.z.enum(['admin', 'superadmin']),
});
exports.insertActivitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    price: zod_1.z.string().min(1),
    currency: zod_1.z.string().default('MAD'),
    image: zod_1.z.string().min(1),
    photos: zod_1.z.array(zod_1.z.string()).optional(),
    category: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().default(true),
    seasonalPricing: zod_1.z.any().optional(),
    getyourguidePrice: zod_1.z.number().optional(),
    availability: zod_1.z.string().optional(),
});
exports.insertBookingSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1),
    customerPhone: zod_1.z.string().min(1),
    activityId: zod_1.z.string().min(1),
    numberOfPeople: zod_1.z.number().min(1),
    preferredDate: zod_1.z.date(),
    participantNames: zod_1.z.array(zod_1.z.string()).optional(),
    status: zod_1.z.string().default('pending'),
    totalAmount: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional(),
    paymentStatus: zod_1.z.enum(['unpaid', 'deposit_paid', 'fully_paid']).default('unpaid'),
    paymentMethod: zod_1.z.enum(['cash', 'cash_deposit']).optional(),
    paidAmount: zod_1.z.number().default(0),
    depositAmount: zod_1.z.number().optional(),
});
exports.insertAuditLogSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    action: zod_1.z.string().min(1),
    details: zod_1.z.string().optional(),
});
exports.insertReviewSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1),
    customerEmail: zod_1.z.string().email(),
    activityId: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(1).max(5),
    title: zod_1.z.string().min(1),
    comment: zod_1.z.string().min(1),
    verified: zod_1.z.boolean().default(false),
    approved: zod_1.z.boolean().default(false),
});
