import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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

// Tour Business Performance Indexes
// Activity discovery for tourists
activitySchema.index({ name: 'text', description: 'text', location: 'text' });
activitySchema.index({ category: 1, isActive: 1, rating: -1 });
activitySchema.index({ price: 1, rating: -1 });
activitySchema.index({ location: 1, isActive: 1 });
activitySchema.index({ isActive: 1, approvalStatus: 1, category: 1, rating: -1 });

// Booking management for peak seasons
bookingSchema.index({ activityId: 1, preferredDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customerPhone: 1 });
bookingSchema.index({ preferredDate: 1, status: 1 });
bookingSchema.index({ createdAt: -1, paymentStatus: 1, totalAmount: 1 });
bookingSchema.index({ preferredDate: 1, status: 1, activityId: 1 });

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
      const query = {
        isActive: true,
        $or: [
          { approvalStatus: 'approved' },
          ...(options.includeSeeded ? [{ isSeeded: true }] : [])
        ]
      };
      
      const activities = await Activity.find(query);
      return activities.map(activity => this.transformDocument(activity));
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
    const bookings = await Booking.find().populate('activityId').sort({ createdAt: -1 });
    return bookings.map(booking => {
      const bookingObj = this.transformDocument(booking);
      if (bookingObj.activityId && typeof bookingObj.activityId === 'object') {
        bookingObj.activity = this.transformDocument(bookingObj.activityId);
        bookingObj.activityId = bookingObj.activity._id;
      }
      return bookingObj;
    });
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
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    return this.transformDocument(savedBooking);
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
      'ID', 'Customer Name', 'Customer Phone', 'Customer Email', 
      'Activity Name', 'Number of People', 'Preferred Date', 
      'Total Amount', 'Payment Status', 'Status', 'Created At'
    ];
    
    const rows = bookings.map(booking => [
      booking._id,
      booking.customerName,
      booking.customerPhone,
      booking.customerEmail || '',
      booking.activity?.name || 'Unknown',
      booking.numberOfPeople,
      booking.preferredDate,
      booking.totalAmount,
      booking.paymentStatus || 'unpaid',
      booking.status,
      new Date(booking.createdAt).toISOString()
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
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
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('MarrakechDunes - Bookings Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Bookings: ${bookings.length}`, 20, 35);
    
    // Add summary statistics
    const totalRevenue = bookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    
    doc.text(`Total Revenue: ${totalRevenue} MAD`, 20, 45);
    doc.text(`Confirmed: ${confirmedBookings} | Pending: ${pendingBookings}`, 20, 50);
    
    // Add bookings table
    let yPosition = 60;
    doc.setFontSize(10);
    
    // Table headers
    doc.text('Customer', 20, yPosition);
    doc.text('Activity', 60, yPosition);
    doc.text('Date', 100, yPosition);
    doc.text('Amount', 130, yPosition);
    doc.text('Status', 160, yPosition);
    yPosition += 5;
    
    // Add line
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;
    
    // Add booking rows
    bookings.forEach((booking, index) => {
      if (yPosition > 280) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(booking.customerName, 20, yPosition);
      doc.text(booking.activity?.name || 'Unknown', 60, yPosition);
      doc.text(new Date(booking.preferredDate).toLocaleDateString(), 100, yPosition);
      doc.text(`${booking.totalAmount} MAD`, 130, yPosition);
      doc.text(booking.status, 160, yPosition);
      yPosition += 5;
    });
    
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
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('MarrakechDunes - Operations Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Summary section
    doc.setFontSize(14);
    doc.text('Executive Summary', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Bookings: ${reportData.summary.totalBookings}`, 20, 55);
    doc.text(`Total Revenue: ${reportData.summary.totalRevenue} MAD`, 20, 60);
    doc.text(`Average Booking Value: ${reportData.summary.averageBookingValue.toFixed(2)} MAD`, 20, 65);
    doc.text(`Average Rating: ${reportData.summary.averageRating.toFixed(1)}/5`, 20, 70);
    
    // Top Activities
    doc.setFontSize(14);
    doc.text('Top Performing Activities', 20, 85);
    doc.setFontSize(10);
    
    let yPos = 95;
    reportData.topActivities.forEach((activity: any, index: number) => {
      doc.text(`${index + 1}. ${activity.name}`, 20, yPos);
      doc.text(`   Revenue: ${activity.revenue} MAD | Bookings: ${activity.bookings}`, 20, yPos + 5);
      yPos += 15;
    });
    
    // Monthly Trends Chart (simplified)
    doc.setFontSize(14);
    doc.text('Monthly Trends', 20, yPos + 10);
    doc.setFontSize(10);
    
    yPos += 20;
    reportData.monthlyTrends.slice(-6).forEach((month: any) => {
      doc.text(`${month.month}: ${month.bookings} bookings, ${month.revenue} MAD`, 20, yPos);
      yPos += 5;
    });
    
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


