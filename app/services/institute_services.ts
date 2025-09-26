import messages from "#database/constants/messages";
import Institute from "#models/institute";
import { updateInstituteValidator } from "#validators/institute";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from "../helper/error_handler.js";

@inject()
export default class InstituteServices {
  constructor(protected ctx: HttpContext) { }

  async findAll({ searchFor }: { searchFor?: string | null }) {
    try {
      let query = Institute.query().apply((scopes) => scopes.softDeletes())
      if (searchFor === 'create') {
        query = query.where('isActive', true)
      }
      const institutes = await query
      if (institutes && Array.isArray(institutes) && institutes.length > 0) {
        return {
          status: true,
          Message: messages.indtitute_fetched_successfully,
          Data: institutes
        }
      } else {
        return {
          status: false,
          Message: messages.institute_not_found,
          Data: []
        }
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }

  async create() {
    try {
      const requestData = this.ctx.request.all()
      const institute = await Institute.create(requestData)
      const existingInstitute = await Institute.query().where('id', institute.id).apply((scope) => scope.softDeletes()).first()
      if (existingInstitute) {
        return {
          status: true,
          Message: messages.institute_created_successfully,
          Data: existingInstitute
        }
      } else if (!existingInstitute) {
        return {
          status: false,
          Message: messages.institute_not_found,
          Data: null
        }
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }
  async findOne() {
    try {
      const id = this.ctx.request.param('id')
      const institute = await Institute.query()
        .where('id', id)
        .apply((scope) => scope.softDeletes())
        .firstOrFail()
      return {
        status: true,
        message: messages.common_messages_record_available,
        data: institute,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_no_record_found,
        error: errorHandler(error),
      }
    }
  }
  async updateone() {
    try {
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()
      const validatedData = await updateInstituteValidator.validate({
        ...requestData,
        id,
      })
      const institute = await Institute.query()
        .whereRaw('LOWER(institute_name) = ?', [validatedData.instituteName!.trim().toLowerCase()])
        .whereNot('id', id)
        .apply((scope) => scope.softDeletes())
        .first()


      if (institute) {
        return this.ctx.response.status(422).send({
          status: false,
          message: messages.institute_already_exists,
          data: institute,
        })
      }
      const instituteToUpdate = await Institute.findOrFail(id)
      instituteToUpdate.merge(validatedData)
      await instituteToUpdate.save()
      return {
        status: true,
        message: messages.institute_updated_successfully,
        data: instituteToUpdate,
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }
  async deleteOne() {
    try {
      const id = this.ctx.request.param('id')
      const institute = await Institute.findOrFail(id)
      await institute.delete()  
      return {
        status: true,
        Message: messages.common_messages_record_deleted,
        Data: null
      }
    } catch (error) {
      return {
        status: false,
        Message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }

}
