import { PermissionKeys } from '#database/constants/permission'
import { HttpContext } from '@adonisjs/core/http'
import redisCacheService from '#shared/cache/RedisCache'

/**
 * OPTIMIZATION: Permission results are now cached in Redis.
 *
 * Problem: Every authenticated request fired a 3-table DB JOIN:
 *   UserModel → userRoles → permissions
 * This accounted for ~1500ms of the observed 2500ms /profile latency.
 *
 * Solution: Cache each user's permission set in Redis for 5 minutes.
 *   Key:   perm:user:{userId}
 *   TTL:   300 seconds
 *   Invalidation: Call invalidateUserPermissionCache(userId) on role change.
 *
 * Redis budget: ~50 active users × ~200 bytes = ~10 KB
 */

const PERM_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function permCacheKey(userId: number): string {
  return `perm:user:${userId}`
}

/**
 * Invalidate a user's permission cache.
 * Call this whenever roles are assigned or removed for a user.
 */
export async function invalidateUserPermissionCache(userId: number): Promise<void> {
  await redisCacheService.del(permCacheKey(userId))
}

export default class PermissionsResolverService {
  constructor(
    protected ctx: HttpContext,
    protected authenticatedUser?: unknown
  ) {}

  private getUserType(user: unknown): string | undefined {
    if (typeof user !== 'object' || user === null) return undefined
    const maybe = user as { userType?: unknown }
    return typeof maybe.userType === 'string' ? maybe.userType : undefined
  }

  private getUserId(user: unknown): number | undefined {
    if (typeof user !== 'object' || user === null) return undefined
    const maybe = user as { id?: unknown }
    const id = Number(maybe.id)
    return Number.isFinite(id) ? id : undefined
  }

  async permissionResolver(requiredPermissions?: PermissionKeys[]) {
    try {
      const user = this.authenticatedUser || this.ctx.auth.user

      if (!user) {
        return { user: null, userPermissions: [], hasPermission: false, isSystemAdmin: false }
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return { user, userPermissions: [], hasPermission: true, isSystemAdmin: false }
      }

      // Fast path: check userType field before hitting DB or cache
      const userType = this.getUserType(user)
      if (userType && ['super_admin', 'admin', 'system_admin'].includes(userType)) {
        return {
          user,
          userPermissions: Object.values(PermissionKeys),
          hasPermission: true,
          isSystemAdmin: true,
        }
      }

      const isSystemAdmin = await this.checkIfSystemAdmin(user)
      if (isSystemAdmin) {
        return {
          user,
          userPermissions: Object.values(PermissionKeys),
          hasPermission: true,
          isSystemAdmin: true,
        }
      }

      const userPermissions = await this.getUserPermissions(user)
      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm))

      return { user, userPermissions, hasPermission, isSystemAdmin }
    } catch {
      return { user: null, userPermissions: [], hasPermission: false, isSystemAdmin: false }
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

          return (
            userWithRoles?.userRoles?.some(
              (role) =>
                role.roleKey === 'super_admin' ||
                role.roleKey === 'system_admin' ||
                role.roleKey === 'admin'
            ) || false
          )
        }
      } catch (error) {
        console.error('Error checking user roles:', error)
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * Fetches user permissions — cached in Redis for PERM_CACHE_TTL_MS.
   *
   * Cache key: perm:user:{userId}
   * Invalidated by: invalidateUserPermissionCache(userId)
   */
  private async getUserPermissions(user: unknown): Promise<PermissionKeys[]> {
    try {
      const userType = this.getUserType(user)
      if (userType === 'super_admin' || userType === 'system_admin' || userType === 'admin') {
        return Object.values(PermissionKeys) as PermissionKeys[]
      }

      const userId = this.getUserId(user)
      if (!userId) return []

      const cacheKey = permCacheKey(userId)

      return redisCacheService.getOrSet<PermissionKeys[]>(
        cacheKey,
        PERM_CACHE_TTL_MS,
        async () => {
          const UserModel = (await import('#models/user')).default
          const userWithRoles = await UserModel.query()
            .where('id', userId)
            .preload('userRoles', (roleQuery) => {
              roleQuery.preload('permissions')
            })
            .first()

          if (!userWithRoles) return []

          const permissions: PermissionKeys[] = []
          userWithRoles.userRoles?.forEach((role) => {
            role.permissions?.forEach((permission) => {
              if (
                permission.permissionKey &&
                Object.values(PermissionKeys).includes(permission.permissionKey as PermissionKeys)
              ) {
                const key = permission.permissionKey as PermissionKeys
                if (!permissions.includes(key)) {
                  permissions.push(key)
                }
              }
            })
          })

          return permissions
        }
      )
    } catch (error) {
      console.error('❌ Error getting user permissions:', error)
      return []
    }
  }
}
