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
        
        // Try to authenticate with the current guard
        await authInstance.authenticate()
        
        // If we reach here, authentication was successful
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
      
      // Check if it's a preflight request
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

    // Set user in context with proper error handling
    try {
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
    } catch (error: any) {
      console.error('❌ Error setting user in context:', error)
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication context setup failed',
        code: 'AUTH_CONTEXT_ERROR'
      })
    }
  }
}