// app/modules/users/repositories/UsersRepository.ts
import User from '#models/user'
import Role from '#models/role'
import type { PaginationInput } from '#shared/types/shared.types'

export default class UsersRepository {
  async findAll(input: PaginationInput & { instituteId?: number }) {
    const query = User.query()
      .preload('userRoles', (q) => q.preload('permissions'))

    if (input.instituteId) {
      query.where('instituteId', input.instituteId)
    }

    if (input.search) {
      query.where((q) => {
        q.whereILike('full_name', `%${input.search}%`)
          .orWhereILike('email', `%${input.search}%`)
      })
    }

    const sortBy = input.sortBy ?? 'createdAt'
    const sortOrder = input.sortOrder ?? 'desc'
    query.orderBy(sortBy, sortOrder)

    return query.paginate(input.page, input.limit)
  }

  async findById(id: number) {
    return User.query()
      .where('id', id)
      .preload('userRoles', (q) => q.preload('permissions'))
      .firstOrFail()
  }

  async create(data: {
    email: string
    fullName: string
    password: string
    mobile: string
    userType: string
    instituteId?: number
    isActive?: boolean
  }) {
    return User.create({
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      mobile: data.mobile,
      userType: data.userType as User['userType'],
      instituteId: data.instituteId,
      isActive: data.isActive ?? true,
      isEmailVerified: false,
      isMobileVerified: false,
    })
  }

  async update(id: number, data: Partial<{
    fullName: string
    mobile: string
    isActive: boolean
  }>) {
    const user = await User.findOrFail(id)
    user.merge(data)
    await user.save()
    return user
  }

  async delete(id: number) {
    const user = await User.findOrFail(id)
    await user.delete()
  }

  async getUserRoles(userId: number) {
    const user = await User.query()
      .where('id', userId)
      .preload('userRoles', (q) => q.preload('permissions'))
      .firstOrFail()
    return user.userRoles
  }

  async assignRoles(userId: number, roleIds: number[]) {
    const user = await User.findOrFail(userId)
    await user.related('userRoles').attach(roleIds)
    return user.related('userRoles').query().preload('permissions')
  }

  async removeRole(userId: number, roleId: number) {
    const user = await User.findOrFail(userId)
    await user.related('userRoles').detach([roleId])
  }

  async findRolesByIds(roleIds: number[]) {
    return Role.query().whereIn('id', roleIds)
  }
}
