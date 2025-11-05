// app/services/permissions_resolver_service.ts
import { PermissionKeys } from '#database/constants/permission'
import { HttpContext } from '@adonisjs/core/http'

export default class PermissionsResolverService {
  constructor(
    protected ctx: HttpContext,
    protected authenticatedUser?: any
  ) {}

  async permissionResolver(requiredPermissions?: PermissionKeys[]) {
    try {
      console.log('🔍 PermissionsResolver started:', {
        requiredPermissions,
        userType: this.authenticatedUser?.userType,
        userId: this.authenticatedUser?.id
      })

      // Use the provided authenticated user or fall back to ctx.auth.user
      const user = this.authenticatedUser || this.ctx.auth.user
      
      if (!user) {
        console.log('❌ No user provided to permissions resolver')
        return { 
          user: null, 
          userPermissions: [], 
          hasPermission: false,
          isSystemAdmin: false
        }
      }

      // If no permissions required, allow access
      if (!requiredPermissions || requiredPermissions.length === 0) {
        console.log('✅ No permissions required - allowing access')
        return { 
          user, 
          userPermissions: [], 
          hasPermission: true,
          isSystemAdmin: false
        }
      }

      // Check if system admin
      const isSystemAdmin = await this.checkIfSystemAdmin(user)
      if (isSystemAdmin) {
        console.log('✅ System admin detected - granting all permissions')
        return { 
          user, 
          userPermissions: Object.values(PermissionKeys), 
          hasPermission: true, 
          isSystemAdmin: true 
        }
      }

      // For regular users, check their actual permissions
      const userPermissions = await this.getUserPermissions(user)
      
      console.log('📋 User permissions check:', {
        userId: user.id,
        userType: user.userType,
        requiredPermissions,
        userPermissions,
        isSystemAdmin
      })

      // Check if the user has the required permissions
      const hasPermission = requiredPermissions.every((perm) => 
        userPermissions.includes(perm)
      )

      console.log('🎯 Permission check result:', {
        hasPermission,
        missingPermissions: requiredPermissions.filter(perm => !userPermissions.includes(perm))
      })

      return { 
        user, 
        userPermissions, 
        hasPermission,
        isSystemAdmin 
      }

    } catch (error) {
      console.error('❌ PERMISSIONS RESOLVER ERROR:', error)
      return { 
        user: null, 
        userPermissions: [], 
        hasPermission: false,
        isSystemAdmin: false
      }
    }
  }

  private async checkIfSystemAdmin(user: any): Promise<boolean> {
    try {
      // Check userType field directly
      if (user.userType === 'super_admin' || user.userType === 'system_admin' || user.userType === 'admin') {
        return true
      }

      // Check database roles for User model
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

  private async getUserPermissions(user: any): Promise<PermissionKeys[]> {
    try {
      // For admin users, return all permissions
      if (user.userType === 'super_admin' || user.userType === 'system_admin' || user.userType === 'admin') {
        return Object.values(PermissionKeys) as PermissionKeys[]
      }

      // Load user with roles and permissions from database
      const UserModel = (await import('#models/user')).default
      const userWithRoles = await UserModel.query()
        .where('id', user.id)
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
          // Use permissionKey directly if it matches PermissionKeys
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