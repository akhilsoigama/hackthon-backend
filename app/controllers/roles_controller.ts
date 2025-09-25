import { inject } from '@adonisjs/core'
import RolesService from '#services/role_service'
import { HttpContext } from '@adonisjs/core/http'
@inject()
export default class RolesController {
  constructor(
    protected rolesService: RolesService,
    protected ctx: HttpContext
  ) {}

  async getAllRoleWithPermissions(ctx: any) {
    return this.rolesService.getAllRoleWithPermissions(ctx)
  }

  async createRoleWithPermissions(ctx: any) {
    return this.rolesService.createRoleWithPermissions(ctx)
  }

  async updateRole(ctx: any) {
    return this.rolesService.updateRole(ctx)
  }

  async getRoleWithPermissions(ctx: any) {
    return this.rolesService.getRoleWithPermissions(ctx)
  }
}
