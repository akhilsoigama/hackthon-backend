import messages from "#database/constants/messages";
import Institute from "#models/institute";
import { updateInstituteValidator ,createInstituteValidator } from "#validators/institute";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from "../helper/error_handler.js";
import messages from '#database/constants/messages';
import Faculty from '#models/faculty';
import { createFacultyValidator, updateFacultyValidator } from '#validators/faculty';
import { inject } from '@adonisjs/core';
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from '../helper/error_handler.js';

@inject()
export default class FacultyController {
  constructor(protected ctx: HttpContext) {}

  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {

      let query = Faculty.query()
        .preload('department')
        .preload('institute')
        .preload('role')
        .apply((scopes) => scopes.softDeletes());

      if (searchFor === 'create') {
        query = query.where('isActive', true);
      }

      const faculties = await query;

      if (faculties && faculties.length > 0) {
        return {
          status: true,
          message: messages.faculty_fetched_successfully,
          data: faculties,
        };
      } else {

        return {
          status: false,
          message: messages.faculty_not_found,
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
      const requestData = this.ctx.request.all()
      const validatedData = await createInstituteValidator.validate(requestData);
      const institute = await Institute.create(validatedData)
     return {
        status: true,
        Message: messages.institute_created_successfully,
        Data: institute,
      }
      const requestData = this.ctx.request.all();

      const requiredFields = ['facultyName', 'facultyEmail', 'facultyPassword', 'designation'];
      for (const field of requiredFields) {
        if (!requestData[field]) {
          return this.ctx.response.status(400).send({
            status: false,
            message: `${field} is required`,
          });
        }
      }

      const existingFaculty = await Faculty.query()
        .where('facultyEmail', requestData.facultyEmail)
        .apply((scope) => scope.softDeletes())
        .first();

      if (existingFaculty) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Faculty with this email already exists',
        });
      }

      const validatedData = await createFacultyValidator.validate(requestData);
      const faculty = await Faculty.create({
        ...validatedData,
        facultyId: validatedData.facultyId || `FAC${Date.now()}`,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
      });


      return {
        status: true,
        message: 'Faculty created successfully',
        data: faculty,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to create faculty',
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
          message: 'Invalid faculty ID',
        });
      }

      const faculty = await Faculty.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .preload('department')
        .preload('institute')
        .preload('role')
        .first();


      if (faculty) {
        return {
          status: true,
          message: messages.faculty_fetched_successfully,
          data: faculty,
        };
      } else {
        return {
          status: false,
          message: messages.faculty_not_found,
          data: null,
        };
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

  async updateOne() {
    try {
      const id = this.ctx.request.param('id');
      const requestData = this.ctx.request.all();

      if (requestData.facultyMobile) {
        requestData.facultyMobile = requestData.facultyMobile.toString().replace(/\D/g, '');
      }

      const validatedData = await updateFacultyValidator.validate(requestData);

      const existingFaculty = await Faculty.find(id);
      if (!existingFaculty || existingFaculty.deletedAt) {
        return {
          status: false,
          message: messages.faculty_not_found,
          data: null,
        };
      }

      existingFaculty.merge(validatedData);
      await existingFaculty.save();

      await existingFaculty.load('department');
      await existingFaculty.load('institute');
      await existingFaculty.load('role');


      return {
        status: true,
        message: messages.faculty_updated_successfully,
        data: existingFaculty,
      };
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

  async deleteOne() {
    try {
      const id = this.ctx.request.param('id');

      const faculty = await Faculty.find(id);
      if (!faculty || faculty.deletedAt) {
        return {
          status: false,
          message: messages.faculty_not_found,
          data: null,
        };
      }

      faculty.deletedAt = new Date() as any;
      await faculty.save();


      return {
        status: true,
        message: messages.common_messages_record_deleted,
        data: null,
      };
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }
}