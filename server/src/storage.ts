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
  updateBookingStatus(id: string, status: string): Promise<BookingType | null>;
  updateBookingPayment(id: string, paymentData: {
    paymentStatus: string;
    paidAmount: number;
    paymentMethod: string;
    depositAmount?: number;
  }): Promise<BookingType | null>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLogType>;
  getAuditLogs(): Promise<AuditLogType[]>;
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
          console.log(`âœ… Created admin user: ${userData.username}`);
        } else {
          console.log(`â„¹ï¸ Admin user already exists: ${userData.username}`);
          // Force update password to ensure it's correct
          console.log(`ðŸ”„ Updating password for existing user: ${userData.username}`);
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.updateOne(
            { username: userData.username },
            { $set: { password: hashedPassword, role: userData.role } }
          );
          console.log(`âœ… Updated password and role for admin user: ${userData.username}`);
        }
      }

      // Only seed if no seeded activities exist
      const existingSeeded = await Activity.findOne({ isSeeded: true });
      if (!existingSeeded) {
        // Seed with unique images per activity from assets
        const activities = [
          {
            name: "Montgolfière (Hot Air Balloon)",
            description: "Experience the magic of Marrakech from above with a sunrise hot air balloon ride over the Atlas Mountains and traditional Berber villages.",
            price: "1100",
            currency: "MAD",
            imageUrls: [
              "montgolfiere-marrakech_1751127701687.jpg",
              "montgofliere_a_marrakech_1751127701687.jpg",
              "Hot Air Balloon Ride2_1751127701686.jpg",
              "Hot Air Balloon Ride3_1751127701686.jpg"
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
              "agafaypack1_1751128022717.jpeg",
              "agafaypack2_1751128022717.jpeg"
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
              "activities/ouzoud/Cascades_d'Ouzoud_008.JPG",
              "activities/ouzoud/Cascades_d'Ouzoud_014.JPG",
              "activities/ouzoud/Cascades_d'Ouzoud_018.JPG"
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
              "ourika valley3_1751114166832.jpg",
              "Ourika-Valley-day-trip-from-Marrakech_1756485141180.jpg",
              "ourika-valley-1_1756485141180.jpeg",
              "ourika-valley-marrakech_1756485141180.jpg",
              "ourika valley3_1756485141179.jpg"
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
        console.log(`âœ… Created ${activities.length} initial activities`);
      }

      console.log('âœ… MongoDB seed data initialized successfully');
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


