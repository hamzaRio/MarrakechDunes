declare module "@shared/schema.js" {
  export interface UserType { [key: string]: any }
  export interface ActivityType { [key: string]: any }
  export interface BookingType { [key: string]: any }
  export interface AuditLogType { [key: string]: any }
  export interface ReviewType { [key: string]: any }
  export interface BookingWithActivity extends BookingType { [key: string]: any }
  export interface ReviewWithActivity extends ReviewType { [key: string]: any }
  export const insertUserSchema: any;
  export const insertActivitySchema: any;
  export const insertBookingSchema: any;
  export const insertAuditLogSchema: any;
  export const insertReviewSchema: any;
  export type InsertUser = any;
  export type InsertActivity = any;
  export type InsertBooking = any;
  export type InsertAuditLog = any;
  export type InsertReview = any;
}
