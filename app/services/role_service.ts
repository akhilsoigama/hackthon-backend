import { HttpContext } from "@adonisjs/core/http"
import Role from "#models/role"

export default class RolesService {
 public async getAllRoleWithPermissions({ response }: HttpContext) {
  try {
    console.time('RolesQueryTime')
    
    const roles = await Role.query()
      .select(['id', 'role_name', 'role_key', 'role_description', 'created_at', 'updated_at'])
      .preload('permissions', (permissionsQuery) => {
        permissionsQuery.select(['id', 'permission_name', 'permission_key'])
      })
      .orderBy('role_name', 'asc')

    console.timeEnd('RolesQueryTime')
    console.log(`✅ Fetched ${roles.length} roles with permissions`)

    return response.ok({ 
      success: true, 
      data: roles,
      count: roles.length 
    })
  } catch (error) {
    console.error('❌ Error fetching roles with permissions:', error)
    return response.internalServerError({
      success: false,
      message: 'Error fetching roles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    try {
      // ✅ Check for duplicate role (by roleName or roleKey)
      const existingRole = await Role.query()
        .where('role_name', roleName)
        .orWhere('role_key', roleKey)
        .first()

      if (existingRole) {
        return response.conflict({
          success: false,
          message: 'A role with this name or key already exists',
        })
      }

      // ✅ Create Role
      const role = await Role.create({
        roleName,
        roleDescription,
        roleKey,
      })

      // ✅ Assign permissions
      if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
        await role.related('permissions').sync(permissionIds)
      }

      return response.created({
        success: true,
        message: 'Role created successfully',
        role,
      })
    } catch (error) {
      console.error('Error creating role:', error)
      return response.internalServerError({
        success: false,
        message: 'Error creating role',
        error,
      })
    }
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
      const existingRole = await Role.query()
        .where('role_name', roleName)
        .orWhere('role_key', roleKey)
        .first()

      if (existingRole) {
        return response.conflict({
          success: false,
          message: 'A role with this name or key already exists',
        })
      }
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

  public async deleteRole({ params, response }: HttpContext) {
    const role = await Role.findOrFail(params.id)
    await role.delete()
    return response.ok({ message: 'Role deleted successfully' })
  }

}
