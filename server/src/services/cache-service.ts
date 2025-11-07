// Redis removed - using in-memory cache only

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
    // Using in-memory cache only (Redis removed)
    console.log('✅ Cache service initialized - using in-memory cache');
  }

  private getKey(type: string, identifier: string): string {
    return `marrakechdunes:${type}:${identifier}`;
  }

  // In-memory cache only
  async get<T>(type: string, identifier: string): Promise<T | null> {
    const key = this.getKey(type, identifier);
    
    // Memory cache
    const memoryData = this.getFromMemoryCache<T>(key);
    if (memoryData) {
      this.stats.hits++;
      return memoryData;
    }

    this.stats.misses++;
    return null;
  }

  async set(type: string, identifier: string, data: any, ttl?: number): Promise<boolean> {
    const key = this.getKey(type, identifier);
    const ttlSeconds = ttl || this.config[type as keyof CacheConfig] || 3600;
    
    // Store in memory cache
    this.setInMemoryCache(key, data, ttlSeconds);
    this.stats.sets++;
    return true;
  }

  async del(type: string, identifier: string): Promise<boolean> {
    try {
      const key = this.getKey(type, identifier);
      this.memoryCache.delete(key);
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const prefix = `marrakechdunes:${pattern}`;
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📦 Cache hit: ${type}:${identifier}`);
      }
      return cached;
    }

    // Fetch from database
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Cache miss: ${type}:${identifier} - fetching from database`);
    }
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
    
    // Memory cache entries already deleted above
    
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
        stats
      }
    };
  }

  async disconnect(): Promise<void> {
    this.memoryCache.clear();
  }
}

export const cacheService = new CacheService();
