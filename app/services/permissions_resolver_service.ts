import { PermissionKeys } from '#database/constants/permission'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class PermissionsResolverService {
  constructor(protected ctx: HttpContext) {}

  async permissionResolver(requiredPermissions?: PermissionKeys[]) {
    const user = this.ctx.auth.getUserOrFail()

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return { user, userPermissions: [], hasPermission: true }
    }

    const isSytemAdmin = this.ctx.auth.use('adminapi').isAuthenticated
    if (isSytemAdmin) {
      return { user, userPermissions: [], hasPermission: true, isSytemAdmin: true }
    }

    const userWithRoles = await User.query()
      .where('id', user.id)
      .preload('userRoles', (roleQuery) => {
        roleQuery.preload('permissions')
      })
      .firstOrFail()

    let userPermissions: PermissionKeys[] = []
    userWithRoles.userRoles.forEach((role) => {
      role.permissions.forEach((permission) => {
        userPermissions.push(permission.permissionKey as PermissionKeys)
      })
    })

    // Check if the user has the required permissions
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm))

    return { user, userPermissions, hasPermission }
  }
}
