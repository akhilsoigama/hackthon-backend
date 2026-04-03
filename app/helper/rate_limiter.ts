/**
 * In-memory rate limiter for API endpoints
 * Stores request counts with automatic cleanup
 */

interface RateLimitConfig {
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

class RateLimiter {
  private store: Map<string, ClientRequestRecord> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup old entries every 5 minutes
    this.startCleanup()
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.store.entries()) {
        if (record.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Get client identifier (IP, user ID, or both)
   */
  getClientId(ip: string | undefined, userId?: number | string): string {
    if (userId) {
      return `user:${userId}`
    }
    return `ip:${ip || 'unknown'}`
  }

  /**
   * Check if client has exceeded rate limit
   */
  check(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    let record = this.store.get(clientId)

    // Create new record if doesn't exist or is expired
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }

    record.count++
    this.store.set(clientId, record)

    const remaining = Math.max(0, config.maxRequests - record.count)
    const allowed = record.count <= config.maxRequests

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
    }
  }

  /**
   * Reset client's request count
   */
  reset(clientId: string) {
    this.store.delete(clientId)
  }

  /**
   * Get current status for a client
   */
  getStatus(
    clientId: string,
    config: RateLimitConfig = DEFAULT_CONFIG
  ): { count: number; remaining: number; resetTime: number } | null {
    const record = this.store.get(clientId)
    if (!record) {
      return null
    }

    const remaining = Math.max(0, config.maxRequests - record.count)
    return {
      count: record.count,
      remaining,
      resetTime: record.resetTime,
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Predefined rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    maxRequests: 60,
    windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
  },

  // Moderate limits for file uploads (legacy key)
  upload: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 30 uploads per hour
  },

  // Student assignment upload create
  uploadStore: {
    maxRequests: 40,
    windowMs: 60 * 60 * 1000, // 40 creates per hour
  },

  // Student assignment upload update/edit should be less strict
  uploadUpdate: {
    maxRequests: 180,
    windowMs: 60 * 60 * 1000, // 180 updates per hour
  },

  // Moderate limits for API endpoints
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
  },

  // Stricter limits for dangerous operations
  danger: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
  },

  // Very strict for chatbot to prevent abuse
  chatbot: {
    maxRequests: 40,
    windowMs: 60 * 60 * 1000, // 40 requests per hour
  },
}
