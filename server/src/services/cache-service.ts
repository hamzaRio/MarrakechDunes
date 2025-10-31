import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  activities: number; // TTL in seconds
  bookings: number;
  adminData: number;
  marketIntelligence: number;
  userSessions: number;
  pricing: number;
  recommendations: number;
  analytics: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private config: CacheConfig;
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };

  constructor() {
    this.config = {
      activities: 3600, // 1 hour
      bookings: 300,    // 5 minutes
      adminData: 1800,  // 30 minutes
      marketIntelligence: 7200, // 2 hours
      userSessions: 86400, // 24 hours
      pricing: 1800, // 30 minutes
      recommendations: 3600, // 1 hour
      analytics: 600 // 10 minutes
    };
    
    // Clean up expired memory cache entries every 5 minutes
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
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

  // Multi-layer cache: Memory -> Redis -> Database
  async get<T>(type: string, identifier: string): Promise<T | null> {
    const key = this.getKey(type, identifier);
    
    // L1: Memory cache (fastest)
    const memoryData = this.getFromMemoryCache<T>(key);
    if (memoryData) {
      this.stats.hits++;
      return memoryData;
    }

    // L2: Redis cache (fast)
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Store in memory cache for faster future access
          this.setInMemoryCache(key, parsed, this.config[type as keyof CacheConfig] || 3600);
          this.stats.hits++;
          return parsed;
        }
      } catch (error) {
        console.warn('Redis cache get error:', error);
        this.stats.errors++;
      }
    }

    this.stats.misses++;
    return null;
  }

  async set(type: string, identifier: string, data: any, ttl?: number): Promise<boolean> {
    const key = this.getKey(type, identifier);
    const ttlSeconds = ttl || this.config[type as keyof CacheConfig] || 3600;
    
    // L1: Store in memory cache
    this.setInMemoryCache(key, data, ttlSeconds);
    
    // L2: Store in Redis cache
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
        this.stats.sets++;
        return true;
      } catch (error) {
        console.warn('Redis cache set error:', error);
        this.stats.errors++;
        return false;
      }
    }
    
    this.stats.sets++;
    return true; // Memory cache always works
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

  // Smart cache invalidation - invalidate related caches when data changes
  async invalidateRelated(type: string, id: string): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    if (type === 'booking') {
      // Invalidate booking-specific caches
      keysToInvalidate.push(this.getKey('bookings', 'all'));
      keysToInvalidate.push(this.getKey('analytics', 'earnings'));
      keysToInvalidate.push(this.getKey('analytics', 'revenue-all'));
      keysToInvalidate.push(this.getKey('analytics', `activity-${id}`));
      
      // Also invalidate pattern-based caches
      await this.invalidatePattern('bookings:*');
      await this.invalidatePattern('analytics:revenue-*');
    }
    
    if (type === 'activity') {
      // Invalidate activity-specific caches
      keysToInvalidate.push(this.getKey('activities', 'all'));
      keysToInvalidate.push(this.getKey('activities', id));
      keysToInvalidate.push(this.getKey('pricing', id));
      keysToInvalidate.push(this.getKey('analytics', 'activity'));
      
      // Also invalidate bookings since they reference activities
      keysToInvalidate.push(this.getKey('bookings', 'all'));
      
      await this.invalidatePattern('activities:*');
      await this.invalidatePattern('pricing:*');
    }
    
    // Delete memory cache entries
    for (const key of keysToInvalidate) {
      this.memoryCache.delete(key);
    }
    
    // Delete Redis cache entries
    if (this.isConnected && this.client && keysToInvalidate.length > 0) {
      try {
        await this.client.del(keysToInvalidate);
      } catch (error) {
        console.warn('Cache invalidation error:', error);
      }
    }
    
    this.stats.deletes += keysToInvalidate.length;
  }

  // Memory cache helpers
  private getFromMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.data;
    }
    if (entry) {
      this.memoryCache.delete(key); // Remove expired entry
    }
    return null;
  }

  private setInMemoryCache(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.memoryCache.set(key, { data, expires });
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Advanced cache methods
  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async clearStats(): Promise<void> {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
  }

  async getMemoryCacheSize(): Promise<number> {
    return this.memoryCache.size;
  }

  async clearMemoryCache(): Promise<void> {
    this.memoryCache.clear();
  }

  // Batch operations for better performance
  async mget<T>(keys: Array<{ type: string; identifier: string }>): Promise<Array<T | null>> {
    const results: Array<T | null> = [];
    
    for (const { type, identifier } of keys) {
      const data = await this.get<T>(type, identifier);
      results.push(data);
    }
    
    return results;
  }

  async mset(items: Array<{ type: string; identifier: string; data: any; ttl?: number }>): Promise<boolean> {
    const promises = items.map(({ type, identifier, data, ttl }) => 
      this.set(type, identifier, data, ttl)
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result);
  }

  // Cache warming for critical data
  async warmCache(): Promise<void> {
    console.log('🔥 Warming cache with critical data...');
    
    // This would be called during startup to pre-load critical data
    // Implementation depends on your specific needs
  }

  // Cache health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const memorySize = this.memoryCache.size;
    const stats = await this.getStats();
    const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!this.isConnected) {
      status = 'degraded';
    }
    
    if (hitRate < 0.5) {
      status = 'degraded';
    }
    
    if (stats.errors > stats.sets * 0.1) {
      status = 'unhealthy';
    }
    
    return {
      status,
      details: {
        memorySize,
        hitRate: Math.round(hitRate * 100),
        stats,
        redisConnected: this.isConnected
      }
    };
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
    this.memoryCache.clear();
  }
}

export const cacheService = new CacheService();
