// Redis-backed cache service — drop-in replacement for the in-memory ApiCacheService.
// Falls back gracefully to a no-op if Redis is unavailable (development without Redis).
//
// The interface intentionally mirrors the existing api_cache_service.ts so existing
// callers can be migrated with a one-line import change.

import { createClient, type RedisClientType } from 'redis'
import env from '#start/env'

const rawRedisUrl = env.get('REDIS_URL')
const isRedisConfigured = Boolean(
  rawRedisUrl &&
  typeof rawRedisUrl === 'string' &&
  rawRedisUrl.trim() !== '' &&
  rawRedisUrl !== 'none' &&
  rawRedisUrl !== 'disabled'
)
const REDIS_URL = isRedisConfigured ? rawRedisUrl : null

interface MemoryCacheEntry {
  value: any
  expiresAt: number
  tags: string[]
}

class RedisCacheService {
  private client: RedisClientType | null = null
  private connected = false
  private connecting = false
  private lastConnectAttempt = 0
  private readonly connectCooldownMs = 60_000 // Only retry Redis connection once per minute
  private memoryStore = new Map<string, MemoryCacheEntry>()

  constructor() {
    // Periodically evict expired entries from memory store (every 2 minutes)
    const cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryStore.delete(key)
        }
      }
    }, 2 * 60 * 1000)
    if (cleanupTimer.unref) {
      cleanupTimer.unref()
    }
  }

  public async getClient(): Promise<RedisClientType | null> {
    if (!REDIS_URL) return null
    if (this.connected && this.client) return this.client
    if (this.connecting) return null
    if (this.client) return this.client

    // If a connection attempt recently failed, skip immediately without stalling
    const now = Date.now()
    if (now - this.lastConnectAttempt < this.connectCooldownMs) {
      return null
    }

    try {
      this.connecting = true
      this.lastConnectAttempt = now
      this.client = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: 500, // Quick 500ms timeout so we never hang requests
          reconnectStrategy: false, // Fail fast on initial connection
        },
      }) as RedisClientType

      this.client.on('error', (_err: Error) => {
        this.connected = false
      })

      this.client.on('connect', () => {
        this.connected = true
      })

      await this.client.connect()
      this.connected = true
    } catch {
      this.client = null
      this.connected = false
    } finally {
      this.connecting = false
    }

    return this.client
  }

  /**
   * Get a value from cache (memory or Redis), or compute and store it.
   */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>,
    _tags: string[] = []
  ): Promise<T> {
    const now = Date.now()

    // 1. Fast L1 Memory Cache check
    const memEntry = this.memoryStore.get(key)
    if (memEntry && memEntry.expiresAt > now) {
      return memEntry.value as T
    }

    // 2. Redis Cache check (if available)
    const redis = await this.getClient()
    if (redis) {
      try {
        const cached = await redis.get(key)
        if (cached !== null) {
          const parsed = JSON.parse(cached) as T
          // Populate L1 cache for subsequent microsecond hits
          this.memoryStore.set(key, { value: parsed, expiresAt: now + ttlMs, tags: _tags })
          return parsed
        }
      } catch {
        // Cache miss or parse error — fall through to producer
      }
    }

    // 3. Cache miss: execute producer
    const value = await producer()

    // 4. Store in memory cache
    if (ttlMs > 0) {
      this.memoryStore.set(key, { value, expiresAt: now + ttlMs, tags: _tags })
    }

    // 5. Store in Redis (if connected)
    if (redis && ttlMs > 0) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000)
        await redis.setEx(key, ttlSeconds, JSON.stringify(value))

        for (const tag of _tags) {
          const tagKey = `cache:tag:${tag}`
          await redis.sAdd(tagKey, key)
          await redis.expire(tagKey, ttlSeconds + 300)
        }
      } catch {
        // Non-critical
      }
    }

    return value
  }

  /**
   * Delete all cached keys that start with the given prefix.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    // Invalidate from memory store
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key)
      }
    }

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

    // Invalidate from memory store
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.tags && entry.tags.some((t) => tags.includes(t))) {
        this.memoryStore.delete(key)
      }
    }

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
  async set<T>(key: string, value: T, ttlMs: number, tags: string[] = []): Promise<void> {
    const now = Date.now()
    if (ttlMs > 0) {
      this.memoryStore.set(key, { value, expiresAt: now + ttlMs, tags })
    }

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
    this.memoryStore.delete(key)

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
