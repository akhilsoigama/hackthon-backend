import { PermissionKeys } from '#database/constants/permission'
import { RoleKeysList } from '#database/constants/Role'
import Permission from '#models/permission'
import Role from '#models/role'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
      const roles = await Role.updateOrCreateMany('roleKey', RoleKeysList)

    const allPermissions = await Permission.all()
    const permissionMap = new Map(allPermissions.map((p) => [p.permissionKey, p.id]))

    const rolePermissions: Record<string, string[]> = {
      super_admin: Object.values(PermissionKeys),
    }

    for (const role of roles) {
      const permissions = rolePermissions[role.roleKey] || []
      const permissionIds = permissions
        .map((key) => permissionMap.get(key))
        .filter((id): id is number => id !== undefined)

      if (permissionIds.length > 0) {
        await role.related('permissions').sync(permissionIds)
      }
    }
  }
}
