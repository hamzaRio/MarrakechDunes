import mongoose from 'mongoose';
export async function connectToDatabase() {
    // Check for required environment variable
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required but not set.');
        console.error('Please set DATABASE_URL to your MongoDB connection string.');
        process.exit(1);
    }
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Clear any existing connections
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }
            console.log(`🔄 Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})...`);
            // Connect to MongoDB with enhanced options for production reliability
            await mongoose.connect(process.env.DATABASE_URL, {
                maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10,
                minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 15000,
                connectTimeoutMS: 10000,
                family: 4, // Force IPv4 resolution
                // Enhanced options for better reliability
                bufferCommands: false,
                autoIndex: true,
                autoCreate: true,
                // Additional production optimizations
                maxIdleTimeMS: 30000,
                heartbeatFrequencyMS: 10000,
                // Retry configuration
                retryReads: true,
                retryWrites: true,
                // Write concern for better durability
                writeConcern: {
                    w: 'majority',
                    j: true,
                    wtimeout: 10000
                }
            });
            console.log('✅ Connected to MongoDB Atlas');
            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                // Don't exit immediately, let the reconnection logic handle it
            });
            mongoose.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
            });
            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
            });
            return; // Success, exit the retry loop
        }
        catch (error) {
            console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                console.error('❌ Failed after all attempts. Exiting...');
                process.exit(1);
            }
            console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}
export async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB Atlas');
    }
    catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
}
