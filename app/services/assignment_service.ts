import messages from '#database/constants/messages'
import Assignment from '#models/assignment'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import { createAssignmentValidator, updateAssignmentValidator } from '#validators/assignment'
import { DateTime } from 'luxon'
import AssignmentRepository from '../repositories/assignment_repository.js'
import { parseListQuery } from '../helper/list_query.js'
import apiCacheService from './api_cache_service.js'

@inject()
export default class AssignmentService {
  private readonly assignmentRepository = new AssignmentRepository()
  constructor(protected ctx: HttpContext) {}

  private async getAuthenticatedUser() {
    try {
      return await this.ctx.auth.authenticate()
    } catch {
      return null
    }
  }

  private setSecurityHeaders() {
    this.ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    this.ctx.response.header('Cross-Origin-Resource-Policy', 'cross-origin')
    this.ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  }

  private invalidateAssignmentCache() {
    apiCacheService.invalidateByPrefix('assignments:list:')
    apiCacheService.invalidateByPrefix('assignments:one:')
  }

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      const {
        page,
        limit,
        search,
        withDeleted,
        searchFor: searchForQuery,
      } = parseListQuery(this.ctx)
      const requestFacultyId = Number(this.ctx.request.input('facultyId'))
      const authUser = await this.getAuthenticatedUser()
      const effectiveSearchFor = searchForQuery || searchFor || undefined

