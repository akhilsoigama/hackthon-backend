import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: PermissionKeys[] = []) {
    // Skip if no permissions are required
    if (permissions.length === 0) {
      return next()
    }

    try {
      if (!ctx.auth.isAuthenticated) {
        return ctx.response.unauthorized({ message: 'Authentication required' })
      }

      const permissionsResolver = new PermissionsResolverService(ctx)

      // Check if user has required permissions
      const { hasPermission, userPermissions } =
        await permissionsResolver.permissionResolver(permissions)

      if (!hasPermission) {
        return ctx.response.forbidden({
          message: 'Insufficient permissions',
          required: permissions,
          userHas: userPermissions,
        })
      }

      // User has permission, proceed to the route handler
      return next()
    } catch (error) {
      console.error('Permission check error:', error)
      return ctx.response.internalServerError({
        message: 'Error checking permissions',
      })
    }
  }
}
