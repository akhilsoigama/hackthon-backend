import messages from '#database/constants/messages'
import Assignment from '#models/assignment'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import { createAssignmentValidator, updateAssignmentValidator } from '#validators/assignment'
import { DateTime } from 'luxon'

@inject()
export default class AssignmentService {
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

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      const { withDeleted, facultyId } = this.ctx.request.qs()
      let query = Assignment.query()
        .preload('department', (departmentQuery) =>
          departmentQuery.select(['id', 'departmentName'])
        )
        .preload('institute', (instituteQuery) => instituteQuery.select(['id', 'instituteName']))
        .preload('faculty', (facultyQuery) => facultyQuery.select(['id', 'facultyName']))
      const authUser = await this.getAuthenticatedUser()

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).json({
            status: false,
            message: 'faculty not associated with this user.',
            data: null,
          })
        }
        query = query.where('faculty_id', authUser.facultyId)
      } else if (facultyId) {
        query = query.where('faculty_id', Number(facultyId))
      }

      if (!withDeleted || withDeleted === 'false') {
        query = query.apply((scopes) => scopes.softDeletes())
      }

      if (searchFor === 'create') {
        query = query.where('is_active', true)
      }

      const assignment = await query
      return {
        status: assignment.length > 0,
        messages:
          assignment.length > 0
            ? messages.assignment_fetched_successfully
            : messages.assignment_not_found,
        data: assignment,
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
        isActive: velidatedData.isActive ?? true,
        dueDate: velidatedData.dueDate ? DateTime.fromJSDate(velidatedData.dueDate) : undefined,
      })
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
        dueDate:
          validatedData.dueDate !== undefined
            ? validatedData.dueDate
              ? DateTime.fromJSDate(validatedData.dueDate)
              : null
            : undefined,
      }

      existingAssignment.merge(updatePayload)
      await existingAssignment.save()

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
      let query = Assignment.query()
        .where('id', id)
        .apply((scope) => scope.softDeletes())
        .preload('department', (departmentQuery) =>
          departmentQuery.select(['id', 'departmentName'])
        )
        .preload('institute', (instituteQuery) => instituteQuery.select(['id', 'instituteName']))
        .preload('faculty', (facultyQuery) => facultyQuery.select(['id', 'facultyName']))

      if (authUser?.userType === 'faculty') {
        if (!authUser.facultyId) {
          return this.ctx.response.status(400).send({
            status: false,
            message: 'faculty not associated with this user.',
          })  
        }

        query = query.where('faculty_id', authUser.facultyId)
      }

      const assignment = await query.first()
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

      assignment.deletedAt = new Date() as any
      await assignment.save()
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
