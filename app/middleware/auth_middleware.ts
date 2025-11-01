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

    console.log('🔐 Auth Middleware Started', {
      path: ctx.request.url(),
      method: ctx.request.method(),
      guards: guards
    })

    let authenticatedGuard: string | null = null
    let authenticatedUser: any = null
    let authError: string | null = null

    for (const guard of guards) {
      try {
        const authInstance = ctx.auth.use(guard)
        
        // First try to check if already authenticated
        const isAuthenticated = await authInstance.check()
        
        if (isAuthenticated) {
          authenticatedGuard = guard
          authenticatedUser = authInstance.user
          console.log(`✅ Already authenticated with guard: ${guard}`, {
            userId: authInstance.user?.id,
            userType: authInstance.user?.userType
          })
          break
        }
        
        // If not authenticated, try to authenticate
        await authInstance.authenticate()
        authenticatedGuard = guard
        authenticatedUser = authInstance.user
        console.log(`✅ Successfully authenticated with guard: ${guard}`, {
          userId: authInstance.user?.id,
          userType: authInstance.user?.userType
        })
        break
        
      } catch (error: any) {
        authError = error.message
        console.log(`❌ Guard ${guard} failed:`, error.message)
        // Continue to next guard
      }
    }

    if (!authenticatedGuard) {
      console.log('🚫 All authentication guards failed', {
        guardsAttempted: guards,
        lastError: authError
      })
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication failed - Please login again',
        code: 'UNAUTHORIZED',
        error: authError
      })
    }

    // ✅✅✅ CRITICAL FIX: Set user in multiple locations with proper typing
    // Use type assertion to bypass TypeScript checks for custom properties
    const ctxWithUser = ctx as any
    ctxWithUser.user = authenticatedUser
    ctxWithUser.authUser = authenticatedUser
    
    const requestWithUser = ctx.request as any
    requestWithUser.user = authenticatedUser
    
    console.log(`🎯 Auth successful with guard: ${authenticatedGuard}`, {
      userId: authenticatedUser?.id,
      userEmail: authenticatedUser?.email,
      userType: authenticatedUser?.userType
    })

    return next()
  }
}