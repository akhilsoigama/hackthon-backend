/**
 * Token Bucket Rate Limiter for API endpoints.
 *
 * Algorithm (Token Bucket):
 *  - Each client has a bucket with a maximum capacity of tokens (burst limit).
 *  - Tokens refill smoothly at a constant rate per second (refillRate).
 *  - Each request consumes 1 token.
 *  - If bucket has >= 1 token, request is allowed immediately.
 *  - If bucket is empty, request is rejected (429) with a short Retry-After (seconds, not minutes!).
 *
 * Backed by Redis (with atomic Lua script) and falls back to in-memory Token Bucket.
 */

import redisCacheService from '#shared/cache/RedisCache'

export interface RateLimitConfig {
  maxRequests: number // Bucket Capacity (Burst limit)
  windowMs: number // Base window (fallback calculation)
  refillRate?: number // Tokens added per second
}

interface InMemoryBucket {
  tokens: number
  lastRefill: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  refillRate: 10, // 10 tokens/sec
}

// ── In-memory Token Bucket store ─────────────────────────────────────────────
const inMemoryStore = new Map<string, InMemoryBucket>()

// Clean up idle buckets every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, bucket] of inMemoryStore.entries()) {
      // If idle for more than 5 minutes, delete
      if (now - bucket.lastRefill > 5 * 60 * 1000) {
        inMemoryStore.delete(key)
      }
    }
  },
  5 * 60 * 1000
)

function getRefillRate(config: RateLimitConfig): number {
  if (config.refillRate && config.refillRate > 0) {
    return config.refillRate
  }
  // Default: refill the full bucket across windowMs
  const seconds = Math.max(1, config.windowMs / 1000)
  return Math.max(1, Math.round(config.maxRequests / seconds))
}

function inMemoryTokenBucketCheck(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const capacity = config.maxRequests
  const refillRate = getRefillRate(config)

  let bucket = inMemoryStore.get(clientId)

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now }
  } else {
    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000
    if (elapsedSeconds > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillRate)
      bucket.lastRefill = now
    }
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    inMemoryStore.set(clientId, bucket)

    // Time when bucket will be completely full
    const timeToFullMs = Math.ceil(((capacity - bucket.tokens) / refillRate) * 1000)
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetTime: now + timeToFullMs,
    }
  }

  // Not enough tokens
  inMemoryStore.set(clientId, bucket)
  // Time when at least 1 token will be available
  const timeToNextTokenMs = Math.ceil(((1 - bucket.tokens) / refillRate) * 1000)
  return {
    allowed: false,
    remaining: 0,
    resetTime: now + Math.max(1000, timeToNextTokenMs),
  }
}

// ── Redis Lua script for atomic Token Bucket ─────────────────────────────────
const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = 1

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if not tokens or not last_refill then
  tokens = capacity
  last_refill = now
else
  local elapsed = (now - last_refill) / 1000.0
  if elapsed > 0 then
    tokens = math.min(capacity, tokens + (elapsed * refill_rate))
    last_refill = now
  end
end

local allowed = 0
if tokens >= requested then
  tokens = tokens - requested
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tostring(tokens), 'last_refill', tostring(last_refill))
local ttl = math.max(60, math.ceil(capacity / refill_rate) + 60)
redis.call('EXPIRE', key, ttl)

return { allowed, math.floor(tokens), math.ceil((capacity - tokens) / refill_rate) }
`

class RateLimiter {
  getClientId(ip: string | undefined, userId?: number | string): string {
    if (userId) return `rl:tb:user:${userId}`
    return `rl:tb:ip:${ip ?? 'unknown'}`
  }

  async checkAsync(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redis = await (redisCacheService as any).getClient()

    if (!redis) {
      return inMemoryTokenBucketCheck(clientId, config)
    }

    try {
      const now = Date.now()
      const capacity = config.maxRequests
      const refillRate = getRefillRate(config)

      const result = (await redis.eval(
        TOKEN_BUCKET_LUA,
        1,
        clientId,
        capacity,
        refillRate,
        now
      )) as [number, number, number]

      const allowed = result[0] === 1
      const remaining = Math.max(0, result[1])
      const resetTimeSeconds = result[2] || 1

      return {
        allowed,
        remaining,
        resetTime: now + resetTimeSeconds * 1000,
      }
    } catch {
      // Fallback on Redis network error
      return inMemoryTokenBucketCheck(clientId, config)
    }
  }

  check(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): { allowed: boolean; remaining: number; resetTime: number } {
    return inMemoryTokenBucketCheck(clientId, config)
  }

  reset(clientId: string) {
    inMemoryStore.delete(clientId)
    redisCacheService.del(clientId).catch(() => {})
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Predefined Token Bucket configurations:
 *  - maxRequests = Bucket Capacity (Max Burst)
 *  - refillRate = Tokens added per second
 */
export const RateLimitConfigs = {
  // Auth endpoints: 30 burst, refills 2 tokens/sec (quick recovery, safe from brute-force)
  auth: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    refillRate: 2,
  },

  // File upload: 20 burst, refills 1 token every 2 seconds
  upload: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    refillRate: 1,
  },

  // Student assignment upload create
  uploadStore: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    refillRate: 2,
  },

  // Student assignment upload update
  uploadUpdate: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    refillRate: 10,
  },

  // General API endpoints: 100 burst, refills 15 tokens/sec (smooth for dashboards & mobile apps)
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    refillRate: 15,
  },

  // Dangerous operations
  danger: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    refillRate: 1,
  },

  // Chatbot: 25 burst, refills 2 tokens/sec
  chatbot: {
    maxRequests: 25,
    windowMs: 60 * 1000,
    refillRate: 2,
  },
} satisfies Record<string, RateLimitConfig>
