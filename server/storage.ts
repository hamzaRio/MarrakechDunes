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
} from "../shared/schema";

// MongoDB connection string - ensure proper format
const MONGODB_URI = process.env.MONGODB_URI;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;

// In-memory storage for fallback when MongoDB is unavailable
const inMemoryData = {
  users: [] as UserType[],
  activities: [] as ActivityType[],
  bookings: [] as BookingType[],
  auditLogs: [] as AuditLogType[],
  reviews: [] as ReviewType[]
};

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
  image: { type: String, required: true },
  photos: [{ type: String }],
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  seasonalPricing: { type: mongoose.Schema.Types.Mixed },
  getyourguidePrice: { type: Number },
  availability: { type: String },
  duration: { type: String },
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
  title: { type: String },
  comment: { type: String, required: true },
  verified: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
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
  createUser(user: InsertUser): Promise<UserType>;
  getActivities(): Promise<ActivityType[]>;
  getActivity(id: string): Promise<ActivityType | null>;
  createActivity(activity: InsertActivity): Promise<ActivityType>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<ActivityType | null>;
  deleteActivity(id: string): Promise<void>;
  getBookings(): Promise<BookingWithActivity[]>;
  getBooking(id: string): Promise<BookingWithActivity | null>;
  createBooking(booking: InsertBooking): Promise<BookingType>;
  updateBookingStatus(id: string, status: string): Promise<BookingType | null>;
  updateBookingPayment(id: string, paymentData: {
    paymentStatus: BookingType['paymentStatus'];
    paidAmount: number;
    paymentMethod: NonNullable<BookingType['paymentMethod']>;
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
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private useFallback = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    // Check if MONGODB_URI is available
    if (!MONGODB_URI) {
      console.log('MONGODB_URI not found. Using fallback mode for development.');
      this.useFallback = true;
      await this.seedFallbackData();
      return;
    }

    try {
      // Clear any existing connections
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Add timeout protection to prevent hanging
      const connectionTimeout = setTimeout(() => {
        console.log('MongoDB connection timeout reached. Switching to fallback mode.');
        this.useFallback = true;
        this.seedFallbackData();
      }, 10000); // 10 second timeout

      await mongoose.connect(MONGODB_URI, {
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Reduced from 30s
        socketTimeoutMS: 15000, // Reduced from 45s
        connectTimeoutMS: 10000, // Reduced from 30s
        family: 4
      });
      
      clearTimeout(connectionTimeout);
      this.isConnected = true;
      console.log('MongoDB Atlas connected successfully');
      
      // Seed initial data once connected
      await this.seedInitialData();
    } catch (error) {
      console.error('MongoDB connection failed:', error instanceof Error ? error.message : String(error));
      this.isConnected = false;
      this.connectionAttempts++;
      
      // Switch to fallback mode immediately in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: switching to fallback mode for faster startup.');
        this.useFallback = true;
        await this.seedFallbackData();
        return;
      }
      
      // Stop retrying after max attempts and switch to fallback mode
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying MongoDB connection in 3 seconds... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
        setTimeout(() => this.connect(), 3000); // Reduced retry delay
      } else {
        console.log('MongoDB Atlas unavailable. Switching to fallback mode for development.');
        this.useFallback = true;
        await this.seedFallbackData();
      }
    }
  }

  private transformDocument(doc: any): any {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj._id = obj._id.toString();
    obj.id = obj._id;
    return obj;
  }

  // User operations
  async getUser(id: string): Promise<UserType | null> {
    if (this.useFallback) {
      return inMemoryData.users.find(user => user._id === id) || null;
    }
    
    try {
      const user = await User.findById(id);
      return this.transformDocument(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | null> {
    if (this.useFallback) {
      return inMemoryData.users.find(user => user.username === username) || null;
    }
    
    try {
      const user = await User.findOne({ username });
      return this.transformDocument(user);
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async createUser(userData: InsertUser): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    if (this.useFallback) {
      const newUser: UserType = {
        _id: Date.now().toString(),
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.users.push(newUser);
      return newUser;
    }
    
    const user = new User({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    return this.transformDocument(savedUser);
  }

  // Activity operations
  async seedFallbackData(): Promise<void> {
    console.log('✅ Initializing fallback data with authentic activities');
    
    // Seed authentic Moroccan activities
    inMemoryData.activities = [
      {
        _id: '686000f2f5c4d141c7e87112',
        name: 'Hot Air Balloon Ride Marrakech',
        description: 'Experience breathtaking sunrise views over Marrakech and the Atlas Mountains from a hot air balloon. Includes hotel pickup, traditional Berber breakfast, and flight certificate.',
        price: '1100',
        currency: 'MAD',
        image: '/attached_assets/Hot Air Balloon Ride2_1751127701686.jpg',
        photos: [
          '/attached_assets/Hot Air Balloon Ride2_1751127701686.jpg',
          '/attached_assets/Hot Air Balloon Ride3_1751127701686.jpg',
          '/attached_assets/montgofliere_a_marrakech_1751127701687.jpg',
          '/attached_assets/montgolfiere-marrakech_1751127701687.jpg'
        ],
        category: 'Adventure',
        isActive: true,
        getyourguidePrice: 1400,
        availability: 'Daily at sunrise',
        duration: '4 hours',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '686000f2f5c4d141c7e87113',
        name: 'Agafay Desert Combo Experience',
        description: 'Full-day desert adventure combining camel riding, quad biking, and traditional dinner under the stars in the Agafay Desert near Marrakech.',
        price: '450',
        currency: 'MAD',
        image: '/attached_assets/agafaypack1_1751128022717.jpeg',
        photos: [
          '/attached_assets/agafaypack1_1751128022717.jpeg',
          '/attached_assets/agafaypack2_1751128022717.jpeg',
          '/attached_assets/agafaypack3_1751128022718.jpeg',
          '/attached_assets/agafaypack5_1751128022718.jpeg',
          '/attached_assets/agafaypack6_1751128022718.jpeg'
        ],
        category: 'Desert',
        isActive: true,
        getyourguidePrice: 600,
        availability: 'Daily',
        duration: '8 hours',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '686000f2f5c4d141c7e87114',
        name: 'Essaouira Day Trip',
        description: 'Discover the coastal charm of Essaouira, the "Windy City" with its Portuguese ramparts, blue fishing boats, and authentic seafood at Casa Vera restaurant.',
        price: '200',
        currency: 'MAD',
        image: '/attached_assets/Essaouira Day Trip1_1751124502666.jpg',
        photos: [
          '/attached_assets/Essaouira Day Trip1_1751124502666.jpg',
          '/attached_assets/Essaouira day trip 3_1751122022832.jpg',
          '/attached_assets/Essaouira day trip 4_1751122022833.jpg',
          '/attached_assets/Essaouira Day Trip_1751122022833.jpg',
          '/attached_assets/Essaouira Day Trip2_1751122022833.jpg'
        ],
        category: 'Cultural',
        isActive: true,
        getyourguidePrice: 300,
        availability: 'Daily',
        duration: '10 hours',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '686000f2f5c4d141c7e87115',
        name: 'Ouzoud Waterfalls Day Trip',
        description: 'Visit Morocco\'s highest waterfalls, swim in natural pools, enjoy lunch by the cascades, and spot Barbary apes in their natural habitat.',
        price: '200',
        currency: 'MAD',
        image: '/attached_assets/ouzoud waterfalls 2_1751126328232.jpg',
        photos: [
          '/attached_assets/ouzoud waterfalls 2_1751126328232.jpg',
          '/attached_assets/Ouzoud-Waterfalls3_1751126328233.jpg',
          '/attached_assets/Ouzoud-Waterfalls4_1751126328233.JPG',
          '/attached_assets/Ouzoud-Waterfalls_1751126328233.jpg'
        ],
        category: 'Nature',
        isActive: true,
        getyourguidePrice: 280,
        availability: 'Daily',
        duration: '8 hours',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '686000f2f5c4d141c7e87116',
        name: 'Ourika Valley Day Trip',
        description: 'Explore traditional Berber villages, terraced fields, and stunning Atlas Mountain landscapes in the beautiful Ourika Valley.',
        price: '150',
        currency: 'MAD',
        image: '/attached_assets/ourika-valley-1_1751119268337.jpeg',
        photos: [
          '/attached_assets/ourika-valley-1_1751119268337.jpeg',
          '/attached_assets/Ourika Valley Day Trip1_1751114166831.jpg',
          '/attached_assets/Ourika-Valley-day-trip-from-Marrakech_1751114166832.jpg',
          '/attached_assets/ourika valley3_1751114166832.jpg',
          '/attached_assets/ourika-valley-marrakech_1751114166832.jpg'
        ],
        category: 'Cultural',
        isActive: true,
        getyourguidePrice: 220,
        availability: 'Daily',
        duration: '6 hours',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Seed admin users if password is provided
    if (DEFAULT_ADMIN_PASSWORD) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      inMemoryData.users = [
        {
          _id: '686000f2f5c4d141c7e87101',
          username: 'nadia',
          password: hashedPassword,
          role: 'superadmin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '686000f2f5c4d141c7e87102',
          username: 'ahmed',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '686000f2f5c4d141c7e87103',
          username: 'yahia',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } else {
      console.warn('ADMIN_DEFAULT_PASSWORD not set. No fallback admin users seeded.');
    }
  }

  async getActivities(): Promise<ActivityType[]> {
    if (this.useFallback) {
      return inMemoryData.activities.filter(a => a.isActive);
    }
    
    try {
      if (!this.isConnected) {
        return inMemoryData.activities.filter(a => a.isActive);
      }
      const activities = await Activity.find({ isActive: true });
      return activities.map(activity => {
        const transformed = this.transformDocument(activity);
      
      // Ensure Essaouira activity has authentic Casa Vera restaurant photo
      if (transformed.name === 'Essaouira Day Trip') {
        transformed.image = '/attached_assets/Essaouira Day Trip1_1751124502666.jpg';
        transformed.photos = [
          '/attached_assets/Essaouira Day Trip1_1751124502666.jpg',
          '/attached_assets/Essaouira day trip 3_1751122022832.jpg',
          '/attached_assets/Essaouira day trip 4_1751122022833.jpg',
          '/attached_assets/Essaouira Day Trip_1751122022833.jpg',
          '/attached_assets/Essaouira Day Trip2_1751122022833.jpg'
        ];
      }
      
      // Ensure Ouzoud Waterfalls has authentic cascade photos
      if (transformed.name === 'Ouzoud Waterfalls Day Trip') {
        transformed.image = '/attached_assets/ouzoud waterfalls 2_1751126328232.jpg';
        transformed.photos = [
          '/attached_assets/ouzoud waterfalls 2_1751126328232.jpg',
          '/attached_assets/Ouzoud-Waterfalls_1751126328233.jpg',
          '/attached_assets/Ouzoud-Waterfalls3_1751126328233.jpg',
          '/attached_assets/Ouzoud-Waterfalls4_1751126328233.JPG'
        ];
      }
      
      // Ensure Hot Air Balloon has authentic flight photos
      if (transformed.name === 'Montgolfière (Hot Air Balloon)') {
        transformed.image = '/attached_assets/Hot Air Balloon Ride2_1751127701686.jpg';
        transformed.photos = [
          '/attached_assets/Hot Air Balloon Ride2_1751127701686.jpg',
          '/attached_assets/Hot Air Balloon Ride3_1751127701686.jpg',
          '/attached_assets/montgofliere_a_marrakech_1751127701687.jpg',
          '/attached_assets/montgolfiere-marrakech_1751127701687.jpg'
        ];
      }
      
      // Ensure Agafay Combo has authentic desert photos
      if (transformed.name === 'Agafay Combo') {
        transformed.image = '/attached_assets/agafaypack1_1751128022717.jpeg';
        transformed.photos = [
          '/attached_assets/agafaypack1_1751128022717.jpeg',
          '/attached_assets/agafaypack2_1751128022717.jpeg',
          '/attached_assets/agafaypack3_1751128022718.jpeg',
          '/attached_assets/agafaypack5_1751128022718.jpeg',
          '/attached_assets/agafaypack6_1751128022718.jpeg'
        ];
      }
      
        return transformed;
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      return inMemoryData.activities.filter(a => a.isActive);
    }
  }

  async getActivity(id: string): Promise<ActivityType | null> {
    if (this.useFallback) {
      return inMemoryData.activities.find(a => a._id === id) || null;
    }
    
    try {
      if (!this.isConnected) {
        return inMemoryData.activities.find(a => a._id === id) || null;
      }
      const activity = await Activity.findById(id);
      return this.transformDocument(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      return inMemoryData.activities.find(a => a._id === id) || null;
    }
  }

  async createActivity(activityData: InsertActivity): Promise<ActivityType> {
    if (this.useFallback) {
      const newActivity: ActivityType = {
        _id: Date.now().toString(),
        name: activityData.name,
        description: activityData.description,
        price: activityData.price,
        currency: activityData.currency || 'MAD',
        image: activityData.image,
        photos: activityData.photos,
        category: activityData.category,
        isActive: activityData.isActive ?? true,
        seasonalPricing: activityData.seasonalPricing,
        getyourguidePrice: activityData.getyourguidePrice,
        availability: activityData.availability,
        duration: activityData.duration,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.activities.push(newActivity);
      return newActivity;
    }
    
    const activity = new Activity(activityData);
    const savedActivity = await activity.save();
    return this.transformDocument(savedActivity);
  }

  async updateActivity(id: string, activityData: Partial<InsertActivity>): Promise<ActivityType | null> {
    if (this.useFallback) {
      const activityIndex = inMemoryData.activities.findIndex(a => a._id === id);
      if (activityIndex === -1) return null;
      
      const updatedActivity = {
        ...inMemoryData.activities[activityIndex],
        ...activityData,
        updatedAt: new Date()
      };
      inMemoryData.activities[activityIndex] = updatedActivity;
      return updatedActivity;
    }
    
    const activity = await Activity.findByIdAndUpdate(id, activityData, { new: true });
    return this.transformDocument(activity);
  }

  async deleteActivity(id: string): Promise<void> {
    if (this.useFallback) {
      const activityIndex = inMemoryData.activities.findIndex(a => a._id === id);
      if (activityIndex !== -1) {
        inMemoryData.activities.splice(activityIndex, 1);
      }
      return;
    }
    
    await Activity.findByIdAndDelete(id);
  }

  // Booking operations
  async getBookings(): Promise<BookingWithActivity[]> {
    if (this.useFallback) {
      return inMemoryData.bookings.map(booking => {
        const activity = inMemoryData.activities.find(a => a._id === booking.activityId);
        return {
          ...booking,
          activity: activity || undefined
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
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
    if (this.useFallback) {
      const booking = inMemoryData.bookings.find(b => b._id === id);
      if (!booking) return null;
      
      const activity = inMemoryData.activities.find(a => a._id === booking.activityId);
      return {
        ...booking,
        activity: activity || undefined
      };
    }
    
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
    if (this.useFallback) {
      const newBooking: BookingType = {
        _id: Date.now().toString(),
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        activityId: bookingData.activityId,
        numberOfPeople: bookingData.numberOfPeople,
        preferredDate: bookingData.preferredDate instanceof Date
          ? bookingData.preferredDate
          : new Date(bookingData.preferredDate),
        status: bookingData.status || 'pending',
        totalAmount: bookingData.totalAmount,
        notes: bookingData.notes,
        paymentStatus: bookingData.paymentStatus || 'unpaid',
        paymentMethod: bookingData.paymentMethod,
        paidAmount: bookingData.paidAmount || 0,
        depositAmount: bookingData.depositAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.bookings.push(newBooking);
      return newBooking;
    }
    
    const booking = new Booking({
      ...bookingData,
      preferredDate: bookingData.preferredDate instanceof Date
        ? bookingData.preferredDate
        : new Date(bookingData.preferredDate),
    });
    const savedBooking = await booking.save();
    return this.transformDocument(savedBooking);
  }

  async updateBookingStatus(id: string, status: string): Promise<BookingType | null> {
    if (this.useFallback) {
      const bookingIndex = inMemoryData.bookings.findIndex(b => b._id === id);
      if (bookingIndex === -1) return null;
      
      inMemoryData.bookings[bookingIndex].status = status;
      inMemoryData.bookings[bookingIndex].updatedAt = new Date();
      return inMemoryData.bookings[bookingIndex];
    }
    
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    return this.transformDocument(booking);
  }

  async updateBookingPayment(id: string, paymentData: {
    paymentStatus: BookingType['paymentStatus'];
    paidAmount: number;
    paymentMethod: NonNullable<BookingType['paymentMethod']>;
    depositAmount?: number;
  }): Promise<BookingType | null> {
    if (this.useFallback) {
      const bookingIndex = inMemoryData.bookings.findIndex(b => b._id === id);
      if (bookingIndex === -1) return null;
      
      inMemoryData.bookings[bookingIndex] = {
        ...inMemoryData.bookings[bookingIndex],
        ...paymentData,
        updatedAt: new Date()
      };
      return inMemoryData.bookings[bookingIndex];
    }
    
    const booking = await Booking.findByIdAndUpdate(id, paymentData, { new: true });
    return this.transformDocument(booking);
  }

  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLogType> {
    if (this.useFallback) {
      const newLog: AuditLogType = {
        _id: Date.now().toString(),
        userId: logData.userId,
        action: logData.action,
        details: logData.details,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.auditLogs.push(newLog);
      return newLog;
    }
    
    const log = new AuditLog(logData);
    const savedLog = await log.save();
    return this.transformDocument(savedLog);
  }

  async getAuditLogs(): Promise<AuditLogType[]> {
    if (this.useFallback) {
      return inMemoryData.auditLogs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);
    }
    
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return logs.map(log => this.transformDocument(log));
  }

  // Review operations
  async getReviews(activityId?: string): Promise<ReviewWithActivity[]> {
    if (this.useFallback) {
      const filteredReviews = activityId 
        ? inMemoryData.reviews.filter(r => r.activityId === activityId && r.approved)
        : inMemoryData.reviews.filter(r => r.approved);
      
      return filteredReviews.map(review => {
        const activity = inMemoryData.activities.find(a => a._id === review.activityId);
        return {
          ...review,
          activity: activity || undefined
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
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
    if (this.useFallback) {
      const review = inMemoryData.reviews.find(r => r._id === id);
      if (!review) return null;
      
      const activity = inMemoryData.activities.find(a => a._id === review.activityId);
      return {
        ...review,
        activity: activity || undefined
      };
    }
    
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
    if (this.useFallback) {
      const newReview: ReviewType = {
        _id: Date.now().toString(),
        customerName: reviewData.customerName,
        customerEmail: reviewData.customerEmail,
        activityId: reviewData.activityId,
        bookingId: reviewData.bookingId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        verified: reviewData.verified ?? false,
        approved: reviewData.approved ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.reviews.push(newReview);
      return newReview;
    }
    
    const review = new Review(reviewData);
    const savedReview = await review.save();
    return this.transformDocument(savedReview);
  }

  async updateReviewApproval(id: string, approved: boolean): Promise<ReviewType | null> {
    if (this.useFallback) {
      const reviewIndex = inMemoryData.reviews.findIndex(r => r._id === id);
      if (reviewIndex === -1) return null;
      
      inMemoryData.reviews[reviewIndex].approved = approved;
      inMemoryData.reviews[reviewIndex].updatedAt = new Date();
      return inMemoryData.reviews[reviewIndex];
    }
    
    const review = await Review.findByIdAndUpdate(id, { approved }, { new: true });
    return this.transformDocument(review);
  }

  async getActivityRating(activityId: string): Promise<{ averageRating: number; totalReviews: number }> {
    if (this.useFallback) {
      const reviews = inMemoryData.reviews.filter(r => r.activityId === activityId && r.approved);
      const totalReviews = reviews.length;
      
      if (totalReviews === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;
      
      return { averageRating, totalReviews };
    }
    
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
      if (this.useFallback) {
        console.log('Using fallback mode - skipping MongoDB seeding');
        return;
      }

      if (DEFAULT_ADMIN_PASSWORD) {
        const adminUsers = [
          { username: 'nadia', role: 'superadmin' },
          { username: 'ahmed', role: 'admin' },
          { username: 'yahia', role: 'admin' },
        ];

        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

        for (const userData of adminUsers) {
          const existingUser = await User.findOne({ username: userData.username });
          if (!existingUser) {
            await User.create({
              ...userData,
              password: hashedPassword,
            });
            console.log(`✅ Created admin user: ${userData.username}`);
          }
        }
      } else {
        console.warn('ADMIN_DEFAULT_PASSWORD not set. Skipping admin user seeding.');
      }

      // Skip activity seeding - use existing database with authentic photos
      const activityCount = await Activity.countDocuments();
      console.log(`Found ${activityCount} existing activities in database`);
      if (activityCount === 0) {
        const activities = [
          {
            name: "Montgolfière (Hot Air Balloon)",
            description: "Experience the magic of Marrakech from above with a sunrise hot air balloon ride over the Atlas Mountains and traditional Berber villages.",
            price: "1100",
            currency: "MAD",
            image: "/images/balloon-ride.jpg",
            category: "Adventure",
            isActive: true,
            availability: "Daily at sunrise (6:00 AM)"
          },
          {
            name: "Agafay Combo",
            description: "Complete Agafay Desert experience with camel riding, quad biking, traditional dinner under the stars, and sunset views.",
            price: "450",
            currency: "MAD",
            image: "/images/agafay-combo.jpg",
            category: "Adventure",
            isActive: true,
            availability: "Daily departures"
          },
          {
            name: "Essaouira Day Trip",
            description: "Discover the coastal charm of Essaouira with its historic medina, fishing port, and beautiful Atlantic beaches.",
            price: "200",
            currency: "MAD",
            image: "/attached_assets/Essaouira Day Trip1_1751124502666.jpg",
            photos: [
              "/attached_assets/Essaouira Day Trip1_1751124502666.jpg",
              "/attached_assets/Essaouira day trip 3_1751122022832.jpg",
              "/attached_assets/Essaouira day trip 4_1751122022833.jpg",
              "/attached_assets/Essaouira Day Trip_1751122022833.jpg",
              "/attached_assets/Essaouira Day Trip2_1751122022833.jpg"
            ],
            category: "Day Trips",
            isActive: true,
            availability: "Daily 8:00 AM - 7:00 PM"
          },
          {
            name: "Ouzoud Waterfalls Day Trip",
            description: "Visit Morocco's most spectacular waterfalls with 110-meter cascades, rainbow views, and Barbary macaque encounters.",
            price: "200",
            currency: "MAD",
            image: "/images/ouzoud-waterfalls.jpg",
            category: "Nature",
            isActive: true,
            availability: "Daily 8:00 AM - 6:00 PM"
          },
          {
            name: "Ourika Valley Day Trip",
            description: "Discover the stunning Ourika Valley with its colorful Berber villages, flowing rivers, snow-capped Atlas Mountains, and authentic local culture.",
            price: "150",
            currency: "MAD",
            image: "/attached_assets/Ourika-Valley-day-trip-from-Marrakech_1751119268337.jpg",
            photos: [
              "/attached_assets/ourika valley3_1751119268336.jpg",
              "/attached_assets/Ourika-Valley-day-trip-from-Marrakech_1751119268337.jpg",
              "/attached_assets/Ourika-valley-day-trip-from-marrakech-1_1751119268337.jpg",
              "/attached_assets/ourika-valley-1_1751119268337.jpeg",
              "/attached_assets/ourika-valley-marrakech_1751119268337.jpg"
            ],
            category: "Day Trips",
            isActive: true,
            availability: "Daily 9:00 AM - 5:00 PM"
          }
        ];

        await Activity.insertMany(activities);
        console.log(`✅ Created ${activities.length} initial activities`);
      }

      console.log('✅ MongoDB seed data initialized successfully');
    } catch (error) {
      console.error('❌ Error seeding data:', error);
    }
  }

  // Analytics methods
  async getEarningsAnalytics(): Promise<any> {
    if (this.useFallback) {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const currentMonthBookings = inMemoryData.bookings.filter(booking => 
        booking.createdAt >= currentMonth && 
        (booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid')
      );
      
      const lastMonthBookings = inMemoryData.bookings.filter(booking => 
        booking.createdAt >= lastMonth && 
        booking.createdAt < currentMonth && 
        (booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid')
      );
      
      const currentMonthTotal = currentMonthBookings.reduce((sum, booking) => sum + booking.paidAmount, 0);
      const lastMonthTotal = lastMonthBookings.reduce((sum, booking) => sum + booking.paidAmount, 0);
      
      return {
        currentMonth: currentMonthTotal,
        lastMonth: lastMonthTotal,
        currency: 'MAD'
      };
    }
    
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
    if (this.useFallback) {
      const activities = inMemoryData.activities.filter(a => a.isActive);
      return activities.map(activity => {
        const bookingCount = inMemoryData.bookings.filter(b => b.activityId === activity._id).length;
        return {
          ...activity,
          bookingCount
        };
      });
    }
    
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
    if (this.useFallback) {
      const totalBookings = inMemoryData.bookings.length;
      const pendingBookings = inMemoryData.bookings.filter(b => b.status === 'pending').length;
      const confirmedBookings = inMemoryData.bookings.filter(b => b.status === 'confirmed').length;
      
      return {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: totalBookings - pendingBookings - confirmedBookings
      };
    }
    
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
    if (this.useFallback) {
      return inMemoryData.activities.filter(a => a.isActive);
    }
    
    const activities = await Activity.find({ isActive: true });
    return activities.map(activity => this.transformDocument(activity));
  }

  async updateActivityGetYourGuidePrice(id: string, price: number): Promise<ActivityType | null> {
    if (this.useFallback) {
      const activityIndex = inMemoryData.activities.findIndex(a => a._id === id);
      if (activityIndex === -1) return null;
      
      inMemoryData.activities[activityIndex].getyourguidePrice = price;
      inMemoryData.activities[activityIndex].updatedAt = new Date();
      return inMemoryData.activities[activityIndex];
    }
    
    const activity = await Activity.findByIdAndUpdate(id, { getyourguidePrice: price }, { new: true });
    return this.transformDocument(activity);
  }
}

export const storage = new MongoStorage();
