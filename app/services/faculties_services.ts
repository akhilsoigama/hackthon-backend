import messages from '#database/constants/messages'
import Faculty from '#models/faculty'
import { updateFacultyValidator } from '#validators/faculty'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'

@inject()
export default class FacultyController {
  constructor(protected ctx: HttpContext) {}

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      let query = Faculty.query()
        .preload('department')
        .preload('institute')
        .preload('role')
        // .apply((scopes) => scopes.softDeletes()) // ✅ Soft delete applied

      if (searchFor === 'create') {
        query = query.where('isActive', true)
      }

      const faculties = await query

      if (faculties && faculties.length > 0) {
        return {
          status: true,
          Message: messages.faculty_fetched_successfully,
          Data: faculties,
        }
      } else {
        return {
          status: false,
          Message: messages.faculty_not_found,
          Data: [],
        }
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async create() {
    try {
      const requestData = this.ctx.request.all()

      const requiredFields = ['facultyName', 'facultyEmail', 'facultyPassword', 'designation']
      for (const field of requiredFields) {
        if (!requestData[field]) {
          return this.ctx.response.status(400).send({
            status: false,
            message: `${field} is required`,
          })
        }
      }

      const existingFaculty = await Faculty.query()
        .where('facultyEmail', requestData.facultyEmail)
        .apply((scope) => scope.softDeletes()) // ✅ Soft delete applied
        .first()

      if (existingFaculty) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Faculty with this email already exists',
        })
      }

      const faculty = await Faculty.create({
        ...requestData,
        facultyId: requestData.facultyId || `FAC${Date.now()}`,
        isActive: requestData.isActive !== undefined ? requestData.isActive : true,
      })

      return {
        status: true,
        message: 'Faculty created successfully',
        data: faculty,
      }
    } catch (error) {
      return {
        status: false,
        message: 'Failed to create faculty',
        error: error.message,
      }
    }
  }

  async findOne() {
    try {
      const id = this.ctx.request.param('id')

      if (!id || isNaN(Number(id))) {
        return this.ctx.response.status(400).send({
          status: false,
          Message: 'Invalid faculty ID',
        })
      }

      const faculty = await Faculty.query()
        .where('id', id)
        // .apply((scopes) => scopes.softDeletes()) 
        .preload('department')
        .preload('institute')
        .preload('role')
        .first()

      if (faculty) {
        return {
          status: true,
          Message: messages.faculty_fetched_successfully,
          data: faculty,
        }
      } else {
        return {
          status: false,
          Message: messages.faculty_not_found,
          data: null,
        }
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async updateOne() {
    try {
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()

      if (requestData.facultyMobile) {
        requestData.facultyMobile = requestData.facultyMobile.toString().replace(/\D/g, '')
      }

      const validatedData = await updateFacultyValidator.validate(requestData)

      const existingFaculty = await Faculty.find(id)
      if (!existingFaculty || existingFaculty.deletedAt) { 
        return {
          status: false,
          Message: messages.faculty_not_found,
          Data: null,
        }
      }

      existingFaculty.merge(validatedData)
      await existingFaculty.save()

      await existingFaculty.load('department')
      await existingFaculty.load('institute')
      await existingFaculty.load('role')

      return {
        status: true,
        Message: messages.faculty_updated_successfully,
        Data: existingFaculty,
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  async deleteOne() {
    try {
      const id = this.ctx.request.param('id')

      const faculty = await Faculty.find(id)
      if (!faculty || faculty.deletedAt) { 
        return {
          status: false,
          Message: messages.faculty_not_found,
          Data: null,
        }
      }

      faculty.deletedAt = new Date() as any
      await faculty.save()

      return {
        status: true,
        Message: messages.common_messages_record_deleted,
        Data: null,
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}
