import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'

export default class StudentProgressPermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user =
      (ctx as any).user || (ctx as any).authUser || (ctx.request as any).user || ctx.auth?.user

    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Authentication required.',
      })
    }
    console.log('StudentProgressPermissionMiddleware')
    console.log(ctx.auth.user?.userType)
    // Super admin bypass
    if (['super_admin', 'admin', 'system_admin'].includes(user.userType)) {
      return next()
    }

    let requiredPermission: PermissionKeys | null = null

    switch (user.userType) {
      case 'student':
        requiredPermission = PermissionKeys.STUDENT_PROGRESS_VIEW
        break

      case 'faculty':
        requiredPermission = PermissionKeys.FACULTY_STUDENT_PROGRESS_VIEW
        break

      default:
        return ctx.response.forbidden({
          success: false,
          message: 'Unauthorized user type.',
        })
    }

    const permissionResolver = new PermissionsResolverService(ctx, user)

    const { hasPermission } = await permissionResolver.permissionResolver([requiredPermission])

    if (!hasPermission) {
      return ctx.response.forbidden({
        success: false,
        message: 'Insufficient permissions.',
      })
    }

    return next()
  }
}
