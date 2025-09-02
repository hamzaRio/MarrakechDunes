import mongoose from 'mongoose';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required but not set.');
  console.error('Please set DATABASE_URL to your MongoDB connection string.');
  process.exit(1);
}

export async function connectToDatabase(): Promise<void> {
  try {
    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to MongoDB with proper options
    await mongoose.connect(process.env.DATABASE_URL, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 10000,
      family: 4
    });

    console.log('✅ Connected to MongoDB Atlas');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}
