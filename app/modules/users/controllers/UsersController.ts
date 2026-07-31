// app/modules/users/controllers/UsersController.ts
import type { HttpContext } from '@adonisjs/core/http'
import { ApiResponse } from '#shared/response/ApiResponse'
import { parsePaginationInput } from '#shared/pagination/Paginator'
import UsersService from '../services/UsersService.js'
import UsersRepository from '../repositories/UsersRepository.js'
import {
  createUserValidator,
  updateUserValidator,
  assignRolesValidator,
} from '../validators/UserValidator.js'

function makeService() {
  return new UsersService(new UsersRepository())
}

export default class UsersController {
  // GET /api/v1/users
  async index({ request, response }: HttpContext) {
    const qs = request.qs() as Record<string, unknown>
    const pagination = parsePaginationInput(qs)
    const instituteId = qs.instituteId ? Number(qs.instituteId) : undefined

    const svc = makeService()
    const result = await svc.list({ ...pagination, instituteId })

    return response.ok(ApiResponse.success(result.data, 'Users retrieved', 200, result.meta))
  }

  // GET /api/v1/users/:id
  async show({ params, response }: HttpContext) {
    const svc = makeService()
    const user = await svc.findById(Number(params.id))
    return response.ok(ApiResponse.success(user, 'User retrieved'))
  }

  // POST /api/v1/users
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const actorId = (auth.user as { id: number }).id

    const svc = makeService()
    const user = await svc.create(payload, actorId)

    return response.created(ApiResponse.created(user, 'User created successfully'))
  }

  // PUT /api/v1/users/:id
  async update({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateUserValidator)
    const actorId = (auth.user as { id: number }).id

    const svc = makeService()
    const user = await svc.update(Number(params.id), payload, actorId)

    return response.ok(ApiResponse.success(user, 'User updated successfully'))
  }

  // DELETE /api/v1/users/:id
  async destroy({ params, response, auth }: HttpContext) {
    const actorId = (auth.user as { id: number }).id
    const svc = makeService()
    await svc.delete(Number(params.id), actorId)

    return response.ok(ApiResponse.success(null, 'User deleted successfully'))
  }

  // GET /api/v1/users/:id/roles
  async getUserRoles({ params, response }: HttpContext) {
    const svc = makeService()
    const roles = await svc.getUserRoles(Number(params.id))
    return response.ok(ApiResponse.success(roles, 'Roles retrieved'))
  }

  // POST /api/v1/users/:id/roles
  async assignRoles({ params, request, response, auth }: HttpContext) {
    const { roleIds } = await request.validateUsing(assignRolesValidator)
    const actorId = (auth.user as { id: number }).id

    const svc = makeService()
    const roles = await svc.assignRoles(Number(params.id), roleIds, actorId)

    return response.ok(ApiResponse.success(roles, 'Roles assigned'))
  }

  // DELETE /api/v1/users/:id/roles/:roleId
  async removeRole({ params, response, auth }: HttpContext) {
    const actorId = (auth.user as { id: number }).id
    const svc = makeService()
    await svc.removeRole(Number(params.id), Number(params.roleId), actorId)

    return response.ok(ApiResponse.success(null, 'Role removed'))
  }
}
