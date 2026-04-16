import { inject } from '@adonisjs/core'
import RolesService from '#services/role_service'
import { HttpContext } from '@adonisjs/core/http'
@inject()
export default class RolesController {
  constructor(
    protected rolesService: RolesService,
    protected ctx: HttpContext
  ) { }

  async getAllRoleWithPermissions() {
    return this.rolesService.getAllRoleWithPermissions()
  }

  async createRoleWithPermissions() {
    return this.rolesService.createRoleWithPermissions()
  }

  async updateRole() {
    return this.rolesService.updateRole()
  }

  async getRoleWithPermissions() {
    return this.rolesService.getRoleWithPermissions()
  }

  async deleteRole() {
    return this.rolesService.deleteRole()
  }

}

