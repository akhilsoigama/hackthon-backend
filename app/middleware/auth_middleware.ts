// app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const guards = options.guards || ['api', 'adminapi'] as (keyof Authenticators)[]
    let authenticatedGuard: string | null = null
    let authenticatedUser: any = null
    let authError: string | null = null

    for (const guard of guards) {
      try {
        const authInstance = ctx.auth.use(guard)
        
        await authInstance.authenticate()
        
        authenticatedGuard = guard
        authenticatedUser = authInstance.user
        
        break
        
      } catch (error: any) {
        authError = error.message
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
      const ctxWithUser = ctx as any
      ctxWithUser.user = authenticatedUser
      ctxWithUser.authUser = authenticatedUser
      
      const requestWithUser = ctx.request as any
      requestWithUser.user = authenticatedUser

      return next()
    } catch (error: any) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication context setup failed',
        code: 'AUTH_CONTEXT_ERROR'
      })
    }
  }
}