/**
 * Redis-backed rate limiter for API endpoints.
 *
 * Uses Redis INCR + EXPIRE (sliding fixed-window) strategy:
 *  - Each client gets a key that auto-expires after the window — no manual cleanup needed.
 *  - Shared across all server instances and survives restarts.
 *  - Falls back to in-memory map when Redis is unavailable (dev environments).
 *
 * Redis memory estimate: ~80 bytes per tracked client key × 10K clients = ~800 KB
 */

import redisCacheService from '#shared/cache/RedisCache'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface ClientRequestRecord {
  count: number
  resetTime: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

// ── In-memory fallback (used only when Redis is unavailable) ─────────────────
const fallbackStore = new Map<string, ClientRequestRecord>()

setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of fallbackStore.entries()) {
      if (record.resetTime < now) fallbackStore.delete(key)
    }
  },
  5 * 60 * 1000
)

function fallbackCheck(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  let record = fallbackStore.get(clientId)

  if (!record || record.resetTime < now) {
    record = { count: 0, resetTime: now + config.windowMs }
  }

  record.count++
  fallbackStore.set(clientId, record)

  return {
    allowed: record.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: record.resetTime,
  }
}

// ── Redis-backed implementation ───────────────────────────────────────────────
class RateLimiter {
  /**
   * Build a deterministic client identifier.
   * Prefer user ID (stable, survives IP changes) over raw IP.
   */
  getClientId(ip: string | undefined, userId?: number | string): string {
    if (userId) return `rl:user:${userId}`
    return `rl:ip:${ip ?? 'unknown'}`
  }

  /**
   * Check and increment the rate limit counter for a client.
   *
   * Redis INCR is atomic — safe under concurrency.
   * EXPIRE is only set on the first increment to avoid resetting the window.
   */
  async checkAsync(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redis = await (redisCacheService as any).getClient()

    if (!redis) {
      // Graceful fallback to in-memory
      return fallbackCheck(clientId, config)
    }

    try {
      const windowSeconds = Math.ceil(config.windowMs / 1000)

      // INCR is atomic — returns new count after increment
      const count = await redis.incr(clientId)

      // Only set expiry on first request in the window
      if (count === 1) {
        await redis.expire(clientId, windowSeconds)
      }

      // Get remaining TTL so we can compute the reset time accurately
      const ttl = await redis.ttl(clientId)
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs)

      return {
        allowed: count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime,
      }
    } catch {
      // Redis error — fall back to in-memory to stay available
      return fallbackCheck(clientId, config)
    }
  }

  /**
   * Synchronous check for backward compatibility.
   * Prefer checkAsync in new middleware.
   */
  check(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): { allowed: boolean; remaining: number; resetTime: number } {
    return fallbackCheck(clientId, config)
  }

  reset(clientId: string) {
    fallbackStore.delete(clientId)
    // Fire-and-forget Redis reset
    redisCacheService.del(clientId).catch(() => {})
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Predefined rate limit configurations for different endpoints.
 */
export const RateLimitConfigs = {
  // Auth endpoints — strict to prevent brute force
  auth: {
    maxRequests: 60,
    windowMs: 15 * 60 * 1000,
  },

  // File upload (legacy key)
  upload: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000,
  },

  // Student assignment upload create
  uploadStore: {
    maxRequests: 40,
    windowMs: 60 * 60 * 1000,
  },

  // Student assignment upload update — less strict
  uploadUpdate: {
    maxRequests: 180,
    windowMs: 60 * 60 * 1000,
  },

  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
  },

  // Dangerous operations
  danger: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },

  // Chatbot — strict to prevent abuse and AI cost overruns
  chatbot: {
    maxRequests: 40,
    windowMs: 60 * 60 * 1000,
  },
} satisfies Record<string, RateLimitConfig>
