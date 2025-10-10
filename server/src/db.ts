import mongoose from 'mongoose';
import { resolveDatabaseUrl, getRedactedDatabaseUrl } from './utils/database-url.js';

export async function connectToDatabase(): Promise<void> {
  let databaseUrl: string;

  try {
    databaseUrl = resolveDatabaseUrl();
  } catch (error) {
    console.error('[db] DATABASE_URL environment variable is required but missing or invalid.');
    if (error instanceof Error) {
      console.error(`[db] ${error.message}`);
    }
    
    // For development, try to use a default MongoDB URL
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[db] Attempting to use default MongoDB URL for development...');
      databaseUrl = 'mongodb://localhost:27017/marrakechdunes';
    } else {
      process.exit(1);
    }
  }

  const redactedDatabaseUrl = getRedactedDatabaseUrl(databaseUrl);
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      console.log(`[db] Attempting MongoDB connection (${attempt}/${maxRetries}) using ${redactedDatabaseUrl}`);

      await mongoose.connect(databaseUrl, {
        maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10, // Increased for better performance
        minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 1,   // Maintain connections during low season
        serverSelectionTimeoutMS: 5000,  // Reduced for faster failover
        socketTimeoutMS: 45000,          // Increased for long-running operations
        connectTimeoutMS: 10000,
        family: 4,
        bufferCommands: false,
        autoIndex: true,
        autoCreate: true,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryReads: true,
        retryWrites: true,
        writeConcern: {
          w: 'majority',
          j: true,
          wtimeout: 10000,
        },
        // Additional performance optimizations
        readPreference: 'primary', // Changed from 'secondaryPreferred' to 'primary' to allow index creation
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
      });

      console.log('[db] Connected to MongoDB - ready for tour bookings');

      mongoose.connection.on('error', (error) => {
        console.error('[db] MongoDB connection error - tour bookings may be affected:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[db] MongoDB disconnected - retrying for tour business continuity');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[db] MongoDB reconnected - tour booking system restored');
      });

      // Tour business performance monitoring
      mongoose.connection.on('connected', () => {
        console.log('[db] MongoDB connected - ready for tour bookings');
      });

      return;
    } catch (error) {
      console.error(`[db] MongoDB connection attempt ${attempt} failed`, error);

      if (attempt === maxRetries) {
        console.error('[db] Failed to connect to MongoDB after all attempts. Exiting.');
        process.exit(1);
      }

      console.log(`[db] Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[db] Disconnected from MongoDB');
  } catch (error) {
    console.error('[db] Error disconnecting from MongoDB:', error);
  }
}
