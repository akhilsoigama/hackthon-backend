import messages from '#database/constants/messages';
import { inject } from '@adonisjs/core';
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from '../helper/error_handler.js';
import Institute from '#models/institute';
import Role from '#models/role';
import { createInstituteValidator, updateInstituteValidator } from '#validators/institute';
import { DateTime } from 'luxon';
import EmailService from './email_services.js';
import { generateCredentialPassword } from '../helper/password_generator.js';

@inject()
export default class instituteController {
  constructor(protected ctx: HttpContext) { }

  private isInstituteScopedUser(user: Awaited<ReturnType<instituteController['getAuthenticatedUser']>>) {
    return Boolean(user && 'userType' in user && String(user.userType) === 'institute')
  }

  private getScopeInstituteId(user: Awaited<ReturnType<instituteController['getAuthenticatedUser']>>) {
    if (!user || !('instituteId' in user)) {
      return null
    }

    const instituteId = user.instituteId
    return typeof instituteId === 'number' ? instituteId : null
  }

  private async getAuthenticatedUser() {
    try {
      const apiAuth = this.ctx.auth.use('api')
      const isApiAuth = await apiAuth.check()
      if (isApiAuth && apiAuth.user) {
        return apiAuth.user
      }
    } catch {
      // Try admin guard next
    }

    try {
      const adminAuth = this.ctx.auth.use('adminapi')
      const isAdminAuth = await adminAuth.check()
      if (isAdminAuth && adminAuth.user) {
        return adminAuth.user
      }
    } catch {
      // No authenticated user found in supported guards
    }

    return null
  }
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
      const authUser = await this.getAuthenticatedUser();
      const scopeInstituteId = this.getScopeInstituteId(authUser)
      let query = Institute.query()
        .preload('role', (q) => q.select(['id', 'roleName', 'roleKey']))
        .apply((scopes) => scopes.softDeletes());

      if (this.isInstituteScopedUser(authUser)) {
        query = query.where('id', scopeInstituteId || 0);
      }

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

      const requiredFields = ['instituteName', 'instituteEmail'];
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
      const instituteRole = await Role.query().where('roleKey', 'institute').first();

      if (!instituteRole) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Institute role not configured',
        });
      }

      const instituteData = {
        ...validatedData,
        institutePassword: generateCredentialPassword('INS'),
        instituteEmail: validatedData.instituteEmail,
        isActive: validatedData.isActive ?? true,
        roleId: instituteRole.id,
      };

      const institute = await Institute.create(instituteData);
      this.sendEmail(
        institute.instituteEmail,
        instituteData.institutePassword,
        'institute',
        institute.instituteName
      ).catch(err => {
        console.error('Email failed in background:', err);
      });
      return {
        status: true,
        message: messages.institute_created_successfully,
        data: institute,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        status: false,
        message: 'Failed to create institute',
        error: errorMessage,
      };
    }
  }
  async findOne() {
    try {
      const id = this.ctx.request.param('id');
      const authUser = await this.getAuthenticatedUser();
      const scopeInstituteId = this.getScopeInstituteId(authUser)

      if (!id || isNaN(Number(id))) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'Invalid institute ID',
        });
      }

      let instituteQuery = Institute.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .preload('role', (q) => q.select(['id', 'roleName', 'roleKey']))

      if (this.isInstituteScopedUser(authUser)) {
        instituteQuery = instituteQuery.where('id', scopeInstituteId || 0);
      }

      const institute = await instituteQuery.first();


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
      const authUser = await this.getAuthenticatedUser();
      const scopeInstituteId = this.getScopeInstituteId(authUser)

      if (requestData.instituteMobile) {
        requestData.instituteMobile = requestData.instituteMobile.toString().replace(/\D/g, '');
      }

      const validatedData = await updateInstituteValidator.validate(requestData);

      const existinginstitute = await Institute.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (!existinginstitute || (this.isInstituteScopedUser(authUser) && existinginstitute.id !== scopeInstituteId)) {
        return {
          status: false,
          message: messages.institute_not_found,
          data: null,
        };
      }

      existinginstitute.merge(validatedData);
      await existinginstitute.save();

      await existinginstitute.load('role', (q) => q.select(['id', 'roleName', 'roleKey']));


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
      const authUser = await this.getAuthenticatedUser()
      const scopeInstituteId = this.getScopeInstituteId(authUser)

      const institute = await Institute.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .first()

      if (!institute || (this.isInstituteScopedUser(authUser) && institute.id !== scopeInstituteId)) {
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
