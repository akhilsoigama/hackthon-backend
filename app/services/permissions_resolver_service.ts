import { PermissionKeys } from '#database/constants/permission'
import { HttpContext } from '@adonisjs/core/http'

export default class PermissionsResolverService {
  constructor(
    protected ctx: HttpContext,
    protected authenticatedUser?: unknown
  ) {}

  private getUserType(user: unknown): string | undefined {
    if (typeof user !== 'object' || user === null) {
      return undefined
    }
    const maybe = user as { userType?: unknown }
    return typeof maybe.userType === 'string' ? maybe.userType : undefined
  }

  private getUserId(user: unknown): number | undefined {
    if (typeof user !== 'object' || user === null) {
      return undefined
    }
    const maybe = user as { id?: unknown }
    const id = Number(maybe.id)
    return Number.isFinite(id) ? id : undefined
  }

  async permissionResolver(requiredPermissions?: PermissionKeys[]) {
    try {

      const user = this.authenticatedUser || this.ctx.auth.user
      
      if (!user) {
        return { 
          user: null, 
          userPermissions: [], 
          hasPermission: false,
          isSystemAdmin: false
        }
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return { 
          user, 
          userPermissions: [], 
          hasPermission: true,
          isSystemAdmin: false
        }
      }

      const isSystemAdmin = await this.checkIfSystemAdmin(user)
      if (isSystemAdmin) {
        return { 
          user, 
          userPermissions: Object.values(PermissionKeys), 
          hasPermission: true, 
          isSystemAdmin: true 
        }
      }

      const userPermissions = await this.getUserPermissions(user)
      
     

      const hasPermission = requiredPermissions.every((perm) => 
        userPermissions.includes(perm)
      )

      return { 
        user, 
        userPermissions, 
        hasPermission,
        isSystemAdmin 
      }

    } catch (error) {
      return { 
        user: null, 
        userPermissions: [], 
        hasPermission: false,
        isSystemAdmin: false
      }
    }
  }

  private async checkIfSystemAdmin(user: unknown): Promise<boolean> {
    try {
      const userType = this.getUserType(user)
      if (userType === 'super_admin' || userType === 'system_admin' || userType === 'admin') {
        return true
      }

      try {
        const UserModel = (await import('#models/user')).default
        if (user instanceof UserModel) {
          const userWithRoles = await UserModel.query()
            .where('id', user.id)
            .preload('userRoles')
            .first()

          const isSuperAdmin = userWithRoles?.userRoles?.some(role => 
            role.roleKey === 'super_admin' || 
            role.roleKey === 'system_admin' ||
            role.roleKey === 'admin'
          ) || false

          return isSuperAdmin
        }
      } catch (error) {
        console.error('Error checking user roles:', error)
      }

      return false
    } catch (error) {
      console.error('❌ Error checking system admin status:', error)
      return false
    }
  }

  private async getUserPermissions(user: unknown): Promise<PermissionKeys[]> {
    try {
      const userType = this.getUserType(user)
      if (userType === 'super_admin' || userType === 'system_admin' || userType === 'admin') {
        return Object.values(PermissionKeys) as PermissionKeys[]
      }

      const userId = this.getUserId(user)
      if (!userId) {
        return []
      }

      const UserModel = (await import('#models/user')).default
      const userWithRoles = await UserModel.query()
        .where('id', userId)
        .preload('userRoles', (roleQuery) => {
          roleQuery.preload('permissions')
        })
        .first()

      if (!userWithRoles) {
        return []
      }

      const permissions: PermissionKeys[] = []
      
      userWithRoles.userRoles?.forEach((role) => {
        role.permissions?.forEach((permission) => {
          if (permission.permissionKey && Object.values(PermissionKeys).includes(permission.permissionKey as PermissionKeys)) {
            const permissionKey = permission.permissionKey as PermissionKeys
            if (!permissions.includes(permissionKey)) {
              permissions.push(permissionKey)
            }
          }
        })
      })

      return permissions

    } catch (error) {
      console.error('❌ Error getting user permissions:', error)
      return []
    }
  }
}
