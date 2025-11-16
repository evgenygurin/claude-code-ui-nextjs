/**
 * Cache Service
 *
 * Provides caching layer with Redis support and in-memory fallback
 * Includes TTL, invalidation, and performance monitoring
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for bulk invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheServiceClass {
  private cache: Map<string, { value: any; expires: number; tags: string[] }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };
  private redis: any = null;
  private useRedis = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Only initialize Redis if configured
    if (process.env.REDIS_URL) {
      try {
        // Dynamic import to avoid loading Redis if not needed
        const { createClient } = require('redis');
        this.redis = createClient({ url: process.env.REDIS_URL });

        await this.redis.connect();
        this.useRedis = true;
        console.log('✅ Redis cache connected');
      } catch (error) {
        console.warn('⚠️ Redis not available, using in-memory cache:', error);
        this.useRedis = false;
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (this.useRedis && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          this.stats.hits++;
          this.updateHitRate();
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Fallback to in-memory cache
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      this.stats.hits++;
      this.updateHitRate();
      return cached.value;
    }

    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300; // Default 5 minutes
    const tags = options.tags || [];

    if (this.useRedis && this.redis) {
      try {
        await this.redis.setEx(key, ttl, JSON.stringify(value));

        // Store tags separately for invalidation
        if (tags.length > 0) {
          for (const tag of tags) {
            await this.redis.sAdd(`tag:${tag}`, key);
            await this.redis.expire(`tag:${tag}`, ttl);
          }
        }

        this.stats.sets++;
        return;
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    // Fallback to in-memory cache
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
      tags,
    });

    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(key);
        this.stats.deletes++;
        return;
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    this.cache.delete(key);
    this.stats.deletes++;
  }

  /**
   * Clear all cached values with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.sMembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
        }
        return;
      } catch (error) {
        console.error('Redis invalidate error:', error);
      }
    }

    // Fallback to in-memory cache
    for (const [key, value] of this.cache.entries()) {
      if (value.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.flushDb();
        return;
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Get cached value or compute and cache it
   */
  async getOrSet<T = any>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        console.error('Redis exists error:', error);
      }
    }

    const cached = this.cache.get(key);
    return cached !== undefined && cached.expires > Date.now();
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    if (this.useRedis && this.redis) {
      try {
        return await this.redis.ttl(key);
      } catch (error) {
        console.error('Redis TTL error:', error);
      }
    }

    const cached = this.cache.get(key);
    if (!cached) return -1;

    const remaining = cached.expires - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Clean up expired entries (for in-memory cache)
   */
  cleanup(): void {
    if (this.useRedis) return; // Redis handles expiration automatically

    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const CacheService = new CacheServiceClass();

// Run cleanup every 5 minutes for in-memory cache
if (typeof window === 'undefined') {
  setInterval(() => {
    CacheService.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  metrics: {
    overview: () => 'metrics:overview',
    sentry: (period?: string) => `metrics:sentry:${period || 'default'}`,
    cicd: (period?: string) => `metrics:cicd:${period || 'default'}`,
    conflicts: (period?: string) => `metrics:conflicts:${period || 'default'}`,
    timeline: (period?: string) => `metrics:timeline:${period || 'default'}`,
    systemHealth: () => 'metrics:system-health',
  },
  reports: {
    history: (page: number, filters: string) => `reports:history:${page}:${filters}`,
    scheduled: () => 'reports:scheduled',
    report: (id: string) => `reports:${id}`,
  },
  user: {
    notifications: (userId: string) => `user:${userId}:notifications`,
    preferences: (userId: string) => `user:${userId}:preferences`,
  },
};
