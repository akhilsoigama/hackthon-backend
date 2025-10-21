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

    for (const guard of guards) {
      try {
        
        const authInstance = ctx.auth.use(guard)
        const isAuthenticated = await authInstance.check()

        if (isAuthenticated) {
          authenticatedGuard = guard
          break
        }
      } catch (error: any) {
        console.log(`🚨 Guard ${guard} ERROR:`, error.message)
        // Continue to next guard
      }
    }

    if (!authenticatedGuard) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication failed',
        code: 'UNAUTHORIZED'
      })
    }
    return next()
  }
}