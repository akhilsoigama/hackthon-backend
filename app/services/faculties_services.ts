import messages from '#database/constants/messages';
import Faculty from '#models/faculty';
import { createFacultyValidator, updateFacultyValidator } from '#validators/faculty';
import { inject } from '@adonisjs/core';
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from '../helper/error_handler.js';
import EmailService from './email_services.js';

@inject()
export default class FacultyController {
  constructor(protected ctx: HttpContext) { }
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
  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      const { withDeleted, instituteId } = this.ctx.request.qs();

      let query = Faculty.query()
        .preload('department')
        .preload('institute')
        .preload('role');

      let authUser = null;
      try {
        authUser = await this.ctx.auth.authenticate();
      } catch (authError) {
        authUser = null;
      }

      if (authUser?.userType === 'institute') {
        if (!authUser.instituteId) {
          return this.ctx.response.status(400).json({
            status: false,
            message: 'Institute not associated with this user.',
            data: null,
          });
        }
        query = query.where('institute_id', authUser.instituteId);
      }
      else if (instituteId) {
        query = query.where('institute_id', Number(instituteId));
      }

      if (!withDeleted || withDeleted === 'false') {
        query = query.apply((scopes) => scopes.softDeletes());
      }

      if (searchFor === 'create') {
        query = query.where('is_active', true);
      }

      const faculties = await query;

      return {
        status: faculties.length > 0,
        message:
          faculties.length > 0
            ? messages.faculty_fetched_successfully
            : messages.faculty_not_found,
        data: faculties,
      };
    } catch (error) {
      console.error('FindAll Error:', error);
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
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (existingFaculty) {
        return this.ctx.response.status(422).send({
          status: false,
          message: messages.faculty_already_exists,
        });
      }

      const validatedData = await createFacultyValidator.validate(requestData);
      const plainPassword = validatedData.facultyPassword;

      const faculty = await Faculty.create({
        ...validatedData,
        facultyId: validatedData.facultyId || `FAC${Date.now()}`,
        isActive: validatedData.isActive ?? true,
      });

      this.sendEmail(
        faculty.facultyEmail,
        plainPassword,
        'faculty',
        faculty.facultyName
      ).catch(err => {
        console.error('Email failed in background:', err);
      });
      
      return {
        status: true,
        message: messages.faculty_created_successfully,
        data: faculty,
      };
    } catch (error) {
      console.error('Create Error:', error);
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

  // ========================= FIND ONE =========================
  async findOne() {
    try {
      const id = this.ctx.request.param('id');

      if (!id || isNaN(Number(id))) {
        return this.ctx.response.badRequest({
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

      return {
        status: !!faculty,
        message: faculty
          ? messages.faculty_fetched_successfully
          : messages.faculty_not_found,
        data: faculty,
      };
    } catch (error) {
      console.error('FindOne Error:', error);
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

  // ========================= UPDATE =========================
  async updateOne() {
    try {
      const id = this.ctx.request.param('id');
      const requestData = this.ctx.request.all();

      if (requestData.facultyMobile) {
        requestData.facultyMobile = requestData.facultyMobile
          .toString()
          .replace(/\D/g, '');
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
      console.error('Update Error:', error);
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
      console.error('Delete Error:', error);
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      };
    }
  }

}
