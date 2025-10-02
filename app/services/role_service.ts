import { HttpContext } from "@adonisjs/core/http"
import Role from "#models/role"

export default class RolesService {
  public async getAllRoleWithPermissions({ response }: HttpContext) {
    try {
      const roles = await Role.query().preload('permissions')
      return response.ok({ success: true, data: roles })
    } catch (error) {
      console.error('Error fetching roles with permissions:', error)
      return response.internalServerError({
        success: false,
        message: 'Error fetching roles',
        error,
      })
    }
  }

  public async createRoleWithPermissions({ request, response }: HttpContext) {
    const { roleName, roleDescription, roleKey, permissionIds } = request.only([
      'roleName',
      'roleDescription',
      'roleKey',
      'permissionIds',
    ])

    // Create Role
    const role = await Role.create({
      roleName,
      roleDescription,
      roleKey,
    })

    // Assign permissions
    if (permissionIds && permissionIds.length > 0) {
      await role.related('permissions').sync(permissionIds)
    }

    return response.created({ message: 'Role created successfully', role })
  }

  public async updateRole({ params, request, response }: HttpContext) {
    try {
      const { roleName, roleDescription, roleKey, permissionIds } = request.only([
        'roleName',
        'roleDescription',
        'roleKey',
        'permissionIds',
      ])

      const roleId = params.id

      const role = await Role.find(roleId)
      if (!role) {
        return response.notFound({ success: false, message: 'Role not found' })
      }

      // Update role details if provided
      role.merge({
        roleName: roleName || role.roleName,
        roleDescription: roleDescription || role.roleDescription,
        roleKey: roleKey || role.roleKey,
      })
      await role.save()

      // Update role permissions efficiently
      if (permissionIds && Array.isArray(permissionIds)) {
        await role.related('permissions').sync(permissionIds)
      }

      return response.ok({ success: true, message: 'Role updated successfully', role })
    } catch (error) {
      console.error('Error updating role:', error)
      return response.internalServerError({ success: false, message: 'Error updating role', error })
    }
  }

  public async getRoleWithPermissions({ params, response }: HttpContext) {
    const role = await Role.query().where('id', params.id).preload('permissions').first()

    if (!role) {
      return response.notFound({ message: 'Role not found' })
    }

    return response.ok(role)
  }
}
