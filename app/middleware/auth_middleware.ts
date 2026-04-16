// app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import env from '#start/env'

const AUTH_COOKIE_NAME = env.get('AUTH_COOKIE_NAME') || 'token'

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

    const guards = options.guards || ['api', 'adminapi'] as (keyof Authenticators)[]
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
        error: authError
      })
    }

    try {
      const ctxWithUser = ctx as unknown & { user?: unknown; authUser?: unknown }
      ctxWithUser.user = authenticatedUser
      ctxWithUser.authUser = authenticatedUser
      
      const requestWithUser = ctx.request as unknown & { user?: unknown }
      requestWithUser.user = authenticatedUser

      return next()
    } catch (error: unknown) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication context setup failed',
        code: 'AUTH_CONTEXT_ERROR'
      })
    }
  }
}

