import messages from '#database/constants/messages';
import Faculty from '#models/faculty';
import User from '#models/user';
import AdminUser from '#models/admin_user';
import Department from '#models/department';
import Role from '#models/role';
import { createFacultyValidator, updateFacultyValidator } from '#validators/faculty';
import { inject } from '@adonisjs/core';
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from '../helper/error_handler.js';
import EmailService from './email_services.js';
import { generateCredentialPassword } from '../helper/password_generator.js';
import apiCacheService from './api_cache_service.js';
import { DateTime } from 'luxon';

type AuthUser = User | AdminUser | null

@inject()
export default class FacultyController {
  constructor(protected ctx: HttpContext) { }

  private invalidateFacultyCache() {
    apiCacheService.invalidateByPrefix('faculties:list:')
    apiCacheService.invalidateByPrefix('faculties:one:')
  }

  private isPrivilegedUser(authUser: AuthUser) {
    const userType = authUser?.userType
    return ['super_admin', 'admin', 'system_admin'].includes(String(userType))
  }

  private isInstituteScopedUser(authUser: AuthUser) {
    return String(authUser?.userType) === 'institute'
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
      // No authenticated user found
    }

    return null
  }
  private getAuthInstituteId(authUser: AuthUser) {
    if (!authUser || typeof authUser !== 'object') {
      return undefined
    }

    if ('instituteId' in authUser) {
      const parsedInstituteId = Number(authUser.instituteId)
      if (Number.isFinite(parsedInstituteId) && parsedInstituteId > 0) {
        return parsedInstituteId
      }
    }

    if (String(authUser.userType) === 'institute' && 'id' in authUser) {
      const parsedId = Number(authUser.id)
      if (Number.isFinite(parsedId) && parsedId > 0) {
        return parsedId
      }
    }

    return undefined
  }
  private getRequestInstituteId() {
    const instituteId = Number(this.ctx.request.qs().instituteId)
    return Number.isFinite(instituteId) && instituteId > 0 ? instituteId : undefined
  }
  private getEffectiveInstituteId(authUser: AuthUser) {
    return this.getAuthInstituteId(authUser) ?? this.getRequestInstituteId()
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
      const { withDeleted, instituteId } = this.ctx.request.qs();
      const authUser = await this.getAuthenticatedUser();
      const authInstituteId = this.getAuthInstituteId(authUser);
      const requestInstituteId = Number(instituteId)
      const effectiveInstituteId = authInstituteId || (Number.isFinite(requestInstituteId) && requestInstituteId > 0 ? requestInstituteId : undefined)
      const cacheKey = `faculties:list:${JSON.stringify({
        searchFor: searchFor || null,
        withDeleted: withDeleted === 'true',
        instituteId: effectiveInstituteId ?? null,
        authUserId: authUser?.id ?? null,
        authUserType: authUser?.userType ?? null,
      })}`

      const faculties = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          let query = Faculty.query()
            .preload('department', (q) => q.select(['id', 'departmentName']))
            .preload('institute', (q) => q.select(['id', 'instituteName']))
            .preload('role', (q) => q.select(['id', 'roleName', 'roleKey']))

          if (this.isInstituteScopedUser(authUser)) {
            if (effectiveInstituteId) {
              query = query.where('institute_id', effectiveInstituteId);
            } else {
              query = query.where('id', 0);
            }
          } else if (this.isPrivilegedUser(authUser) && instituteId) {
            query = query.where('institute_id', Number(instituteId));
          }

          if (!withDeleted || withDeleted === 'false') {
            query = query.apply((scopes) => scopes.softDeletes());
          }

          if (searchFor === 'create') {
            query = query.where('is_active', true);
          }

          return query
        },
        ['faculties']
      )

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

      const requiredFields = ['facultyName', 'facultyEmail', 'designation'];

      for (const field of requiredFields) {
        if (!requestData[field]) {
          return this.ctx.response.status(400).send({
            status: false,
            message: `${field} is required`,
          });
        }
      }

      // Check email uniqueness in both Faculty and User models
      const existingFaculty = await Faculty.query()
        .where('facultyEmail', requestData.facultyEmail)
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (existingFaculty) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Please enter unique email id, this email id already exist',
        });
      }

      const existingUser = await User.query()
        .where('email', requestData.facultyEmail)
        .first();

      if (existingUser) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Please enter unique email id, this email id already exist',
        });
      }

      const validatedData = await createFacultyValidator.validate(requestData);
      const authUser = await this.getAuthenticatedUser();
      const authInstituteId = this.getAuthInstituteId(authUser);
      const facultyRole = await Role.query().where('roleKey', 'faculty').first();
      const plainPassword = generateCredentialPassword('FAC');

      if (!facultyRole) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Faculty role not configured',
        });
      }

      // Generate department-wise unique faculty ID
      let generatedFacultyId = validatedData.facultyId;
      if (!generatedFacultyId) {
        const department = await Department.find(validatedData.departmentId);
        const deptCode = department?.departmentCode || `DEPT${validatedData.departmentId}`;
        
        // Count existing faculties in this department
        const existingCount = await Faculty.query()
          .where('departmentId', validatedData.departmentId)
          .apply((scopes) => scopes.softDeletes())
          .count('* as total');
        
        const nextNumber = (existingCount[0]?.$extras?.total || 0) + 1;
        generatedFacultyId = `${deptCode}${nextNumber.toString().padStart(4, '0')}`;
      }

      // Check faculty ID uniqueness within department
      const existingFacultyId = await Faculty.query()
        .where('facultyId', generatedFacultyId)
        .where('departmentId', validatedData.departmentId)
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (existingFacultyId) {
        return this.ctx.response.status(422).send({
          status: false,
          message: 'Faculty ID already exists in this department',
        });
      }

      const faculty = await Faculty.create({
        ...validatedData,
        facultyPassword: plainPassword,
        instituteId: this.isInstituteScopedUser(authUser) && authInstituteId
          ? authInstituteId
          : validatedData.instituteId,
        roleId: facultyRole.id,
        facultyId: generatedFacultyId,
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
      this.invalidateFacultyCache()
      
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
      const authUser = await this.getAuthenticatedUser();
      const effectiveInstituteId = this.getEffectiveInstituteId(authUser);

      if (!id || isNaN(Number(id))) {
        return this.ctx.response.badRequest({
          status: false,
          message: 'Invalid faculty ID',
        });
      }

      let facultyQuery = Faculty.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .preload('department', (q) => q.select(['id', 'departmentName']))
        .preload('institute', (q) => q.select(['id', 'instituteName']))
        .preload('role', (q) => q.select(['id', 'roleName', 'roleKey']));

      if (this.isInstituteScopedUser(authUser)) {
        facultyQuery = facultyQuery.where('institute_id', effectiveInstituteId || 0);
      }

      const faculty = await facultyQuery.first();

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

  async updateOne() {
    try {
      const id = this.ctx.request.param('id');
      const requestData = this.ctx.request.all();
      const authUser = await this.getAuthenticatedUser();
      const effectiveInstituteId = this.getEffectiveInstituteId(authUser);

      if (requestData.facultyMobile) {
        requestData.facultyMobile = requestData.facultyMobile
          .toString()
          .replace(/\D/g, '');
      }

      const validatedData = await updateFacultyValidator.validate(requestData);

      const existingFaculty = await Faculty.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (!existingFaculty || (this.isInstituteScopedUser(authUser) && existingFaculty.instituteId !== effectiveInstituteId)) {
        return {
          status: false,
          message: messages.faculty_not_found,
          data: null,
        };
      }

      existingFaculty.merge(validatedData);
      await existingFaculty.save();

      await existingFaculty.load('department', (q) => q.select(['id', 'departmentName']));
      await existingFaculty.load('institute', (q) => q.select(['id', 'instituteName']));
      await existingFaculty.load('role', (q) => q.select(['id', 'roleName', 'roleKey']));
      this.invalidateFacultyCache()

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
      const authUser = await this.getAuthenticatedUser();
      const effectiveInstituteId = this.getEffectiveInstituteId(authUser);

      const faculty = await Faculty.query()
        .where('id', id)
        .apply((scopes) => scopes.softDeletes())
        .first();

      if (!faculty || (this.isInstituteScopedUser(authUser) && faculty.instituteId !== effectiveInstituteId)) {
        return {
          status: false,
          message: messages.faculty_not_found,
          data: null,
        };
      }

      faculty.deletedAt = DateTime.local();
      await faculty.save();
      this.invalidateFacultyCache()

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

