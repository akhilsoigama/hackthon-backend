// app/modules/users/services/UsersService.ts
import UsersRepository from '../repositories/UsersRepository.js'
import { parsePaginationInput, buildPaginationMeta } from '#shared/pagination/Paginator'
import type { PaginationInput } from '#shared/types/shared.types'
import auditLogger from '#infrastructure/logging/AuditLogger'
import { invalidateUserPermissionCache } from '#services/permissions_resolver_service'

export default class UsersService {
  constructor(private readonly repo: UsersRepository) { }

  async list(input: PaginationInput & { instituteId?: number }) {
    const paginated = await this.repo.findAll(input)
    const meta = paginated.getMeta()
    return {
      data: paginated.all(),
      meta: buildPaginationMeta(meta.total, meta.currentPage, meta.perPage),
    }
  }

  async findById(id: number) {
    return this.repo.findById(id)
  }

  async create(data: {
    email: string
    fullName: string
    password: string
    mobile: string
    userType: string
    instituteId?: number
    isActive?: boolean
  }, actorId: number) {
    const user = await this.repo.create(data)
    auditLogger.dataMutation('data.create', actorId, 'User', user.id, { userType: data.userType })
    return user
  }

  async update(id: number, data: Partial<{ fullName: string; mobile: string; isActive: boolean }>, actorId: number) {
    const user = await this.repo.update(id, data)
    auditLogger.dataMutation('data.update', actorId, 'User', id)
    return user
  }

  async delete(id: number, actorId: number) {
    await this.repo.delete(id)
    auditLogger.dataMutation('data.delete', actorId, 'User', id)
  }

  async getUserRoles(userId: number) {
    return this.repo.getUserRoles(userId)
  }

  async assignRoles(userId: number, roleIds: number[], actorId: number) {
    const roles = await this.repo.assignRoles(userId, roleIds)
    auditLogger.log({ action: 'user.role.assign', actorId, targetId: userId, meta: { roleIds } })
    // Invalidate cached permissions so next request fetches fresh role data
    await invalidateUserPermissionCache(userId)
    return roles
  }

  async removeRole(userId: number, roleId: number, actorId: number) {
    await this.repo.removeRole(userId, roleId)
    auditLogger.log({ action: 'user.role.remove', actorId, targetId: userId, meta: { roleId } })
    // Invalidate cached permissions
    await invalidateUserPermissionCache(userId)
  }

  parsePagination(qs: Record<string, unknown>): PaginationInput {
    return parsePaginationInput(qs)
  }
}
