import Role from '#models/role'
import User from '#models/user'
import { createManyUserValidator, createUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import PermissionsResolverService from './permissions_resolver_service.js'
import { RoleKeys } from '#database/constants/Role'

@inject()
export default class UserService {
    permissionsResolverService: PermissionsResolverService
    constructor(private ctx: HttpContext) {
        this.permissionsResolverService = new PermissionsResolverService(ctx)
    }

    // Assign roles to a user
    async assignRoles(userId: number, roleIds: number[]) {
        try {
            const user = await User.find(userId)
            if (!user) {
                return { success: false, message: 'User not found' }
            }

            const roles = await Role.query().whereIn('id', roleIds)
            if (!roles.length) {
                return { success: false, message: 'Roles not found' }
            }

            //   await user.related('userRoles').sync(roleIds)

            return { success: true, message: 'Roles assigned successfully', user }
        } catch (error) {
            return errorHandler(error)
        }
    }

    // Remove a specific role from a user
    async removeRole(userId: number, roleId: number) {
        try {
            const user = await User.find(userId)
            if (!user) {
                return { success: false, message: 'User not found' }
            }

            await user.related('userRoles').detach([roleId])

            return { success: true, message: 'Role removed successfully' }
        } catch (error) {
            return errorHandler(error)
        }
    }

    // Get all roles assigned to a user
    async getUserRoles(userId: number) {
        try {
            const user = await User.query()
                .where('id', userId)
                .preload('userRoles', (roleQuery) => {
                    roleQuery.preload('permissions')
                })
                .first()

            if (!user) {
                return { success: false, message: 'User not found' }
            }

            return { success: true, data: user.userRoles }
        } catch (error) {
            return errorHandler(error)
        }
    }

    async getLoggedInUserRole({ roleId }: { roleId: number }) {
        const { user } = await this.permissionsResolverService.permissionResolver()

        const loggedInUser = await User.query()
            .where('id', user.id)
            .preload('userRoles', (pq) => pq.where('role_id', roleId))
            .firstOrFail()

        return {
            user: loggedInUser,
            roles: loggedInUser.userRoles,
        }
    }

    async getSystemUserRole() {
        const systemUser = await User.query().where('email', 'system@propry.tech').firstOrFail()

        const systemRole = await Role.query().where('roleKey', RoleKeys.super_admin).firstOrFail()

        return {
            systemUser,
            systemRole,
        }
    }

    async create(reqData: Partial<User> & { roleIds?: number[] }) {
        try {
            const createData = await createUserValidator.validate(reqData)
            const user = await User.create(createData)

            if (reqData.roleIds && reqData.roleIds.length > 0) {
                const roles = await Role.query().whereIn('id', reqData.roleIds)
                if (roles.length) {
                    await user.related('userRoles').sync(reqData.roleIds)
                }
            }

            return { data: user }
        } catch (e) {
            return errorHandler(e)
        }
    }

    async createMany(reqData: User[]) {
        try {
            const createData = await createManyUserValidator.validate(reqData)
            const users = await User.createMany(createData)
            return { data: users }
        } catch (e) {
            return errorHandler(e)
        }
    }

    async findAll() {
        try {
            const { roleKey } = this.ctx.request.qs()
            let userQuery = User.query().preload('userRoles')
            if (roleKey) {
                // const role = await Role.query().where('roleKey', roleKey).firstOrFail()
                // if ((role.roleAccessLevel as RoleAccessLevel) === RoleAccessLevel.organization) {
                //   userQuery = userQuery.whereHas('organization_role', (orgQuery) =>
                //     orgQuery.where(ORGANIZATION_USER + '.role_id', role.id)
                //   )
                // }
                // userQuery = userQuery.whereHas('userRoles', (roleQuery) => {
                //   roleQuery.where('role_key', roleKey)
                // })
            }
            const users = await userQuery
            return { data: users }
        } catch (e) {
            return errorHandler(e)
        }
    }
}
