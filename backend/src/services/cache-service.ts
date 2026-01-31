/**
 * Cache Service - Redis-based caching for API responses
 */

import { RedisClientType } from 'redis';

export class CacheService {
  private defaultTTL = 300; // 5 minutes

  constructor(private redis: RedisClientType) {}

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), {
        EX: ttl || this.defaultTTL,
      });
    } catch {
      // Cache failures should not break the app
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      // Silent fail
    }
  }

  /**
   * Invalidate all cache keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch {
      // Silent fail
    }
  }
}
