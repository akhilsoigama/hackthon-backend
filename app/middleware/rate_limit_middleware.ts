import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { rateLimiter, RateLimitConfigs } from '../helper/rate_limiter.js'

type RateLimitConfig = (typeof RateLimitConfigs)[keyof typeof RateLimitConfigs]

/**
 * Rate limiting middleware
 * Limits requests per IP or per authenticated user
 */
export default class RateLimitMiddleware {
  async handle(
    { request, response, auth }: HttpContext,
    next: NextFn,
    options: { config?: RateLimitConfig; message?: string } = {}
  ) {
    try {
      // Get client identifier
      const ip = request.ip()
      let userId: string | number | undefined

      // Try to get authenticated user ID
      try {
        const user = await auth.authenticate()
        userId = user?.id
      } catch {
        // Not authenticated, use IP
      }

      // Construct client ID - prefer user ID if authenticated
      const clientId = rateLimiter.getClientId(ip, userId)

      // Use provided config or default API config
      const config = options.config || RateLimitConfigs.api

      // Check rate limit
      const { allowed, remaining, resetTime } = rateLimiter.check(clientId, config)

      // Set rate limit headers
      response.header('X-RateLimit-Limit', String(config.maxRequests))
      response.header('X-RateLimit-Remaining', String(remaining))
      response.header('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))

      if (!allowed) {
        const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000)
        const message =
          options.message ||
          `Too many requests. Please try again in ${resetInSeconds} seconds.`

        return response.status(429).json({
          success: false,
          message,
          retryAfter: resetInSeconds,
        })
      }

      return next()
    } catch (error) {
      // If there's an error in rate limiting logic, allow the request but log it
      console.error('Rate limiting error:', error)
      return next()
    }
  }
}
