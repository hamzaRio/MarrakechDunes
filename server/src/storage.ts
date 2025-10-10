import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { cacheService } from './services/cache-service.js';
import { loggingService } from './services/logging-service.js';
import type {
  UserType,
  ActivityType,
  BookingType,
  AuditLogType,
  ReviewType,
  InsertUser,
  InsertActivity,
  InsertBooking,
  InsertAuditLog,
  InsertReview,
  BookingWithActivity,
  ReviewWithActivity,
} from "marrakechdunes-shared/schema";

// MongoDB connection string - must use DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], required: true },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  currency: { type: String, default: 'MAD' },
  imageUrls: { type: [String], required: true, default: [] },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending'
  },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  approvalHistory: [{
    status: { 
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    approvedBy: String,
    approvedAt: Date,
    reason: String
  }],
  isSeeded: {
    type: Boolean,
    default: false
  },
  seasonalPricing: { type: mongoose.Schema.Types.Mixed },
  getyourguidePrice: { type: Number },
  availability: { type: String },
  duration: { type: String }
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  numberOfPeople: { type: Number, required: true },
  preferredDate: { type: Date, required: true },
  participantNames: { type: [String], default: [] },
  status: { type: String, default: 'pending' },
  totalAmount: { type: String, required: true },
  notes: { type: String },
  paymentStatus: { type: String, enum: ['unpaid', 'deposit_paid', 'fully_paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash', 'cash_deposit'] },
  paidAmount: { type: Number, default: 0 },
  depositAmount: { type: Number },
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

// Tour Business Performance Indexes - Enhanced for Production
// Activity discovery for tourists
activitySchema.index({ name: 'text', description: 'text', location: 'text' });
activitySchema.index({ category: 1, isActive: 1, rating: -1 });
activitySchema.index({ price: 1, rating: -1 });
activitySchema.index({ location: 1, isActive: 1 });
activitySchema.index({ isActive: 1, approvalStatus: 1, category: 1, rating: -1 });
// Additional performance indexes
activitySchema.index({ createdAt: -1, isActive: 1 });
activitySchema.index({ category: 1, difficulty: 1, isActive: 1 });
activitySchema.index({ maxParticipants: 1, isActive: 1 });

// Booking management for peak seasons - Enhanced
bookingSchema.index({ activityId: 1, preferredDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customerPhone: 1 });
bookingSchema.index({ preferredDate: 1, status: 1 });
bookingSchema.index({ createdAt: -1, paymentStatus: 1, totalAmount: 1 });
bookingSchema.index({ preferredDate: 1, status: 1, activityId: 1 });
// Additional performance indexes for production
bookingSchema.index({ paymentStatus: 1, status: 1, createdAt: -1 });
bookingSchema.index({ customerEmail: 1 });
bookingSchema.index({ numberOfPeople: 1, status: 1 });
bookingSchema.index({ totalAmount: 1, paymentStatus: 1 });
bookingSchema.index({ updatedAt: -1, status: 1 });

// Review performance indexes
reviewSchema.index({ activityId: 1, approved: 1, rating: -1 });
reviewSchema.index({ customerEmail: 1 });
reviewSchema.index({ createdAt: -1, approved: 1 });
reviewSchema.index({ rating: -1, approved: 1 });

// Audit log performance indexes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Models
const User = mongoose.model('User', userSchema);
const Activity = mongoose.model('Activity', activitySchema);
const Booking = mongoose.model('Booking', bookingSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const Review = mongoose.model('Review', reviewSchema);

export interface IStorage {
  getUser(id: string): Promise<UserType | null>;
  getUserByUsername(username: string): Promise<UserType | null>;
  getUsers(): Promise<UserType[]>;
  createUser(user: InsertUser): Promise<UserType>;
  updateUserPassword(username: string, password: string): Promise<void>;
  getActivities(): Promise<ActivityType[]>;
  getPendingActivities(): Promise<ActivityType[]>;
  getAllActivities(): Promise<ActivityType[]>;
  getActivity(id: string): Promise<ActivityType | null>;
  createActivity(activity: InsertActivity): Promise<ActivityType>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<ActivityType | null>;
  approveActivity(id: string, approvedBy: string): Promise<ActivityType | null>;
  rejectActivity(id: string, approvedBy: string): Promise<ActivityType | null>;
  deleteActivity(id: string): Promise<void>;
  getBookings(): Promise<BookingWithActivity[]>;
  getBooking(id: string): Promise<BookingWithActivity | null>;
  createBooking(booking: InsertBooking): Promise<BookingType>;
  updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<BookingType | null>;
  updateBookingStatus(id: string, status: string): Promise<BookingType | null>;
  updateBookingPayment(id: string, paymentData: {
    paymentStatus: string;
    paidAmount: number;
    paymentMethod: string;
    depositAmount?: number;
  }): Promise<BookingType | null>;
  deleteBooking(id: string): Promise<boolean>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLogType>;
  getAuditLogs(): Promise<AuditLogType[]>;
  getAdmins(): Promise<any[]>;
  createAdmin(adminData: { username: string; password: string; role: string }): Promise<any>;
  deleteAdmin(id: string): Promise<boolean>;
  exportBookingsToCSV(bookings: BookingWithActivity[]): Promise<string>;
  exportAuditLogsToCSV(logs: AuditLogType[]): Promise<string>;
  exportBookingsToPDF(bookings: BookingWithActivity[]): Promise<Buffer>;
  generateOperationsReport(): Promise<any>;
  exportOperationsReportToPDF(reportData: any): Promise<Buffer>;
  getReviews(activityId?: string): Promise<ReviewWithActivity[]>;
  getReview(id: string): Promise<ReviewWithActivity | null>;
  createReview(review: InsertReview): Promise<ReviewType>;
  updateReviewApproval(id: string, approved: boolean): Promise<ReviewType | null>;
  getActivityRating(activityId: string): Promise<{ averageRating: number; totalReviews: number }>;
  seedInitialData(): Promise<void>;
  getEarningsAnalytics(): Promise<any>;
  getActivityAnalytics(): Promise<any>;
  getBookingAnalytics(): Promise<any>;
  getGetYourGuidePriceComparison(): Promise<any>;
  updateActivityGetYourGuidePrice(id: string, price: number): Promise<ActivityType | null>;
}

class MongoStorage implements IStorage {
  constructor() {
    // Database connection is handled separately in db.ts
    // This class assumes MongoDB is already connected
  }

  private transformDocument(doc: any): any {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj._id = obj._id.toString();
    obj.id = obj._id;

    if (Object.prototype.hasOwnProperty.call(obj, 'imageUrls') || Object.prototype.hasOwnProperty.call(obj, 'image') || Object.prototype.hasOwnProperty.call(obj, 'photos')) {
      const urls = Array.isArray(obj.imageUrls) ? obj.imageUrls.filter(Boolean) : [];
      const legacyPhotos = Array.isArray(obj.photos) ? obj.photos.filter(Boolean) : [];
      const legacyImage = typeof obj.image === 'string' && obj.image ? [obj.image] : [];
      const merged = [...legacyImage, ...urls, ...legacyPhotos];
      obj.imageUrls = Array.from(new Set(merged)).filter(Boolean);
      delete obj.image;
      delete obj.photos;
    }

    return obj;
  }

  // User operations
  async getUser(id: string): Promise<UserType | null> {
    try {
      const user = await User.findById(id);
      return this.transformDocument(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ username });
      return this.transformDocument(user);
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async getUsers(): Promise<UserType[]> {
    try {
      const users = await User.find({});
      return users.map(user => this.transformDocument(user)).filter(Boolean) as UserType[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(userData: InsertUser): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = new User({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    return this.transformDocument(savedUser);
  }

  async updateUserPassword(username: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      { username },
      { $set: { password: hashedPassword } }
    );
  }

  // Activity operations

  async getActivities(options = { includeSeeded: true }): Promise<ActivityType[]> {
    try {
      const cacheKey = `activities_${JSON.stringify(options)}`;
      
      return await cacheService.withCache(
        'activities',
        cacheKey,
        async () => {
          const query = {
            isActive: true,
            $or: [
              { approvalStatus: 'approved' },
              ...(options.includeSeeded ? [{ isSeeded: true }] : [])
            ]
          };
          
          const activities = await Activity.find(query);
          return activities.map(activity => this.transformDocument(activity));
        },
        3600 // 1 hour cache
      );
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }


  async getPendingActivities(): Promise<ActivityType[]> {
    try {
      const activities = await Activity.find({ approvalStatus: 'pending' });
      return activities.map(activity => this.transformDocument(activity));
    } catch (error) {
      console.error('Error fetching pending activities:', error);
      throw error;
    }
  }

  async getAllActivities(): Promise<ActivityType[]> {
    try {
      const activities = await Activity.find({});
      return activities.map(activity => this.transformDocument(activity));
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw error;
    }
  }

  async getActivity(id: string): Promise<ActivityType | null> {
    try {
      const activity = await Activity.findById(id);
      return this.transformDocument(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  }

  async createActivity(activityData: InsertActivity): Promise<ActivityType> {
    const imageUrls = (activityData.imageUrls ?? []).filter(Boolean);
    if (imageUrls.length === 0) {
      throw new Error('imageUrls must contain at least one entry');
    }

    const activity = new Activity({
      ...activityData,
      imageUrls,
    });
    const savedActivity = await activity.save();
    return this.transformDocument(savedActivity);
  }

  async updateActivity(id: string, activityData: Partial<InsertActivity>): Promise<ActivityType | null> {
    const updatedFields: Partial<InsertActivity> = { ...activityData };
    if (activityData.imageUrls) {
      const normalized = activityData.imageUrls.filter(Boolean);
      if (normalized.length === 0) {
        throw new Error('imageUrls must contain at least one entry');
      }
      updatedFields.imageUrls = normalized;
    }

    const activity = await Activity.findByIdAndUpdate(id, updatedFields, { new: true });
    return this.transformDocument(activity);
  }

  async approveActivity(id: string, approvedBy: string, reason: string = 'Activity approved'): Promise<ActivityType | null> {
    try {
      const activity = await Activity.findById(id);
      if (!activity) return null;

      activity.approvalStatus = 'approved';
      activity.approvedBy = approvedBy;
      activity.approvedAt = new Date();
      activity.approvalHistory.push({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        reason
      });

      await activity.save();
      return this.transformDocument(activity);
    } catch (error) {
      console.error('Error approving activity:', error);
      throw error;
    }
  }

  async rejectActivity(id: string, approvedBy: string): Promise<ActivityType | null> {
    try {
      const activity = await Activity.findByIdAndUpdate(
        id, 
        { 
          approvalStatus: 'rejected',
          approvedBy,
          approvedAt: new Date()
        }, 
        { new: true }
      );
      return this.transformDocument(activity);
    } catch (error) {
      console.error('Error rejecting activity:', error);
      throw error;
    }
  }

  async deleteActivity(id: string): Promise<void> {
    await Activity.findByIdAndDelete(id);
  }

  // Booking operations
  async getBookings(): Promise<BookingWithActivity[]> {
    return await cacheService.withCache(
      'bookings',
      'all',
      async () => {
        const bookings = await Booking.find().populate('activityId').sort({ createdAt: -1 });
        return bookings.map(booking => {
          const bookingObj = this.transformDocument(booking);
          if (bookingObj.activityId && typeof bookingObj.activityId === 'object') {
            bookingObj.activity = this.transformDocument(bookingObj.activityId);
            bookingObj.activityId = bookingObj.activity._id;
          }
          return bookingObj;
        });
      },
      300 // 5 minutes cache
    );
  }

  async getBooking(id: string): Promise<BookingWithActivity | null> {
    const booking = await Booking.findById(id).populate('activityId');
    if (!booking) return null;
    
    const bookingObj = this.transformDocument(booking);
    if (bookingObj.activityId && typeof bookingObj.activityId === 'object') {
      bookingObj.activity = this.transformDocument(bookingObj.activityId);
      bookingObj.activityId = bookingObj.activity._id;
    }
    return bookingObj;
  }

  async createBooking(bookingData: InsertBooking): Promise<BookingType> {
    const startTime = Date.now();
    
    try {
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();
      
      // Invalidate bookings cache
      await cacheService.invalidateBookings();
      
      // Log booking creation
      loggingService.logBooking(savedBooking._id?.toString() || 'unknown', 'created', {
        customerName: bookingData.customerName,
        activityId: bookingData.activityId,
        totalAmount: bookingData.totalAmount,
        numberOfPeople: bookingData.numberOfPeople
      });
      
      const duration = Date.now() - startTime;
      loggingService.logDatabaseOperation('create', 'bookings', duration, true);
      
      return this.transformDocument(savedBooking);
    } catch (error) {
      const duration = Date.now() - startTime;
      loggingService.logDatabaseOperation('create', 'bookings', duration, false);
      loggingService.error('Failed to create booking', error as Error);
      throw error;
    }
  }

  async updateBooking(id: string, updateData: Partial<InsertBooking>): Promise<BookingType | null> {
    const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });
    return this.transformDocument(booking);
  }

  async updateBookingStatus(id: string, status: string): Promise<BookingType | null> {
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    return this.transformDocument(booking);
  }

  async updateBookingPayment(id: string, paymentData: {
    paymentStatus: string;
    paidAmount: number;
    paymentMethod: string;
    depositAmount?: number;
  }): Promise<BookingType | null> {
    const booking = await Booking.findByIdAndUpdate(id, paymentData, { new: true });
    return this.transformDocument(booking);
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await Booking.findByIdAndDelete(id);
    return !!result;
  }

  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLogType> {
    const log = new AuditLog(logData);
    const savedLog = await log.save();
    return this.transformDocument(savedLog);
  }

  async getAuditLogs(): Promise<AuditLogType[]> {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return logs.map(log => this.transformDocument(log));
  }

  // Admin management operations
  async getAdmins(): Promise<any[]> {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('-password');
    return admins.map(admin => this.transformDocument(admin));
  }

  async createAdmin(adminData: { username: string; password: string; role: string }): Promise<any> {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const admin = new User({
      username: adminData.username,
      password: hashedPassword,
      role: adminData.role
    });
    
    const savedAdmin = await admin.save();
    return this.transformDocument(savedAdmin);
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  // CSV Export operations
  async exportBookingsToCSV(bookings: BookingWithActivity[]): Promise<string> {
    const headers = [
      'Booking ID', 
      'Customer Name', 
      'Customer Phone', 
      'Customer Email', 
      'Activity Name', 
      'Activity Price',
      'Number of People', 
      'Preferred Date', 
      'Total Amount (MAD)', 
      'Paid Amount (MAD)',
      'Remaining Amount (MAD)',
      'Payment Status', 
      'Booking Status',
      'Payment Method',
      'Notes',
      'Created At',
      'Updated At'
    ];
    
    const rows = bookings.map(booking => [
      booking._id || booking.id || '',
      booking.customerName || '',
      booking.customerPhone || '',
      booking.customerEmail || '',
      booking.activity?.name || 'Unknown Activity',
      booking.activity?.price || 0,
      booking.numberOfPeople || 1,
      new Date(booking.preferredDate).toLocaleDateString('en-CA'),
      booking.totalAmount || 0,
      booking.paidAmount || 0,
      (Number(booking.totalAmount) || 0) - (Number(booking.paidAmount) || 0),
      booking.paymentStatus || 'unpaid',
      booking.status || 'pending',
      booking.paymentMethod || 'cash',
      (booking.notes || '').replace(/\n/g, ' ').replace(/\r/g, ' '),
      new Date(booking.createdAt).toISOString(),
      new Date(booking.updatedAt || booking.createdAt).toISOString()
    ]);
    
    // Create CSV with proper escaping and BOM for Excel compatibility
    const csvContent = [headers, ...rows].map(row => 
      row.map(field => {
        const stringField = String(field || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    ).join('\n');
    
    // Add BOM for proper UTF-8 encoding in Excel
    return '\uFEFF' + csvContent;
  }

  async exportAuditLogsToCSV(logs: AuditLogType[]): Promise<string> {
    const headers = [
      'ID', 'User ID', 'Action', 'Details', 'Created At'
    ];
    
    const rows = logs.map(log => [
      log._id,
      log.userId,
      log.action,
      log.details,
      new Date(log.createdAt).toISOString()
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  // PDF Export operations
  async exportBookingsToPDF(bookings: BookingWithActivity[]): Promise<Buffer> {
    // Import jsPDF using dynamic import for ES modules
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table layout
    
    // Add title and header
    doc.setFontSize(24);
    doc.text('MarrakechDunes - Bookings Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, 30);
    
    // Add summary statistics
    const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const paidBookings = bookings.filter(b => b.paymentStatus === 'fully_paid').length;
    const totalPaid = bookings.reduce((sum, booking) => sum + (Number(booking.paidAmount) || 0), 0);
    
    doc.text(`Total Bookings: ${bookings.length}`, 20, 40);
    doc.text(`Total Revenue: ${totalRevenue.toLocaleString()} MAD`, 20, 47);
    doc.text(`Total Paid: ${totalPaid.toLocaleString()} MAD`, 20, 54);
    doc.text(`Outstanding: ${(totalRevenue - totalPaid).toLocaleString()} MAD`, 20, 61);
    doc.text(`Status: Confirmed: ${confirmedBookings} | Pending: ${pendingBookings} | Paid: ${paidBookings}`, 20, 68);
    
    // Add bookings table with better structure
    let yPosition = 80;
    doc.setFontSize(10);
    
    // Table headers with background
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition - 5, 260, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    doc.text('ID', 20, yPosition);
    doc.text('Customer', 35, yPosition);
    doc.text('Phone', 80, yPosition);
    doc.text('Activity', 110, yPosition);
    doc.text('Date', 150, yPosition);
    doc.text('People', 170, yPosition);
    doc.text('Total', 185, yPosition);
    doc.text('Paid', 205, yPosition);
    doc.text('Status', 225, yPosition);
    doc.text('Payment', 250, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    
    // Add booking rows with alternating colors
    bookings.forEach((booking, index) => {
      if (yPosition > 190) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
        
        // Re-add headers on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition - 5, 260, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('ID', 20, yPosition);
        doc.text('Customer', 35, yPosition);
        doc.text('Phone', 80, yPosition);
        doc.text('Activity', 110, yPosition);
        doc.text('Date', 150, yPosition);
        doc.text('People', 170, yPosition);
        doc.text('Total', 185, yPosition);
        doc.text('Paid', 205, yPosition);
        doc.text('Status', 225, yPosition);
        doc.text('Payment', 250, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPosition - 3, 260, 6, 'F');
      }
      
      // Truncate long text
      const truncate = (text: string, maxLength: number) => 
        text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
      
      doc.text(truncate(booking._id || booking.id || '', 8), 20, yPosition);
      doc.text(truncate(booking.customerName || '', 20), 35, yPosition);
      doc.text(truncate(booking.customerPhone || '', 15), 80, yPosition);
      doc.text(truncate(booking.activity?.name || 'Unknown', 25), 110, yPosition);
      doc.text(new Date(booking.preferredDate).toLocaleDateString('en-CA'), 150, yPosition);
      doc.text(String(booking.numberOfPeople || 1), 170, yPosition);
      doc.text(`${Number(booking.totalAmount || 0).toLocaleString()}`, 185, yPosition);
      doc.text(`${Number(booking.paidAmount || 0).toLocaleString()}`, 205, yPosition);
      doc.text(truncate(booking.status || 'pending', 8), 225, yPosition);
      doc.text(truncate(booking.paymentStatus || 'unpaid', 8), 250, yPosition);
      
      yPosition += 6;
    });
    
    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, 290);
      doc.text(`MarrakechDunes Bookings Report`, 200, 290);
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateOperationsReport(): Promise<any> {
    const bookings = await this.getBookings();
    const activities = await this.getActivities();
    const reviews = await this.getReviews();
    
    // Calculate metrics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // Activity performance
    const activityPerformance = activities.map(activity => {
      const activityBookings = bookings.filter(b => b.activity?._id === activity._id);
      const activityRevenue = activityBookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
      const activityRating = reviews
        .filter(r => r.activityId === activity._id)
        .reduce((sum, review, _, arr) => sum + review.rating / arr.length, 0);
      
      return {
        name: activity.name,
        bookings: activityBookings.length,
        revenue: activityRevenue,
        rating: activityRating || 0,
        popularity: activityBookings.length / totalBookings * 100
      };
    });
    
    // Monthly trends
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === month.getMonth() && 
               bookingDate.getFullYear() === month.getFullYear();
      });
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + parseInt(b.totalAmount), 0)
      };
    }).reverse();
    
    return {
      summary: {
        totalBookings,
        totalRevenue,
        averageBookingValue,
        totalActivities: activities.length,
        averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0
      },
      activityPerformance,
      monthlyTrends: monthlyData,
      topActivities: activityPerformance
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      generatedAt: new Date().toISOString()
    };
  }

  async exportOperationsReportToPDF(reportData: any): Promise<Buffer> {
    // Import jsPDF using dynamic import for ES modules
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better layout
    
    // Add title and header
    doc.setFontSize(24);
    doc.text('MarrakechDunes - Operations Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, 30);
    
    // Executive Summary with better formatting
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 40, 260, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, 50);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Bookings: ${reportData.summary.totalBookings}`, 20, 58);
    doc.text(`Total Revenue: ${Number(reportData.summary.totalRevenue).toLocaleString()} MAD`, 20, 63);
    doc.text(`Average Booking Value: ${Number(reportData.summary.averageBookingValue).toFixed(2)} MAD`, 20, 68);
    doc.text(`Average Rating: ${Number(reportData.summary.averageRating).toFixed(1)}/5`, 20, 73);
    
    // Top Performing Activities with table format
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performing Activities', 20, 90);
    
    // Table headers
    doc.setFillColor(220, 220, 220);
    doc.rect(15, 95, 260, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Rank', 20, 101);
    doc.text('Activity Name', 40, 101);
    doc.text('Bookings', 120, 101);
    doc.text('Revenue (MAD)', 150, 101);
    doc.text('Rating', 200, 101);
    doc.text('Popularity %', 230, 101);
    
    // Activity rows
    doc.setFont('helvetica', 'normal');
    let yPos = 110;
    reportData.topActivities.forEach((activity: any, index: number) => {
      if (yPos > 190) { // Start new page if needed
        doc.addPage();
        yPos = 20;
        
        // Re-add headers on new page
        doc.setFillColor(220, 220, 220);
        doc.rect(15, yPos - 5, 260, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Rank', 20, yPos);
        doc.text('Activity Name', 40, yPos);
        doc.text('Bookings', 120, yPos);
        doc.text('Revenue (MAD)', 150, yPos);
        doc.text('Rating', 200, yPos);
        doc.text('Popularity %', 230, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos - 3, 260, 6, 'F');
      }
      
      doc.text(`${index + 1}`, 20, yPos);
      doc.text(activity.name.length > 25 ? activity.name.substring(0, 25) + '...' : activity.name, 40, yPos);
      doc.text(String(activity.bookings), 120, yPos);
      doc.text(Number(activity.revenue).toLocaleString(), 150, yPos);
      doc.text(Number(activity.rating).toFixed(1), 200, yPos);
      doc.text(Number(activity.popularity).toFixed(1) + '%', 230, yPos);
      
      yPos += 6;
    });
    
    // Monthly Trends with better formatting
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Performance Trends', 20, yPos + 10);
    
    // Monthly trends table
    doc.setFillColor(220, 220, 220);
    doc.rect(15, yPos + 20, 260, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Month', 20, yPos + 26);
    doc.text('Bookings', 80, yPos + 26);
    doc.text('Revenue (MAD)', 120, yPos + 26);
    doc.text('Avg per Booking', 180, yPos + 26);
    doc.text('Growth %', 230, yPos + 26);
    
    doc.setFont('helvetica', 'normal');
    yPos += 35;
    
    reportData.monthlyTrends.slice(-12).forEach((month: any, index: number) => {
      if (yPos > 190) { // Start new page if needed
        doc.addPage();
        yPos = 20;
        
        // Re-add headers on new page
        doc.setFillColor(220, 220, 220);
        doc.rect(15, yPos - 5, 260, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Month', 20, yPos);
        doc.text('Bookings', 80, yPos);
        doc.text('Revenue (MAD)', 120, yPos);
        doc.text('Avg per Booking', 180, yPos);
        doc.text('Growth %', 230, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
      }
      
      const avgPerBooking = month.bookings > 0 ? (month.revenue / month.bookings).toFixed(2) : '0.00';
      const prevMonth = reportData.monthlyTrends[reportData.monthlyTrends.indexOf(month) - 1];
      const growth = prevMonth && prevMonth.bookings > 0 ? 
        (((month.bookings - prevMonth.bookings) / prevMonth.bookings) * 100).toFixed(1) : '0.0';
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos - 3, 260, 6, 'F');
      }
      
      doc.text(month.month, 20, yPos);
      doc.text(String(month.bookings), 80, yPos);
      doc.text(Number(month.revenue).toLocaleString(), 120, yPos);
      doc.text(avgPerBooking, 180, yPos);
      doc.text(growth + '%', 230, yPos);
      
      yPos += 6;
    });
    
    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, 290);
      doc.text(`MarrakechDunes Operations Report`, 200, 290);
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  // Review operations
  async getReviews(activityId?: string): Promise<ReviewWithActivity[]> {
    const query = activityId ? { activityId, approved: true } : { approved: true };
    const reviews = await Review.find(query).populate('activityId').sort({ createdAt: -1 });
    return reviews.map(review => {
      const reviewObj = this.transformDocument(review);
      if (reviewObj.activityId && typeof reviewObj.activityId === 'object') {
        reviewObj.activity = this.transformDocument(reviewObj.activityId);
        reviewObj.activityId = reviewObj.activity._id;
      }
      return reviewObj;
    });
  }

  async getReview(id: string): Promise<ReviewWithActivity | null> {
    const review = await Review.findById(id).populate('activityId');
    if (!review) return null;
    
    const reviewObj = this.transformDocument(review);
    if (reviewObj.activityId && typeof reviewObj.activityId === 'object') {
      reviewObj.activity = this.transformDocument(reviewObj.activityId);
      reviewObj.activityId = reviewObj.activity._id;
    }
    return reviewObj;
  }

  async createReview(reviewData: InsertReview): Promise<ReviewType> {
    const review = new Review(reviewData);
    const savedReview = await review.save();
    return this.transformDocument(savedReview);
  }

  async updateReviewApproval(id: string, approved: boolean): Promise<ReviewType | null> {
    const review = await Review.findByIdAndUpdate(id, { approved }, { new: true });
    return this.transformDocument(review);
  }

  async getActivityRating(activityId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const reviews = await Review.find({ activityId, approved: true });
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    
    return { averageRating, totalReviews };
  }

  async seedInitialData(): Promise<void> {
    try {
      // Test MongoDB connection before proceeding
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection not available');
      }

      // Create admin users if they don't exist
      // Use environment variables - no fallback defaults for security
      const superadminPassword = process.env.SUPERADMIN_PASSWORD;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      console.log('ðŸ” Environment variables check:');
      console.log('  SUPERADMIN_PASSWORD:', superadminPassword ? 'SET' : 'NOT SET');
      console.log('  ADMIN_PASSWORD:', adminPassword ? 'SET' : 'NOT SET');
      
      if (!superadminPassword || !adminPassword) {
        throw new Error('ADMIN_PASSWORD and SUPERADMIN_PASSWORD environment variables are required');
      }
      
      // Admin users as specified
      const adminUsers = [
        { username: 'ahmed', password: adminPassword, role: 'admin' as const },
        { username: 'yahia', password: adminPassword, role: 'admin' as const },
        { username: 'nadia', password: superadminPassword, role: 'superadmin' as const },
      ];

      // Clean up any old default users
      const oldUsers = ['admin', 'superadmin'];
      for (const oldUsername of oldUsers) {
        const oldUser = await User.findOne({ username: oldUsername });
        if (oldUser) {
          console.log(`ðŸ—‘ï¸ Removing old default user: ${oldUsername}`);
          await User.deleteOne({ username: oldUsername });
        }
      }

      for (const userData of adminUsers) {
        const existingUser = await User.findOne({ username: userData.username });
        if (!existingUser) {
          console.log(`ðŸ” Creating admin user: ${userData.username} with password length: ${userData.password ? userData.password.length : 'undefined'}`);
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.create({
            ...userData,
            password: hashedPassword,
          });
          console.log(`✅ Created admin user: ${userData.username}`);
        } else {
          console.log(`ℹ️ Admin user already exists: ${userData.username}`);
          // Force update password to ensure it's correct
          console.log(`🔄 Updating password for existing user: ${userData.username}`);
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.updateOne(
            { username: userData.username },
            { $set: { password: hashedPassword, role: userData.role } }
          );
          console.log(`✅ Updated password and role for admin user: ${userData.username}`);
        }
      }

      // Check if we need to update existing activities with new image filenames
      const existingSeeded = await Activity.findOne({ isSeeded: true });
      
      // If activities exist but have old image filenames, update them
      const needsUpdate = existingSeeded && existingSeeded.imageUrls && 
        existingSeeded.imageUrls.some(url => url.includes('175112') || url.includes('175648'));
      
      if (!existingSeeded || needsUpdate) {
        // If updating, delete old activities first
        if (needsUpdate) {
          console.log('🔄 Updating existing activities with new image filenames...');
          await Activity.deleteMany({ isSeeded: true });
        }
        // Seed with unique images per activity from assets
        const activities = [
          {
            name: "Montgolfière (Hot Air Balloon)",
            description: "Experience the magic of Marrakech from above with a sunrise hot air balloon ride over the Atlas Mountains and traditional Berber villages.",
            price: "1100",
            currency: "MAD",
            imageUrls: [
              "Hot Air Balloon Ride1.jpg",
              "Hot Air Balloon Ride2.jpg",
              "Hot Air Balloon Ride3.jpg",
              "montgofliere_a_marrakech.jpg",
              "montgolfiere-marrakech.jpg"
            ],
            category: "Adventure",
            isActive: true,
            approvalStatus: 'approved',
            isSeeded: true,
            approvalHistory: [{
              status: 'approved',
              approvedBy: 'system',
              approvedAt: new Date(),
              reason: 'Initial seeding'
            }],
            availability: "Daily at sunrise (6:00 AM)"
          },
          {
            name: "Agafay Combo",
            description: "Complete Agafay Desert experience with camel riding, quad biking, traditional dinner under the stars, and sunset views.",
            price: "450",
            currency: "MAD",
            imageUrls: [
              "agafaypack.jpeg",
              "agafaypack1.jpeg",
              "agafaypack2.jpeg",
              "agafaypack3.jpeg",
              "agafaypack7.jpeg"
            ],
            category: "Adventure",
            isActive: true,
            approvalStatus: 'approved',
            isSeeded: true,
            approvalHistory: [{
              status: 'approved',
              approvedBy: 'system',
              approvedAt: new Date(),
              reason: 'Initial seeding'
            }],
            availability: "Daily departures"
          },
          {
            name: "Essaouira Day Trip",
            description: "Discover the coastal charm of Essaouira with its historic medina, fishing port, and beautiful Atlantic beaches.",
            price: "200",
            currency: "MAD",
            imageUrls: [
              "Essaouira Day Trip1_1751124502666.jpg",
              "Essaouira day trip 3_1751122022832.jpg",
              "Essaouira day trip 4_1751122022833.jpg",
              "Essaouira Day Trip_1751122022833.jpg",
              "Essaouira Day Trip2_1751122022833.jpg"
            ],
            category: "Day Trips",
            isActive: true,
            approvalStatus: 'approved',
            isSeeded: true,
            approvalHistory: [{
              status: 'approved',
              approvedBy: 'system',
              approvedAt: new Date(),
              reason: 'Initial seeding'
            }],
            availability: "Daily 8:00 AM - 7:00 PM"
          },
          {
            name: "Ouzoud Waterfalls Day Trip",
            description: "Visit Morocco's most spectacular waterfalls with 110-meter cascades, rainbow views, and Barbary macaque encounters.",
            price: "200",
            currency: "MAD",
            imageUrls: [
              "Cascades_d'Ouzoud_008.JPG",
              "ouzoud waterfalls 2.jpg",
              "Ouzoud-Waterfalls.jpg",
              "Ouzoud-Waterfalls3.jpg",
              "Ouzoud-Waterfalls4.JPG"
            ],
            category: "Nature",
            isActive: true,
            approvalStatus: 'approved',
            isSeeded: true,
            approvalHistory: [{
              status: 'approved',
              approvedBy: 'system',
              approvedAt: new Date(),
              reason: 'Initial seeding'
            }],
            availability: "Daily 8:00 AM - 6:00 PM"
          },
          {
            name: "Ourika Valley Day Trip",
            description: "Discover the stunning Ourika Valley with its colorful Berber villages, flowing rivers, snow-capped Atlas Mountains, and authentic local culture.",
            price: "150",
            currency: "MAD",
            imageUrls: [
              "Ourika Valley Day Trip.jpg",
              "Ourika Valley Day Trip1.jpg",
              "ourika valley3.jpg",
              "Ourika-Valley-day-trip-from-Marrakech.jpg"
            ],
            category: "Day Trips",
            isActive: true,
            approvalStatus: 'approved',
            isSeeded: true,
            approvalHistory: [{
              status: 'approved',
              approvedBy: 'system',
              approvedAt: new Date(),
              reason: 'Initial seeding'
            }],
            availability: "Daily 9:00 AM - 5:00 PM"
          }
        ];

        await Activity.insertMany(activities);
        console.log(`✅ Created ${activities.length} initial activities`);
        
        // Force clear any cached data by updating the database timestamp
        await Activity.updateMany({}, { $set: { updatedAt: new Date() } });
        console.log('🔄 Database cache cleared - activities updated with new image filenames');
      }

      console.log('✅ MongoDB seed data initialized successfully');
    } catch (error) {
      console.error('âŒ Error seeding data:', error);
    }
  }

  // Analytics methods
  async getEarningsAnalytics(): Promise<any> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const currentMonthEarnings = await Booking.aggregate([
      { $match: { createdAt: { $gte: currentMonth }, paymentStatus: { $in: ['deposit_paid', 'fully_paid'] } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const lastMonthEarnings = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lt: currentMonth }, paymentStatus: { $in: ['deposit_paid', 'fully_paid'] } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    return {
      currentMonth: currentMonthEarnings[0]?.total || 0,
      lastMonth: lastMonthEarnings[0]?.total || 0,
      currency: 'MAD'
    };
  }

  async getActivityAnalytics(): Promise<any> {
    const activities = await Activity.find({ isActive: true });
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: '$activityId', count: { $sum: 1 } } }
    ]);

    return activities.map(activity => {
      const bookingData = bookingCounts.find(b => b._id.toString() === activity._id.toString());
      return {
        ...this.transformDocument(activity),
        bookingCount: bookingData?.count || 0
      };
    });
  }

  async getBookingAnalytics(): Promise<any> {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    
    return {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: totalBookings - pendingBookings - confirmedBookings
    };
  }

  async getGetYourGuidePriceComparison(): Promise<any> {
    const activities = await Activity.find({ isActive: true });
    return activities.map(activity => this.transformDocument(activity));
  }

  async updateActivityGetYourGuidePrice(id: string, price: number): Promise<ActivityType | null> {
    const activity = await Activity.findByIdAndUpdate(id, { getyourguidePrice: price }, { new: true });
    return this.transformDocument(activity);
  }
}

export const storage = new MongoStorage();