      let facultyId: number | undefined = undefined
      let instituteId: number | undefined = undefined

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).json({
            status: false,
            message: 'faculty not associated with this user.',
            data: null,
          })
        }
        facultyId = authUser.facultyId
      } else if (Number.isFinite(requestFacultyId) && requestFacultyId > 0) {
        facultyId = requestFacultyId
      }

      if (authUser?.userType === 'institute') {
        instituteId = authUser.instituteId
      }

      const cacheKey = `assignments:list:${JSON.stringify({
        page,
        limit,
        search,
        withDeleted,
        facultyId,
        instituteId,
        searchFor: effectiveSearchFor,
      })}`

      const paginated = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          return this.assignmentRepository.list(
            {
              facultyId,
              instituteId,
              search,
              withDeleted,
              onlyActive: effectiveSearchFor === 'create',
            },
            page,
            limit
          )
        },
        ['assignments']
      )

      const assignment = paginated.all()
      return {
        status: assignment.length > 0,
        messages:
          assignment.length > 0
            ? messages.assignment_fetched_successfully
            : messages.assignment_not_found,
        data: assignment,
        meta: {
          total: paginated.total,
          perPage: paginated.perPage,
          currentPage: paginated.currentPage,
          lastPage: paginated.lastPage,
        },
      }
    } catch (error) {
      console.error('FindAll Error:', error)
      return {
        status: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async create() {
    try {
      this.setSecurityHeaders()
      const requestData = this.ctx.request.all()
      const authUser = await this.getAuthenticatedUser()

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).send({
            status: false,
            message: 'faculty not associated with this user.',
          })
        }

        if (requestData.facultyId && Number(requestData.facultyId) !== authUser.facultyId) {
          return this.ctx.response.status(403).send({
            status: false,
            message: 'You can only create assignments for your own faculty.',
          })
        }

        requestData.facultyId = authUser.facultyId
      }

      const requiredFields = ['assignmentTitle', 'subject', 'assignmentFile', 'std']
      for (const field of requiredFields) {
        if (!requestData[field]) {
          return this.ctx.response.status(400).send({
            status: false,
            message: `${field} is required`,
          })
        }
      }
      const velidatedData = await createAssignmentValidator.validate(requestData)
      const existing = await Assignment.query()
        .where('institute_id', velidatedData.instituteId)
        .where('faculty_id', velidatedData.facultyId)
        .where('department_id', velidatedData.departmentId)
        .where('assignmentTitle', velidatedData.assignmentTitle)
        .where('dueDate', velidatedData.dueDate!)
        .first()

      if (existing) {
        return this.ctx.response.status(409).send({
          status: false,
          message: 'Assignment already exists for this class and date',
        })
      }

      const assignment = await Assignment.create({
        ...velidatedData,
        createdBy: authUser?.id,
        updatedBy: authUser?.id,
        isActive: velidatedData.isActive ?? true,
        dueDate: velidatedData.dueDate ? DateTime.fromJSDate(velidatedData.dueDate) : undefined,
      })

      this.invalidateAssignmentCache()

      return {
        status: true,
        messages: messages.assignemnt_created_successfully,
        data: assignment,
      }
    } catch (error) {
      return {
        status: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async update() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()
      const validatedData = await updateAssignmentValidator.validate(requestData)
      const authUser = await this.getAuthenticatedUser()
      const existingAssignment = await Assignment.find(id)
      if (!existingAssignment || existingAssignment.deletedAt) {
        return {
          status: false,
          message: messages.assignment_not_found,
          data: null,
        }
      }

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).send({
            status: false,
            message: 'faculty not associated with this user.',
          })
        }

        if (existingAssignment.facultyId !== authUser.facultyId) {
          return this.ctx.response.status(403).send({
            status: false,
            message: 'You are not allowed to update this assignment.',
          })
        }

        if (
          validatedData.facultyId !== undefined &&
          Number(validatedData.facultyId) !== authUser.facultyId
        ) {
          return this.ctx.response.status(403).send({
            status: false,
            message: 'You cannot change assignment ownership.',
          })
        }

        validatedData.facultyId = authUser.facultyId
      }

      const updatePayload = {
        ...validatedData,
        updatedBy: authUser?.id || existingAssignment.updatedBy,
        dueDate:
          validatedData.dueDate !== undefined
            ? validatedData.dueDate
              ? DateTime.fromJSDate(validatedData.dueDate)
              : null
            : undefined,
      }

      existingAssignment.merge(updatePayload)
      await existingAssignment.save()

      this.invalidateAssignmentCache()

      await existingAssignment.load('department')
      await existingAssignment.load('institute')
      await existingAssignment.load('faculty')
      return {
        status: true,
        messages: messages.assignment_updated_successfully,
        data: existingAssignment,
      }
    } catch (error) {
      return {
        status: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async findOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      const authUser = await this.getAuthenticatedUser()
      let facultyId: number | undefined
      let instituteId: number | undefined

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).send({
            status: false,
            message: 'faculty not associated with this user.',
          })
        }

        facultyId = authUser.facultyId
      }

      if (authUser?.userType === 'institute') {
        instituteId = authUser.instituteId
      }

      const assignment = await apiCacheService.getOrSet(
        `assignments:one:${id}:faculty:${facultyId || 'all'}:institute:${instituteId || 'all'}`,
        30_000,
        async () => this.assignmentRepository.findById(Number(id), facultyId, instituteId),
        ['assignments']
      )

      if (!assignment) {
        return this.ctx.response.status(404).send({
          status: false,
          message: messages.institute_event_not_found,
        })
      }
      return {
        status: !!assignment,
        messages: assignment
          ? messages.assignment_fetched_successfully
          : messages.assignment_not_found,
        data: assignment,
      }
    } catch (error) {
      this.setSecurityHeaders()
      return {
        status: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async deleteOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      const authUser = await this.getAuthenticatedUser()
      const assignment = await Assignment.find(id)
      if (!assignment || assignment.deletedAt) {
        return {
          status: false,
          message: messages.assignment_not_found,
          data: null,
        }
      }

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).send({
            status: false,
            message: 'faculty not associated with this user.',
          })
        }

        if (assignment.facultyId !== authUser.facultyId) {
          return this.ctx.response.status(403).send({
            status: false,
            message: 'You are not allowed to delete this assignment.',
          })
        }
      }

      assignment.deletedAt = DateTime.now()
      assignment.updatedBy = authUser?.id || assignment.updatedBy
      await assignment.save()

      this.invalidateAssignmentCache()

      return {
        status: true,
        messages: messages.common_messages_record_deleted,
        data: assignment,
      }
    } catch (error) {
      this.setSecurityHeaders()
      return {
        status: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}
