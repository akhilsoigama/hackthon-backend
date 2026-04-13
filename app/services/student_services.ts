import messages from '#database/constants/messages'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import Student from '#models/student'
import User from '#models/user'
import Role from '#models/role'
import { studentCreateValidator, studentUpdateValidator } from '#validators/student'
import db from '@adonisjs/lucid/services/db'
import EmailService from './email_services.js'
import StudentRepository from '../repositories/student_repository.js'
import { parseListQuery } from '../helper/list_query.js'
import apiCacheService from './api_cache_service.js'

type AuthUserScope = {
  id: number
  userType?: string | null
  instituteId?: number | null
}

@inject()
export default class StudentServices {
  private readonly studentRepository = new StudentRepository()

  constructor(protected ctx: HttpContext) { }

  private async getAuthenticatedUser() {
    try {
      return await this.ctx.auth.authenticate()
    } catch {
      return null
    }
  }

  private getRequestInstituteId() {
    const instituteId = Number(this.ctx.request.qs().instituteId)
    return Number.isFinite(instituteId) && instituteId > 0 ? instituteId : undefined
  }

  private getEffectiveInstituteId(authUser?: AuthUserScope | null) {
    return authUser?.instituteId || this.getRequestInstituteId()
  }

  private getListCacheKey(params: {
    page: number
    limit: number
    search?: string
    searchFor?: string
    withDeleted?: boolean
    instituteId?: number
    authUserId?: number | null
    authUserType?: string | null
  }) {
    return `students:list:${JSON.stringify(params)}`
  }

