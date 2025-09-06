import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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
    image: { type: String, required: true },
    photos: [{ type: String }],
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    seasonalPricing: { type: mongoose.Schema.Types.Mixed },
    getyourguidePrice: { type: Number },
    availability: { type: String },
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
class MongoStorage {
    constructor() {
        // Database connection is handled separately in db.ts
        // This class assumes MongoDB is already connected
    }
    transformDocument(doc) {
        if (!doc)
            return null;
        const obj = doc.toObject ? doc.toObject() : doc;
        obj._id = obj._id.toString();
        obj.id = obj._id;
        return obj;
    }
    // User operations
    async getUser(id) {
        try {
            const user = await User.findById(id);
            return this.transformDocument(user);
        }
        catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }
    async getUserByUsername(username) {
        try {
            const user = await User.findOne({ username });
            return this.transformDocument(user);
        }
        catch (error) {
            console.error('Error fetching user by username:', error);
            return null;
        }
    }
    async createUser(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
            ...userData,
            password: hashedPassword,
        });
        const savedUser = await user.save();
        return this.transformDocument(savedUser);
    }
    // Activity operations
    async getActivities() {
        try {
            const activities = await Activity.find({ isActive: true });
            return activities.map(activity => this.transformDocument(activity));
        }
        catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    }
    async getActivity(id) {
        try {
            const activity = await Activity.findById(id);
            return this.transformDocument(activity);
        }
        catch (error) {
            console.error('Error fetching activity:', error);
            throw error;
        }
    }
    async createActivity(activityData) {
        const activity = new Activity(activityData);
        const savedActivity = await activity.save();
        return this.transformDocument(savedActivity);
    }
    async updateActivity(id, activityData) {
        const activity = await Activity.findByIdAndUpdate(id, activityData, { new: true });
        return this.transformDocument(activity);
    }
    async deleteActivity(id) {
        await Activity.findByIdAndDelete(id);
    }
    // Booking operations
    async getBookings() {
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
    async getBooking(id) {
        const booking = await Booking.findById(id).populate('activityId');
        if (!booking)
            return null;
        const bookingObj = this.transformDocument(booking);
        if (bookingObj.activityId && typeof bookingObj.activityId === 'object') {
            bookingObj.activity = this.transformDocument(bookingObj.activityId);
            bookingObj.activityId = bookingObj.activity._id;
        }
        return bookingObj;
    }
    async createBooking(bookingData) {
        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();
        return this.transformDocument(savedBooking);
    }
    async updateBookingStatus(id, status) {
        const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
        return this.transformDocument(booking);
    }
    async updateBookingPayment(id, paymentData) {
        const booking = await Booking.findByIdAndUpdate(id, paymentData, { new: true });
        return this.transformDocument(booking);
    }
    // Audit log operations
    async createAuditLog(logData) {
        const log = new AuditLog(logData);
        const savedLog = await log.save();
        return this.transformDocument(savedLog);
    }
    async getAuditLogs() {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        return logs.map(log => this.transformDocument(log));
    }
    // Review operations
    async getReviews(activityId) {
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
    async getReview(id) {
        const review = await Review.findById(id).populate('activityId');
        if (!review)
            return null;
        const reviewObj = this.transformDocument(review);
        if (reviewObj.activityId && typeof reviewObj.activityId === 'object') {
            reviewObj.activity = this.transformDocument(reviewObj.activityId);
            reviewObj.activityId = reviewObj.activity._id;
        }
        return reviewObj;
    }
    async createReview(reviewData) {
        const review = new Review(reviewData);
        const savedReview = await review.save();
        return this.transformDocument(savedReview);
    }
    async updateReviewApproval(id, approved) {
        const review = await Review.findByIdAndUpdate(id, { approved }, { new: true });
        return this.transformDocument(review);
    }
    async getActivityRating(activityId) {
        const reviews = await Review.find({ activityId, approved: true });
        const totalReviews = reviews.length;
        if (totalReviews === 0) {
            return { averageRating: 0, totalReviews: 0 };
        }
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / totalReviews;
        return { averageRating, totalReviews };
    }
    async seedInitialData() {
        try {
            // Test MongoDB connection before proceeding
            if (mongoose.connection.db) {
                await mongoose.connection.db.admin().ping();
            }
            else {
                throw new Error('Database connection not available');
            }
            // Validate required environment variables for admin users
            if (!process.env.SUPERADMIN_PASSWORD) {
                throw new Error('SUPERADMIN_PASSWORD environment variable is required');
            }
            if (!process.env.ADMIN_PASSWORD) {
                throw new Error('ADMIN_PASSWORD environment variable is required');
            }
            // Create admin users if they don't exist
            const adminUsers = [
                { username: 'nadia', password: process.env.SUPERADMIN_PASSWORD, role: 'superadmin' },
                { username: 'ahmed', password: process.env.ADMIN_PASSWORD, role: 'admin' },
                { username: 'yahia', password: process.env.ADMIN_PASSWORD, role: 'admin' },
            ];
            for (const userData of adminUsers) {
                const existingUser = await User.findOne({ username: userData.username });
                if (!existingUser) {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    await User.create({
                        ...userData,
                        password: hashedPassword,
                    });
                    console.log(`✅ Created admin user: ${userData.username}`);
                }
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
                        image: "/assets/Essaouira Day Trip1_1751124502666.jpg",
                        photos: [
                            "/assets/Essaouira Day Trip1_1751124502666.jpg",
                            "/assets/Essaouira day trip 3_1751122022832.jpg",
                            "/assets/Essaouira day trip 4_1751122022833.jpg",
                            "/assets/Essaouira Day Trip_1751122022833.jpg",
                            "/assets/Essaouira Day Trip2_1751122022833.jpg"
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
                        image: "/assets/Ourika-Valley-day-trip-from-Marrakech_1751119268337.jpg",
                        photos: [
                            "/assets/ourika valley3_1751119268336.jpg",
                            "/assets/Ourika-Valley-day-trip-from-Marrakech_1751119268337.jpg",
                            "/assets/Ourika-valley-day-trip-from-marrakech-1_1751119268337.jpg",
                            "/assets/ourika-valley-1_1751119268337.jpeg",
                            "/assets/ourika-valley-marrakech_1751119268337.jpg"
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
        }
        catch (error) {
            console.error('❌ Error seeding data:', error);
        }
    }
    // Analytics methods
    async getEarningsAnalytics() {
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
    async getActivityAnalytics() {
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
    async getBookingAnalytics() {
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
    async getGetYourGuidePriceComparison() {
        const activities = await Activity.find({ isActive: true });
        return activities.map(activity => this.transformDocument(activity));
    }
    async updateActivityGetYourGuidePrice(id, price) {
        const activity = await Activity.findByIdAndUpdate(id, { getyourguidePrice: price }, { new: true });
        return this.transformDocument(activity);
    }
}
export const storage = new MongoStorage();
