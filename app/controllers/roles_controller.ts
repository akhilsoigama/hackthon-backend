import { inject } from '@adonisjs/core'
import RolesService from '#services/role_service'
import { HttpContext } from '@adonisjs/core/http'
@inject()
export default class RolesController {
  constructor(
    protected rolesService: RolesService,
    protected ctx: HttpContext
  ) {}

  async getAllRoleWithPermissions() {
    return this.rolesService.getAllRoleWithPermissions(this.ctx)
  }

  async createRoleWithPermissions() {
    return this.rolesService.createRoleWithPermissions(this.ctx)
  }

  async updateRole() {
    return this.rolesService.updateRole(this.ctx)
  }

  async getRoleWithPermissions() {
    return this.rolesService.getRoleWithPermissions(this.ctx)
  }

  async deleteRole() {
    return this.rolesService.deleteRole(this.ctx)
  }
}