  private invalidateStudentCache() {
    apiCacheService.invalidateByPrefix('students:list:')
    apiCacheService.invalidateByPrefix('students:one:')
  }
  private async sendEmail(email: string, password: string, userType: string, name: string) {
    try {
      const emailService = new EmailService();
      await emailService.sendCredentialsEmail(email, password, userType, name);
      return true;
    } catch (error) {
      console.error('Email sending failed (but continuing):', error);
      return false;
    }
  }
  async create() {
    try {
      const requestData = this.ctx.request.all()

      const existingStudent = await Student.query()
        .where('student_email', requestData.studentEmail)
        .whereNull('deleted_at')
        .first()

      if (existingStudent) {
        return this.ctx.response.status(422).send({
          status: false,
          message: messages.student_already_exists,
        })
      }

      const validatedData = await studentCreateValidator.validate(requestData)
      const plainPassword = validatedData.studentPassword;
      const authUser = await this.getAuthenticatedUser()
      const studentRole = await Role.query().where('roleKey', 'student').first()

      if (!studentRole) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Student role not configured',
        })
      }

      const student = await Student.create({
        ...validatedData,
        roleId: studentRole.id,
        instituteId: authUser?.userType === 'institute' && authUser.instituteId
          ? authUser.instituteId
          : validatedData.instituteId,
        studentId: validatedData.studentId || `STU${Date.now()}`,
        isActive: validatedData.isActive ?? true,
        createdBy: authUser?.id,
        updatedBy: authUser?.id,
      })

      this.invalidateStudentCache()

      this.sendEmail(
        student.studentEmail,
        plainPassword,
        'student',
        student.studentName
      ).catch(err => {
        console.error('Email failed in background:', err);
      });
      return this.ctx.response.status(201).send({
        status: true,
        message: messages.student_created_successfully,
        data: student,
      })
    } catch (error) {
      console.log(error)
      return {
        status: false,
        message: messages.student_creation_failed,
        error: errorHandler(error),
      }
    }
  }

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      const authUser = await this.getAuthenticatedUser()
      const { page, limit, search, withDeleted, searchFor: searchForQuery } = parseListQuery(this.ctx)
      const requestedInstituteId = Number(this.ctx.request.input('instituteId'))
      const effectiveSearchFor = searchForQuery || searchFor || undefined

      const instituteId = authUser?.userType === 'institute'
        ? authUser.instituteId
        : Number.isFinite(requestedInstituteId) && requestedInstituteId > 0
          ? requestedInstituteId
          : undefined

      if (authUser?.userType === 'institute' && !instituteId) {
        return {
          status: false,
          message: 'Institute ID not found for user',
          data: null,
        }
      }

      const cacheKey = this.getListCacheKey({
        page,
        limit,
        search,
        searchFor: effectiveSearchFor,
        withDeleted,
        instituteId,
        authUserId: authUser?.id ?? null,
        authUserType: authUser?.userType ?? null,
      })

      const paginated = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          return this.studentRepository.list(
            {
              instituteId,
              search,
              onlyActive: effectiveSearchFor === 'create',
              withDeleted,
            },
            page,
            limit,
            authUser
          )
        },
        ['students']
      )

      const students = paginated.all()

      return {
        status: true,
        message: students.length > 0
          ? messages.student_fetched_successfully
          : messages.student_not_found,
        data: students,
        meta: {
          total: paginated.total,
          perPage: paginated.perPage,
          currentPage: paginated.currentPage,
          lastPage: paginated.lastPage,
        },
      }
    } catch (error) {
      console.log(error)
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async updateOne() {
    try {
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()
      const authUser = await this.getAuthenticatedUser()
      const authInstituteId = this.getEffectiveInstituteId(authUser as AuthUserScope | null)

      if (requestData.studentMobile) {
        requestData.studentMobile = requestData.studentMobile.toString().replace(/\D/g, '')
      }

      const validatedData = await studentUpdateValidator.validate(requestData)

      const existingStudentQuery = Student.query()
        .where('id', id)
        .whereNull('deleted_at')

      if (authUser?.userType !== 'super_admin') {
        existingStudentQuery.where((scope) => {
          scope.where('created_by', authUser?.id || 0)

          if (authInstituteId) {
            scope.orWhere('institute_id', authInstituteId)
          }
        })
      }

      const existingStudent = await existingStudentQuery.first()
      if (!existingStudent) {
        return {
          status: false,
          message: messages.student_not_found,
          data: null,
        }
      }

      existingStudent.merge(validatedData)
      existingStudent.updatedBy = authUser?.id || existingStudent.updatedBy
      await existingStudent.save()

      this.invalidateStudentCache()

      await existingStudent.load('department')
      await existingStudent.load('institute')
      await existingStudent.load('role')

      return {
        status: true,
        message: messages.student_updated_successfully,
        data: existingStudent,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.student_update_failed,
        error: errorHandler(error),
      }
    }
  }

  async findOne() {
    try {
      const id = this.ctx.request.param('id')
      const authUser = await this.getAuthenticatedUser()
      const studentId = Number(id)
      const instituteId = authUser?.userType === 'institute'
        ? this.getEffectiveInstituteId(authUser as AuthUserScope | null)
        : undefined

      const student = await apiCacheService.getOrSet(
        `students:one:${studentId}:institute:${instituteId || 'all'}:auth:${authUser?.id || 'guest'}:${authUser?.userType || 'none'}`,
        30_000,
        async () => this.studentRepository.findById(studentId, instituteId, authUser),
        ['students']
      )

      if (!student) {
        return {
          status: false,
          message: messages.student_not_found,
          data: null,
        }
      }

      return {
        status: true,
        message: messages.student_fetched_successfully,
        data: student,
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
      const authUser = await this.getAuthenticatedUser()
      const authInstituteId = this.getEffectiveInstituteId(authUser as AuthUserScope | null)

      const studentQuery = Student.query()
        .where('id', id)
        .whereNull('deleted_at')

      if (authUser?.userType !== 'super_admin') {
        studentQuery.where((scope) => {
          scope.where('created_by', authUser?.id || 0)

          if (authInstituteId) {
            scope.orWhere('institute_id', authInstituteId)
          }
        })
      }

      const student = await studentQuery.first()

      if (!student) {
        return {
          status: false,
          message: messages.student_not_found,
          data: null,
        }
      }

      const trx = await db.transaction()
      try {
        await User.query({ client: trx })
          .where('student_id', student.id)
          .where('user_type', 'student')
          .delete()

        student.useTransaction(trx)
        await student.delete()

        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }

      this.invalidateStudentCache()

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

