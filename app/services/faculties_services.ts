import messages from '#database/constants/messages'
import Faculty from '#models/faculty'
import { createFacultyValidator, updateFacultyValidator } from '#validators/faculty'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'

@inject()
export default class FacultyController {
  constructor(protected ctx: HttpContext) {}

  async findAll({ searchFor }: { searchFor?: string | null }) {
    try {
      let query = Faculty.query().apply((scopes) => scopes.softDeletes())
      if (searchFor === 'create') {
        query = query.where('isActive', true)
      }
      const Faculties = await query
      if (Faculties && Array.isArray(Faculties) && Faculties.length > 0) {
        return {
          status: true,
          Message: messages.faculty_fetched_successfully,
          Data: Faculties,
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

      const validatedData = await createFacultyValidator.validate(requestData)

      const faculty = await Faculty.create(validatedData)

      return {
        status: true,
        Message: messages.faculty_created_successfully,
        Data: faculty,
      }
    } catch (error) {
      console.error('Department creation error:', error)
      return {
        status: false,
        Message: messages.faculty_creation_failed,
        error: errorHandler(error),
        data: [],
      }
    }
  }

  async findOne() {
    try {
      const id = this.ctx.request.param('id')
      const faculty = await Faculty.query()
        .where('id', id)
        .apply((scope) => scope.softDeletes())
        .firstOrFail()

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
          data: [],
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
      const validatedData = await updateFacultyValidator.validate(requestData)
      const faculty = await Faculty.query()
        .whereILike('facultyName', validatedData.facultyName!.trim())
        .whereNot('id', id)
        .apply((scope) => scope.softDeletes())
        .first()
      if (faculty) {
        return {
          status: false,
          Message: messages.faculty_already_exists,
          Data: null,
        }
      }
      const FacultiesData = await Faculty.findOrFail(id)
      FacultiesData.merge(validatedData)
      await FacultiesData.save()
      return {
        status: true,
        Message: messages.faculty_updated_successfully,
        Data: FacultiesData,
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
      const faculty = await Faculty.findOrFail(id)
      await faculty.delete()
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
