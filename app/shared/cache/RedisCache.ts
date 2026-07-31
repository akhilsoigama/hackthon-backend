// Redis-backed cache service — drop-in replacement for the in-memory ApiCacheService.
// Falls back gracefully to a no-op if Redis is unavailable (development without Redis).
//
// The interface intentionally mirrors the existing api_cache_service.ts so existing
// callers can be migrated with a one-line import change.

import { createClient, type RedisClientType } from 'redis'
import env from '#start/env'

const REDIS_URL = env.get('REDIS_URL', 'redis://127.0.0.1:6379')

class RedisCacheService {
  private client: RedisClientType | null = null
  private connected = false
  private connecting = false

  private async getClient(): Promise<RedisClientType | null> {
    if (this.connected && this.client) return this.client
    if (this.connecting) return null
    if (this.client) return this.client

    try {
      this.connecting = true
      this.client = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: 3000, // 3 seconds timeout
          reconnectStrategy: false, // Fail fast on initial connection
        },
      }) as RedisClientType

      this.client.on('error', (err: Error) => {
        // Log but don't crash — fall through to no-op
        console.error('[REDIS_CACHE] Connection error:', err.message)
        this.connected = false
      })

      this.client.on('connect', () => {
        this.connected = true
      })

      await this.client.connect()
      this.connected = true
    } catch (err) {
      console.error('[REDIS_CACHE] Failed to connect, cache disabled:', (err as Error).message)
      this.client = null
      this.connected = false
    } finally {
      this.connecting = false
    }

    return this.client
  }

  /**
   * Get a value from cache, or compute and store it.
   *
   * @param key       Cache key
   * @param ttlMs     Time-to-live in milliseconds
   * @param producer  Async function that produces the value on cache miss
   * @param _tags     Tag array (used for invalidation grouping — stored as Redis sets)
   */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>,
    _tags: string[] = []
  ): Promise<T> {
    const redis = await this.getClient()

    if (redis) {
      try {
        const cached = await redis.get(key)
        if (cached !== null) {
          return JSON.parse(cached) as T
        }
      } catch {
        // Cache miss or parse error — fall through to produce
      }
    }

    const value = await producer()

    if (redis && ttlMs > 0) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000)
        await redis.setEx(key, ttlSeconds, JSON.stringify(value))

        // Tag tracking: store key in Redis sets per tag for bulk invalidation
        for (const tag of _tags) {
          const tagKey = `cache:tag:${tag}`
          await redis.sAdd(tagKey, key)
          await redis.expire(tagKey, ttlSeconds + 300) // slightly longer than value TTL
        }
      } catch {
        // Non-critical — value already computed, just can't cache it
      }
    }

    return value
  }

  /**
   * Delete all cached keys that start with the given prefix.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    const redis = await this.getClient()
    if (!redis) return

    try {
      const keys = await redis.keys(`${prefix}*`)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } catch {
      // Best-effort invalidation
    }
  }

  /**
   * Delete all cached keys associated with any of the given tags.
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!tags.length) return

    const redis = await this.getClient()
    if (!redis) return

    try {
      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}`
        const keys = await redis.sMembers(tagKey)
        if (keys.length > 0) {
          await redis.del(keys)
        }
        await redis.del(tagKey)
      }
    } catch {
      // Best-effort invalidation
    }
  }

  /**
   * Explicitly set a key.
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const redis = await this.getClient()
    if (!redis) return

    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000)
      await redis.setEx(key, ttlSeconds, JSON.stringify(value))
    } catch {
      // Non-critical
    }
  }

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    const redis = await this.getClient()
    if (!redis) return

    try {
      await redis.del(key)
    } catch {
      // Best-effort
    }
  }

  /**
   * Graceful shutdown.
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit()
      this.connected = false
    }
  }
}

const redisCacheService = new RedisCacheService()

export default redisCacheService
