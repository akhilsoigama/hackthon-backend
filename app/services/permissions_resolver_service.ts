import { PermissionKeys } from '#database/constants/permission'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class PermissionsResolverService {
  constructor(
    protected ctx: HttpContext,
    protected authenticatedUser?: any // Make it optional
  ) {}

  async permissionResolver(requiredPermissions?: PermissionKeys[]) {

    try {
      const user = this.authenticatedUser || this.ctx.auth.user
      
      if (!user) {
        return { 
          user: null, 
          userPermissions: [], 
          hasPermission: false 
        }
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return { user, userPermissions: [], hasPermission: true }
      }

      const isSystemAdmin = await this.checkIfSystemAdmin(user)
      
      if (isSystemAdmin) {
        return { user, userPermissions: [], hasPermission: true, isSystemAdmin: true }
      }

      // Load user with roles and permissions
      const userWithRoles = await User.query()
        .where('id', user.id)
        .preload('userRoles', (roleQuery) => {
          roleQuery.preload('permissions')
        })
        .first()

      if (!userWithRoles) {
        return { user, userPermissions: [], hasPermission: false }
      }

      let userPermissions: PermissionKeys[] = []
      
      if (userWithRoles.userRoles) {
        userWithRoles.userRoles.forEach((role) => {
          if (role.permissions) {
            role.permissions.forEach((permission) => {
              userPermissions.push(permission.permissionKey as PermissionKeys)
            })
          }
        })
      }

      // Check if the user has the required permissions
      const hasPermission = requiredPermissions.every((perm) => 
        userPermissions.includes(perm)
      )

      return { user, userPermissions, hasPermission }

    } catch (error) {
      return { 
        user: null, 
        userPermissions: [], 
        hasPermission: false 
      }
    }
  }

  private async checkIfSystemAdmin(user: any): Promise<boolean> {
    try {
      // For AdminUser (adminapi guard)
      if (user.constructor.name === 'AdminUser') {
        return true
      }
      
      // For regular User (api guard) - check if they have system admin role
      const userWithRoles = await User.query()
        .where('id', user.id)
        .preload('userRoles')
        .first()
      
      return userWithRoles?.userRoles?.some(role => 
        role.roleKey === 'system_admin' || role.roleKey === 'super_admin'
      ) || false
    } catch (error) {
      console.error('Error checking system admin status:', error)
      return false
    }
  }
}