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
    process.exit(1);
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
        maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10,
        minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 15000,
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
      });

      console.log('[db] Connected to MongoDB');

      mongoose.connection.on('error', (error) => {
        console.error('[db] MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[db] MongoDB disconnected - retrying');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[db] MongoDB reconnected');
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
