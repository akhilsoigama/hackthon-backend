import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { rateLimiter, RateLimitConfigs } from '../helper/rate_limiter.js'
import env from '#start/env'

type RateLimitConfig = (typeof RateLimitConfigs)[keyof typeof RateLimitConfigs]

/**
 * Rate limiting middleware — Redis-backed, falls back to in-memory.
 *
 * OPTIMIZATION: No longer calls auth.authenticate() (which fired an extra DB query).
 * The AuthMiddleware runs first and sets ctx.user — we read that directly.
 */
export default class RateLimitMiddleware {
  async handle(
    { request, response, auth }: HttpContext,
    next: NextFn,
    options: { config?: RateLimitConfig; message?: string } = {}
  ) {
    try {
      const rateLimitEnabled = env.get('RATE_LIMIT_ENABLED', true)
      if (!rateLimitEnabled) {
        return next()
      }

      const ip = request.ip()

      // Read from ctx instead of calling auth.authenticate() again.
      // AuthMiddleware already authenticated and stored the user on ctx.
      let userId: string | number | undefined
      try {
        const ctxUser = (request.ctx as any)?.user ?? (request.ctx as any)?.authUser
        userId = ctxUser?.id
        // If ctx.user not populated yet (e.g. on /login route), attempt a lightweight check
        if (!userId) {
          const u = auth.user
          userId = u?.id
        }
      } catch {
        // Not authenticated — use IP-based limiting
      }

      const clientId = rateLimiter.getClientId(ip, userId)
      const config = options.config ?? RateLimitConfigs.api

      // Use async Redis-backed check
      const { allowed, remaining, resetTime } = await rateLimiter.checkAsync(clientId, config)

      // Standard rate limit headers
      response.header('X-RateLimit-Limit', String(config.maxRequests))
      response.header('X-RateLimit-Remaining', String(remaining))
      response.header('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))

      if (!allowed) {
        const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000)
        const message =
          options.message ?? `Too many requests. Please try again in ${resetInSeconds} seconds.`

        return response.status(429).json({
          success: false,
          message,
          retryAfter: resetInSeconds,
        })
      }

      return next()
    } catch (error) {
      // Never block a request due to rate-limiter errors
      console.error('[RATE_LIMIT] Error:', error)
      return next()
    }
  }
}
