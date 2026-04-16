import { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import messages from '#database/constants/messages'
import { createRoleValidator, updateRoleValidator } from '#validators/role'
import { inject } from '@adonisjs/core'
import { errorHandler } from '../helper/error_handler.js'

@inject()
export default class RolesService {
  constructor(protected ctx: HttpContext) {}

  async getAllRoleWithPermissions() {
    try {
      const roles = await Role.query()
        .whereNull('deleted_at')
        .select([
          'id',
          'role_name',
          'role_key',
          'role_description',
          'created_at',
          'updated_at',
        ])
        .preload('permissions', (permissionsQuery) => {
          permissionsQuery.select(['id', 'permission_name', 'permission_key'])
        })
        .orderBy('role_name', 'asc')

      return {
        success: true,
        data: roles,
        count: roles.length,
      }
    } catch (error) {
      console.error('❌ Error fetching roles with permissions:', error)
      return {
        success: false,
        message: 'Error fetching roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }
    }
  }

 async createRoleWithPermissions() {
  try {
    const requestData = this.ctx.request.all()

    const existingRole = await Role.query()
      .whereNull('deleted_at')
      .where((query) => {
        query
          .where('role_name', requestData.roleName)
          .orWhere('role_key', requestData.roleKey)
      })
      .first()

    if (existingRole) {
      return {
        success: false,
        message: 'A role with this name or key already exists',
      }
    }

    const validatedData = await createRoleValidator.validate(requestData)

    const role = await Role.create(validatedData)

    if (requestData.permissionIds && Array.isArray(requestData.permissionIds) && requestData.permissionIds.length > 0) {
      await role.related('permissions').attach(requestData.permissionIds)
    }

    await role.load('permissions')

    return {
      success: true,
      message: 'Role created successfully',
      role,
    }
  } catch (error) {
    console.error('Error creating role:', error)
    return {
      success: false,
      message: 'Error creating role',
      error: errorHandler(error),
    }
  }
}

  async updateRole() {
  try {
    const id = this.ctx.request.param('id')
    const requestData = this.ctx.request.all()
    const validatedData = await updateRoleValidator.validate(requestData)

    const duplicateRole = await Role.query()
      .whereNull('deleted_at')
      .whereNot('id', id)
      .where((query) => {
        if (validatedData.roleName) {
          query.where('role_name', validatedData.roleName)
        }
        if (validatedData.roleKey) {
          query.orWhere('role_key', validatedData.roleKey)
        }
      })
      .first()

    if (duplicateRole) {
      return {
        success: false,
        message: 'A role with this name or key already exists',
      }
    }

    const role = await Role.query()
      .where('id', id)
      .whereNull('deleted_at')
      .firstOrFail()

    role.merge(validatedData)
    await role.save()

    if (requestData.permissionIds) {
      if (Array.isArray(requestData.permissionIds) && requestData.permissionIds.length > 0) {
        await role.related('permissions').sync(requestData.permissionIds)
      } else {
        await role.related('permissions').detach()
      }
    }

    await role.load('permissions')

    return {
      success: true,
      message: 'Role updated successfully',
      role,
    }
  } catch (error) {
    console.error('Error updating role:', error)
    return {
      success: false,
      message: 'Error updating role',
      error: errorHandler(error),
    }
  }
}

  async getRoleWithPermissions() {
    try {
      const id = this.ctx.request.param('id')

      const role = await Role.query()
        .where('id', id)
        .whereNull('deleted_at') 
        .preload('permissions')
        .first()

      if (!role) {
        return {
          success: false,
          message: 'Role not found',
        }
      }

      return {
        success: true,
        data: role,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching role',
        error: errorHandler(error),
      }
    }
  }

  async deleteRole() {
    try {
      const id = this.ctx.request.param('id')
      
      const role = await Role.query()
        .where('id', id)
        .whereNull('deleted_at')
        .firstOrFail()

      await role.delete()

      return {
        status: true,
        message: messages.common_messages_record_deleted,
        data: null,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}

