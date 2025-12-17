import messages from '#database/constants/messages';
import { inject } from '@adonisjs/core';
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from '../helper/error_handler.js';
import Institute from '#models/institute';
import { createInstituteValidator, updateInstituteValidator } from '#validators/institute';
import { DateTime } from 'luxon';

@inject()
export default class instituteController {
  constructor(protected ctx: HttpContext) { }

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      let query = Institute.query()
        .preload('role')
        .apply((scopes) => scopes.softDeletes());

      if (searchFor === 'create') {
        query = query.where('isActive', true);
      }

      const institute = await query;

      if (institute && institute.length > 0) {
        return {
          status: true,
          message: messages.indtitute_fetched_successfully,
          data: institute,
        };
      } else {
        return {
          status: false,
          message: messages.institute_not_found,
          data: [],
        };
      }
    } catch (error) {
      console.error('Error in findAll:', error);
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

  async create() {
    try {
      const requestData = this.ctx.request.all();

      const requiredFields = ['instituteName', 'instituteEmail', 'institutePassword'];
      for (const field of requiredFields) {
        if (!requestData[field]) {
          return this.ctx.response.status(400).send({
            status: false,
            message: `${field} is required`,
          });
        }
      }

      const existingInstitute = await Institute.query()
        .where('instituteEmail', requestData.instituteEmail)
        .apply((scope) => scope.softDeletes())
        .first();

      if (existingInstitute) {
        return this.ctx.response.status(422).send({
          status: false,
          message: messages.institute_already_exists,
        });
      }

      const validatedData = await createInstituteValidator.validate(requestData);

      const instituteData = {
        ...validatedData,
        instituteEmail: validatedData.instituteEmail,
        isActive: validatedData.isActive ?? true,
        roleId: validatedData.roleId ?? undefined,
      };

      const institute = await Institute.create(instituteData);

      return {
        status: true,
        message: messages.institute_created_successfully,
        data: institute,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to create institute',
        error: error.message,
      };
    }
  }
  async findOne() {
    try {
      const id = this.ctx.request.param('id');

      if (!id || isNaN(Number(id))) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'Invalid institute ID',
        });
      }

      const institute = await Institute.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .preload('role')
        .first();


      if (institute) {
        return {
          status: true,
          message: messages.indtitute_fetched_successfully,
          data: institute,
        };
      } else {
        return {
          status: false,
          message: messages.institute_not_found,
          data: null,
        };
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_no_record_found,
        error: errorHandler(error),
      }
    }
  }
  async updateOne() {
    try {
      const id = this.ctx.request.param('id');
      const requestData = this.ctx.request.all();

      if (requestData.instituteMobile) {
        requestData.instituteMobile = requestData.instituteMobile.toString().replace(/\D/g, '');
      }

      const validatedData = await updateInstituteValidator.validate(requestData);

      const existinginstitute = await Institute.find(id);
      if (!existinginstitute || existinginstitute.deletedAt) {
        return {
          status: false,
          message: messages.institute_not_found,
          data: null,
        };
      }

      existinginstitute.merge(validatedData);
      await existinginstitute.save();

      await existinginstitute.load('role');


      return {
        status: true,
        message: messages.institute_updated_successfully,
        data: existinginstitute,
      };
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

      const institute = await Institute.find(id)

      if (!institute || institute.deletedAt) {
        return {
          status: false,
          message: messages.institute_not_found,
          data: null,
        }
      }

      institute.deletedAt = DateTime.now()
      await institute.save()

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