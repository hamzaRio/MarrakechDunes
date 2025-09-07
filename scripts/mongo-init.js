// MongoDB initialization script for Docker
// This helps standardize database setup across environments

db = db.getSiblingDB('marrakechdunes');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('activities');
db.createCollection('bookings');
db.createCollection('reviews');
db.createCollection('audit_logs');
db.createCollection('sessions');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.activities.createIndex({ "isActive": 1 });
db.activities.createIndex({ "category": 1 });
db.bookings.createIndex({ "activityId": 1 });
db.bookings.createIndex({ "status": 1 });
db.bookings.createIndex({ "createdAt": -1 });
db.reviews.createIndex({ "activityId": 1 });
db.reviews.createIndex({ "approved": 1 });
db.audit_logs.createIndex({ "userId": 1 });
db.audit_logs.createIndex({ "createdAt": -1 });
db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

print('✅ MongoDB database initialized successfully');
