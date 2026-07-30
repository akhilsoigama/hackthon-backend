/**
 * api_cache_service.ts — Redis-backed drop-in replacement.
 *
 * BEFORE: In-memory Map<string, CacheEntry> — lost on restart, not shared across instances,
 *         accumulates in Node.js heap causing memory pressure.
 *
 * AFTER:  Delegates to RedisCacheService (app/shared/cache/RedisCache.ts) which uses
 *         Redis SETEX with automatic TTL expiry. Falls back to in-memory transparently
 *         when Redis is unavailable (local dev without Redis).
 *
 * All existing callers work with zero changes — the interface is identical.
 */

import redisCacheService from '#shared/cache/RedisCache'

class ApiCacheService {
  /**
   * Get a cached value or compute and store it.
   * TTL is in milliseconds (same as the previous in-memory interface).
   */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>,
    tags: string[] = []
  ): Promise<T> {
    return redisCacheService.getOrSet(key, ttlMs, producer, tags)
  }

  /**
   * Invalidate all keys with the given prefix.
   * Uses Redis KEYS pattern — suitable for low-to-medium frequency invalidation.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    return redisCacheService.invalidateByPrefix(prefix)
  }

  /**
   * Invalidate all keys associated with any of the given tags.
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    return redisCacheService.invalidateByTags(tags)
  }

  /**
   * Explicitly cache a value.
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    return redisCacheService.set(key, value, ttlMs)
  }

  /**
   * Delete a single cache key.
   */
  async del(key: string): Promise<void> {
    return redisCacheService.del(key)
  }
}

const apiCacheService = new ApiCacheService()

export default apiCacheService
