import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: PermissionKeys[] = []) {
    if (permissions.length === 0) {
      return next()
    }

    try {
      let authenticatedUser = null
      
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

      if (!authenticatedUser) {
        return ctx.response.unauthorized({ 
          success: false,
          message: 'Authentication required' 
        })
      }

      // Pass the authenticated user to the permissions resolver
      const permissionsResolver = new PermissionsResolverService(ctx, authenticatedUser)
      const { hasPermission, userPermissions } =
        await permissionsResolver.permissionResolver(permissions)


      if (!hasPermission) {
        return ctx.response.forbidden({
          success: false,
          message: 'Insufficient permissions',
          required: permissions,
          userHas: userPermissions,
        })
      }

      return next()
    } catch (error) {
      return ctx.response.internalServerError({
        success: false,
        message: 'Error checking permissions',
      })
    }
  }
}