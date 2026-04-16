import messages from '#database/constants/messages'
import AssignmentUpload from '#models/assignment_upload'
import { assignmentUploadUpdateValidator } from '#validators/assignment_upload'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'

@inject()
export default class AssignmentUploadService {
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
      const { studentId, facultyId } = this.ctx.request.qs()
      let query = AssignmentUpload.query()
        .preload('Assignment')
        .preload('Student', (studentQuery) => {
          studentQuery.select('id', 'studentName', 'studentGrNo')
        })
        .preload('Faculty', (facultyQuery) => {
          facultyQuery.select('id', 'facultyName')
        })
        .preload('Department', (departmentQuery) => {
          departmentQuery.select('id', 'departmentName')
        })
        .preload('Institute', (instituteQuery) => {
          instituteQuery.select('id', 'instituteName')
        })
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

      if (authUser?.userType === 'student') {
        if (!authUser.studentId) {
          return this.ctx.response.status(400).json({
            status: false,
            message: 'student not associated with this user.',
            data: null,
          })
        }
        query = query.where('student_id', authUser.studentId)
      } else if (studentId) {
        query = query.where('student_id', Number(studentId))
      }
      if (searchFor === 'create') {
        query = query.where('isActive', true)
      }

      this.setSecurityHeaders()

      const assignmentUploadData = await query
      return {
        status: assignmentUploadData.length > 0,
        message:
          assignmentUploadData.length > 0
            ? messages.assignment_uploads_fetched_successfully
            : messages.assignment_uploads_not_found,
        data: assignmentUploadData,
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

async create() {
  try {
    this.setSecurityHeaders()
    const requestData = this.ctx.request.all()
    const authUser = await this.getAuthenticatedUser()

    if (authUser?.userType === 'student') {
      if (!authUser.studentId) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'student not associated with this user.',
        })
      }

      if (requestData.studentId && Number(requestData.studentId) !== authUser.studentId) {
        return this.ctx.response.status(403).send({
          status: false,
          message: 'You can only create assignments for your own student.',
        })
      }

      requestData.studentId = authUser.studentId
    }

    const requiredFields = ['assignmentId', 'studentId', 'assignmentFile', 'isActive']
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return this.ctx.response.status(400).send({
          status: false,
          message: `${field} is required`,
        })
      }
    }

    const existing = await AssignmentUpload.query()
      .where('assignment_id', Number(requestData.assignmentId))
      .where('student_id', Number(requestData.studentId))
      .apply((scope) => scope.softDeletes())
      .first()

    if (existing && !existing.isSubmitted) {
      const updated = await existing.merge(requestData).save()
      return {
        status: true,
        messages: messages.assignment_uploads_created_successfully,
        data: updated,
      }
    }

    if (existing && existing.isSubmitted) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'An upload for this assignment and student already exists.',
      })
    }

    const assignment = await AssignmentUpload.create(requestData)
    return {
      status: true,
      messages: messages.assignment_uploads_created_successfully,
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
  async findOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.params.id ?? this.ctx.request.input('id') ?? this.ctx.request.qs().id
      if (!id) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'id is required',
        })
      }
      const assignmentUpload = await AssignmentUpload.query()
        .where('id', Number(id))
        .apply((scope) => scope.softDeletes())
        .preload('Assignment')
        .preload('Student', (studentQuery) => {
          studentQuery.select('id', 'studentName', 'studentGrNo')
        })
        .preload('Faculty', (facultyQuery) => {
          facultyQuery.select('id', 'facultyName')
        })
        .preload('Department', (departmentQuery) => {
          departmentQuery.select('id', 'departmentName')
        })
        .preload('Institute', (instituteQuery) => {
          instituteQuery.select('id', 'instituteName')
        })
        .first()
      if (!assignmentUpload) {
        return this.ctx.response.status(404).send({
          status: false,
          message: messages.assignment_uploads_not_found,
        })
      }
      return {
        status: true,
        message: messages.assignment_uploads_fetched_successfully,
        data: assignmentUpload,
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
  async update() {
    try {
      this.setSecurityHeaders()

      const id = this.ctx.params.id ?? this.ctx.request.input('id') ?? this.ctx.request.qs().id
      if (!id) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'id is required',
        })
      }

      const requestData = this.ctx.request.all()
      const validatedData = await assignmentUploadUpdateValidator.validate(requestData)
      const assignmentUpload = await AssignmentUpload.query()
        .where('id', Number(id))
        .apply((scope) => scope.softDeletes())
        .preload('Student', (studentQuery) => {
          studentQuery.select('id', 'studentName', 'studentGrNo')
        })
        .first()
      if (assignmentUpload) {
        return {
          status: true,
          message: messages.assignment_uploads_already_exists,
          data: await assignmentUpload.merge(validatedData).save(),
        }
      }
      const newAssignmentUpload = await AssignmentUpload.create(validatedData)
      return {
        status: true,
        message: messages.assignment_uploads_created_successfully,
        data: newAssignmentUpload,
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

      const id = this.ctx.params.id ?? this.ctx.request.input('id') ?? this.ctx.request.qs().id
      if (!id) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'id is required',
        })
      }

      const assignmentUpload = await AssignmentUpload.query()
        .where('id', Number(id))
        .apply((scope) => scope.softDeletes())
        .first()

      if (!assignmentUpload) {
        return this.ctx.response.status(404).send({
          status: false,
          message: messages.assignment_uploads_not_found,
        })
      }

      await assignmentUpload.delete()
      return {
        status: true,
        message: messages.assignment_uploads_deleted_successfully,
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
