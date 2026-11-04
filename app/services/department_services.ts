// app/services/department_services.ts
import messages from '#database/constants/messages'
import Department from '#models/department'
import { createDepartmentValidator, updateDepartmentValidator } from '#validators/department'
import { inject } from '@adonisjs/core'
import { errorHandler } from '../helper/error_handler.js'
import { HttpContext } from '@adonisjs/core/http'
import apiCacheService from './api_cache_service.js'

@inject()
export default class DepartmentServices {
  constructor(protected ctx: HttpContext) {}

  private getAuthenticatedUser() {
    const ctx = this.ctx as any
    return ctx.user ?? ctx.authUser ?? this.ctx.auth.user ?? null
  }

  async findAll({ searchFor }: { searchFor?: string | null }) {
    try {
      const { withDeleted, instituteId } = this.ctx.request.qs()
      const authUser = this.getAuthenticatedUser()

      const cacheKey = `departments:list:${JSON.stringify({
        searchFor: searchFor || null,
        withDeleted: withDeleted === 'true',
        instituteId: instituteId ?? null,
        authUserId: authUser?.id ?? null,
        authUserType: authUser?.userType ?? null,
      })}`

      return await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          let query = Department.query()
            .apply((scopes) => scopes.softDeletes())
            .preload('institute')

          if (authUser?.userType === 'institute') {
            if (!authUser.instituteId) {
              return {
                status: false,
                message: 'Institute not associated with this user.',
                data: null,
              }
            }
            query = query.where('institute_id', authUser.instituteId)
          } else if (instituteId) {
            query = query.where('institute_id', Number(instituteId))
          }

          if (!withDeleted || withDeleted === 'false') {
            query = query.apply((scopes) => scopes.softDeletes())
          }

          if (searchFor === 'create') {
            query = query.where('isActive', true)
          }
          const departments = await query

          return {
            status: true,
            message:
              departments.length > 0
                ? messages.department_fetched_successfully
                : messages.department_not_found,
            data: departments,
          }
        },
        ['departments']
      )
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async create() {
    try {
      const requestData = this.ctx.request.all()
      const validatedData = await createDepartmentValidator.validate(requestData)

      const existingDepartment = await Department.query()
        .where('departmentName', validatedData.departmentName)
        .apply((scope) => scope.softDeletes())
        .first()

      if (existingDepartment) {
        return {
          status: false,
          message: messages.department_already_exists,
        }
      }

      const department = await Department.create(validatedData)
      apiCacheService.invalidateByPrefix('departments:')

      return {
        status: true,
        message: messages.department_created_successfully,
        data: department,
      }
    } catch (error) {
      console.error('❌ Department create error:', error)
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  // ✅ SIMPLIFIED: Accept ID directly with caching
  async findOne() {
    try {
      const id = this.ctx.request.param('id')
      const cacheKey = `departments:one:${id}`

      return await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          const department = await Department.query()
            .where('id', id)
            .apply((scope) => scope.softDeletes())
            .preload('institute')
            .firstOrFail()

          return {
            status: true,
            message: messages.department_fetched_successfully,
            data: department,
          }
        },
        [`departments-${id}`]
      )
    } catch (error) {
      return {
        status: false,
        message: messages.department_not_found,
        data: null,
        error: errorHandler(error),
      }
    }
  }

  async updateOne() {
    try {
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()
      const validatedData = await updateDepartmentValidator.validate(requestData)

      const department = await Department.query()
        .whereRaw('LOWER(department_name) = ?', [
          validatedData.departmentName!.trim().toLowerCase(),
        ])
        .whereNot('id', id)
        .apply((scope) => scope.softDeletes())
        .preload('institute')
        .first()

      if (department) {
        return {
          status: false,
          message: messages.department_already_exists,
          data: null,
        }
      }

      const departmentData = await Department.findOrFail(id)
      departmentData.merge(validatedData)
      await departmentData.save()
      apiCacheService.invalidateByPrefix('departments:')

      return {
        status: true,
        message: messages.department_updated_successfully,
        data: departmentData,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async deleteOne() {
    try {
      const id = this.ctx.request.param('id')
      const department = await Department.findOrFail(id)
      await department.delete()
      apiCacheService.invalidateByPrefix('departments:')

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
