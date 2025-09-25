import UserService from '#services/users_services'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}
  async index() {
    return this.userService.findAll()
  }

  async store({ request }: HttpContext) {
    const reqData = request.only(['fullName', 'email', 'password', 'mobile', 'roleIds'])
    return this.userService.create(reqData)
  }

  async assignRoles({ params, request, response }: HttpContext) {
    const userId = Number(params.id)
    const { roleIds } = request.only(['roleIds'])

    if (!Array.isArray(roleIds)) {
      return response.badRequest({ message: 'roleIds should be an array' })
    }

    const result = await this.userService.assignRoles(userId, roleIds)
    return response.ok(result)
  }

  async removeRole({ params, response }: HttpContext) {
    const userId = Number(params.id)
    const roleId = Number(params.roleId)

    const result = await this.userService.removeRole(userId, roleId)
    return response.ok(result)
  }

  async getUserRoles({ params, response }: HttpContext) {
    const userId = Number(params.id)
    const result = await this.userService.getUserRoles(userId)
    return response.ok(result)
  }

  async findAllByOrganization() {}

  async show() {}

  async update() {}

  async destroy() {}
}
