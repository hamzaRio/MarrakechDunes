import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  activities: number; // TTL in seconds
  bookings: number;
  adminData: number;
  marketIntelligence: number;
  userSessions: number;
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private config: CacheConfig;

  constructor() {
    this.config = {
      activities: 3600, // 1 hour
      bookings: 300,    // 5 minutes
      adminData: 1800,  // 30 minutes
      marketIntelligence: 7200, // 2 hours
      userSessions: 86400 // 24 hours
    };
  }

  async connect(): Promise<void> {
    try {
      // Only connect to Redis in production or if REDIS_URL is provided
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000
          }
        });

        this.client.on('error', (err) => {
          console.warn('⚠️ Redis connection error:', err.message);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis connected - caching enabled');
          this.isConnected = true;
        });

        this.client.on('disconnect', () => {
          console.warn('⚠️ Redis disconnected - caching disabled');
          this.isConnected = false;
        });

        await this.client.connect();
      } else {
        console.log('📝 Redis not configured - using in-memory fallback');
        this.isConnected = false;
      }
    } catch (error) {
      console.warn('⚠️ Redis connection failed - using in-memory fallback:', error);
      this.isConnected = false;
    }
  }

  private getKey(type: string, identifier: string): string {
    return `marrakechdunes:${type}:${identifier}`;
  }

  async get<T>(type: string, identifier: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = this.getKey(type, identifier);
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set(type: string, identifier: string, data: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = this.getKey(type, identifier);
      const ttlSeconds = ttl || this.config[type as keyof CacheConfig] || 3600;
      
      await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Cache set error:', error);
      return false;
    }
  }

  async del(type: string, identifier: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = this.getKey(type, identifier);
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(`marrakechdunes:${pattern}`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.warn('Cache pattern invalidation error:', error);
      return false;
    }
  }

  // Cache wrapper for database operations
  async withCache<T>(
    type: string,
    identifier: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(type, identifier);
    if (cached) {
      console.log(`📦 Cache hit: ${type}:${identifier}`);
      return cached;
    }

    // Fetch from database
    console.log(`🔍 Cache miss: ${type}:${identifier} - fetching from database`);
    const data = await fetchFn();
    
    // Store in cache
    await this.set(type, identifier, data, ttl);
    
    return data;
  }

  // Specific cache methods for common operations
  async getActivities(): Promise<any[] | null> {
    return this.get('activities', 'all');
  }

  async setActivities(activities: any[]): Promise<boolean> {
    return this.set('activities', 'all', activities);
  }

  async getBookings(): Promise<any[] | null> {
    return this.get('bookings', 'all');
  }

  async setBookings(bookings: any[]): Promise<boolean> {
    return this.set('bookings', 'all', bookings);
  }

  async getAdminData(userId: string): Promise<any | null> {
    return this.get('adminData', userId);
  }

  async setAdminData(userId: string, data: any): Promise<boolean> {
    return this.set('adminData', userId, data);
  }

  async invalidateActivities(): Promise<boolean> {
    return this.invalidatePattern('activities:*');
  }

  async invalidateBookings(): Promise<boolean> {
    return this.invalidatePattern('bookings:*');
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export const cacheService = new CacheService();
