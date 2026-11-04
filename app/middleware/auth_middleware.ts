// app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import env from '#start/env'
import { createHash } from 'node:crypto'

const AUTH_COOKIE_NAME = env.get('AUTH_COOKIE_NAME') || 'token'

interface CachedAuth {
  user: unknown
  guard: keyof Authenticators
  tokenObj: unknown
  expiresAt: number
}

const authCache = new Map<string, CachedAuth>()

// Periodic cleanup of expired tokens
const authCacheCleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, item] of authCache.entries()) {
    if (item.expiresAt <= now) {
      authCache.delete(key)
    }
  }
}, 60_000)
if (authCacheCleanup.unref) authCacheCleanup.unref()

export function invalidateAuthToken(rawToken: string) {
  const hash = createHash('sha256').update(rawToken).digest('hex')
  authCache.delete(hash)
}

export function clearAllAuthCache() {
  authCache.clear()
}

export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const tokenFromCookie = ctx.request.cookie(AUTH_COOKIE_NAME)

    if (tokenFromCookie && !ctx.request.header('authorization')) {
      ctx.request.request.headers.authorization = `Bearer ${tokenFromCookie}`
    }

    const authHeader = ctx.request.header('authorization')
    let rawToken: string | null = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.slice(7).trim()
    }

    // Fast path: In-memory token cache check (eliminates redundant DB auth queries)
    if (rawToken) {
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      const cached = authCache.get(tokenHash)

      if (cached && cached.expiresAt > Date.now()) {
        try {
          const authInstance = ctx.auth.use(cached.guard) as any
          authInstance.authenticationAttempted = true
          authInstance.user = cached.user
          if (cached.tokenObj) {
            authInstance.authenticatedViaToken = cached.tokenObj
          }

          const ctxWithUser = ctx as unknown & { user?: unknown; authUser?: unknown }
          ctxWithUser.user = cached.user
          ctxWithUser.authUser = cached.user

          const requestWithUser = ctx.request as unknown & { user?: unknown }
          requestWithUser.user = cached.user

          return next()
        } catch {
          authCache.delete(tokenHash)
        }
      }
    }

    const guards = options.guards || (['api', 'adminapi'] as (keyof Authenticators)[])
    let authenticatedGuard: string | null = null
    let authenticatedUser: unknown = null
    let authError: string | null = null

    for (const guard of guards) {
      try {
        const authInstance = ctx.auth.use(guard)

        await authInstance.authenticate()

        authenticatedGuard = guard
        authenticatedUser = authInstance.user

        break
      } catch (error: unknown) {
        authError = error instanceof Error ? error.message : String(error)
      }
    }

    if (!authenticatedGuard) {
      if (ctx.request.method() === 'OPTIONS') {
        return ctx.response.noContent()
      }

      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication failed - Please login again',
        code: 'UNAUTHORIZED',
        error: authError,
      })
    }

    try {
      const ctxWithUser = ctx as unknown & { user?: unknown; authUser?: unknown }
      ctxWithUser.user = authenticatedUser
      ctxWithUser.authUser = authenticatedUser

      const requestWithUser = ctx.request as unknown & { user?: unknown }
      requestWithUser.user = authenticatedUser

      // Cache verified token for subsequent microsecond requests (30-second TTL)
      if (rawToken && authenticatedGuard && authenticatedUser) {
        const tokenHash = createHash('sha256').update(rawToken).digest('hex')
        const authInstance = ctx.auth.use(authenticatedGuard as keyof Authenticators) as any
        authCache.set(tokenHash, {
          user: authenticatedUser,
          guard: authenticatedGuard as keyof Authenticators,
          tokenObj: authInstance?.authenticatedViaToken,
          expiresAt: Date.now() + 30_000,
        })
      }

      return next()
    } catch (error: unknown) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication context setup failed',
        code: 'AUTH_CONTEXT_ERROR',
      })
    }
  }
}
