import messages from '#database/constants/messages'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import Student from '#models/student'
import { studentCreateValidator, studentUpdateValidator } from '#validators/student'
import { DateTime } from 'luxon'
import EmailService from './email_services.js'

@inject()
export default class StudentServices {
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
      const student = await Student.create({
        ...validatedData,
        studentId: validatedData.studentId || `STU${Date.now()}`,
        isActive: validatedData.isActive ?? true,
      })
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
      const { instituteId, withDeleted } = this.ctx.request.qs();

      let query = Student.query()
        .preload('role')
        .preload('department')
        .preload('institute')

      // Check if user is authenticated
      let authUser = null;
      try {
        authUser = await this.ctx.auth.authenticate();
      } catch (authError) {
        authUser = null;
      }

      if (!withDeleted || withDeleted === 'false') {
        query = query.whereNull('deleted_at');
      }

      if (authUser?.userType === 'institute') {
        const userWithAny = authUser as any;
        const instituteId = userWithAny.instituteId;

        if (!instituteId) {
          return {
            status: false,
            message: 'Institute ID not found for user',
            data: null,
          }
        }

        query = query.where('institute_id', instituteId);
      }
      else if (instituteId) {
        query = query.where('institute_id', Number(instituteId));
      }

      if (searchFor === 'create') {
        query = query.where('is_active', true)
      }

      const students = await query

      return {
        status: true,
        message: students.length > 0
          ? messages.student_fetched_successfully
          : messages.student_not_found,
        data: students,
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

      if (requestData.studentMobile) {
        requestData.studentMobile = requestData.studentMobile.toString().replace(/\D/g, '')
      }

      const validatedData = await studentUpdateValidator.validate(requestData)

      const existingStudent = await Student.query()
        .where('id', id)
        .whereNull('deleted_at')
        .first()

      if (!existingStudent) {
        return {
          status: false,
          message: messages.student_not_found,
          data: null,
        }
      }

      existingStudent.merge(validatedData)
      await existingStudent.save()

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

      const student = await Student.query()
        .where('id', id)
        .whereNull('deleted_at')
        .preload('department')
        .preload('institute')
        .preload('role')
        .first()

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
      const id = this.ctx.request.param('id');
      const student = await Student.findOrFail(id)
      await student.delete()

      if (!student) {
        return {
          status: false,
          message: messages.student_not_found,
          data: null,
        }
      }

      student.deletedAt = DateTime.now()
      await student.save()

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

