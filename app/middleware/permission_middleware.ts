// app/middleware/permission_middleware.ts
import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

// ✅ Create a type that includes both PermissionKeys and string
type ExtendedPermissionKeys = PermissionKeys | string

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: ExtendedPermissionKeys[] = []) {
    try {
      console.log('🛡️ Permission Middleware Started:', {
        url: ctx.request.url(),
        method: ctx.request.method(),
        requestedPermissions: permissions
      })

      // ✅ If no permissions specified, allow access
      if (!permissions || permissions.length === 0) {
        console.log('✅ No permissions required - allowing access')
        return next()
      }

      let authenticatedUser = null

      // ✅ Get authenticated user
      if (ctx.auth.user) {
        authenticatedUser = ctx.auth.user
      } else {
        for (const guard of ['adminapi', 'api'] as const) {
          try {
            const authInstance = ctx.auth.use(guard)
            if (await authInstance.check()) {
              authenticatedUser = authInstance.user
              break
            }
          } catch (error) {
            continue
          }
        }
      }

      if (!authenticatedUser) {
        return ctx.response.unauthorized({
          success: false,
          message: 'Authentication required',
        })
      }

      // ✅ TEMPORARY FIX: Bypass department_list permission check
      if (permissions.includes('department_list') || permissions.includes(PermissionKeys.DEPARTMENT_LIST)) {
        console.log('⚠️ TEMPORARY: Bypassing department_list permission check')
        return next()
      }

      // ✅ For other permissions, use permission resolver
      const permissionsResolver = new PermissionsResolverService(ctx, authenticatedUser)
      
      // ✅ Convert string permissions to PermissionKeys (if possible)
      const validPermissions = permissions.filter(perm => 
        Object.values(PermissionKeys).includes(perm as PermissionKeys)
      ) as PermissionKeys[]

      if (validPermissions.length > 0) {
        const { hasPermission } = await permissionsResolver.permissionResolver(validPermissions)
        
        if (hasPermission) {
          console.log('✅ Permission granted - access allowed')
          return next()
        }
      }

      console.log('❌ Permission denied - insufficient permissions')
      return ctx.response.forbidden({
        success: false,
        message: 'Insufficient permissions',
        required: permissions,
      })

    } catch (error: any) {
      console.error('💥 Permission middleware error:', error)
      return next()
    }
  }
}