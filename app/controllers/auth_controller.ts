// app/controllers/auth_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import AuthService from '#modules/auth/services/AuthService'
import TokenService from '#modules/auth/services/TokenService'
import UserRepository from '#modules/auth/repositories/UserRepository'
import type { AuthType } from '#modules/auth/types/auth.types'

function makeServices() {
  const userRepo = new UserRepository()
  const tokenService = new TokenService(userRepo)
  const authService = new AuthService(userRepo, tokenService)
  return { authService, tokenService }
}
import User from '#models/user'
import AdminUser from '#models/admin_user'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import Role from '#models/role'
import messages from '#database/constants/messages'
import Student from '#models/student'
import db from '@adonisjs/lucid/services/db'
import { ADMIN_AUTH_ACCESS_TOKENS, AUTH_ACCESS_TOKENS } from '#database/constants/table_names'
import env from '#start/env'
// import apiCacheService from '#services/api_cache_service'
// import type { AccessToken } from '@adonisjs/auth/access_tokens'

type AdminUserType = InstanceType<typeof AdminUser>
type AuthUserType = User | AdminUserType
const AUTH_COOKIE_NAME = env.get('AUTH_COOKIE_NAME') || 'token'

export default class AuthController {
  private getAuthCookieOptions() {
    const secure = env.get('AUTH_COOKIE_SECURE', env.get('NODE_ENV') === 'production')
    const domain = env.get('AUTH_COOKIE_DOMAIN')
    const maxAge = env.get('AUTH_COOKIE_MAX_AGE') ?? 60 * 60 * 24 * 365
    const configuredSameSite = env.get('AUTH_COOKIE_SAME_SITE')
    const sameSite: 'none' | 'lax' | 'strict' = configuredSameSite ?? (secure ? 'none' : 'lax')

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge,
      ...(domain ? { domain } : {}),
    }
  }

  // @ts-ignore
  private async cleanupExpiredTokens() {
    const now = new Date()

    await Promise.all([
      db
        .from(AUTH_ACCESS_TOKENS)
        .whereNotNull('expires_at')
        .andWhere('expires_at', '<=', now)
        .delete(),
      db
        .from(ADMIN_AUTH_ACCESS_TOKENS)
        .whereNotNull('expires_at')
        .andWhere('expires_at', '<=', now)
        .delete(),
    ])
  }



  private isUserModel(user: unknown): user is User {
    return user instanceof User
  }

  private isAdminUserModel(user: unknown): user is AdminUserType {
    return user instanceof AdminUser
  }

  public async testDB({ response }: HttpContext) {
    try {
      const user = await AdminUser.findBy('email', 'super@admin.com')
      return response.json({
        success: true,
        userExists: !!user,
        user: user,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return response.json({
        success: false,
        error: message,
      })
    }
  }

  private async assignRoleToUser(user: User, role: Role) {
    try {
      const existingRole = await user
        .related('userRoles')
        .query()
        .where('roles.id', role.id)
        .first()

      if (!existingRole) {
        await user.related('userRoles').attach([role.id])
      }
    } catch (error) {
      console.error('❌ Error assigning role to user:', error)
    }
  }

  // @ts-ignore
  private async getUserResponseData(
    user: AuthUserType,
    authType: string,
    options?: { syncMissingRole?: boolean }
  ) {
    const syncMissingRole = options?.syncMissingRole ?? true

    if (this.isUserModel(user)) {
      if (user.userType === 'faculty' && !user.faculty) {
        await user.load('faculty')
      } else if (user.userType === 'student' && !user.student) {
        await user.load('student')
      }

      const departmentId =
        user.userType === 'faculty' && user.faculty
          ? user.faculty.departmentId
          : user.userType === 'student' && user.student
            ? user.student.departmentId
            : null

      const baseData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        authType: authType,
        instituteId: user.instituteId,
        facultyId: user.facultyId,
        studentId: user.studentId,
        mobile: user.mobile,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
        departmentId: departmentId,
      }

      let roles: string[] = []
      let permissions: string[] = []
      let roleName: string = user.userType
      const preloadedRoles = user.$preloaded?.userRoles

      let userWithRoles = null

      if (Array.isArray(preloadedRoles)) {
        userWithRoles = user
      } else {
        userWithRoles = await User.query()
          .where('id', user.id)
          .preload('userRoles', (query) => {
            query.preload('permissions')
          })
          .first()
      }

      if (userWithRoles && userWithRoles.userRoles && userWithRoles.userRoles.length > 0) {
        roles = userWithRoles.userRoles.map((role) => role.roleKey)
        permissions = userWithRoles.userRoles.flatMap((role) =>
          role.permissions ? role.permissions.map((p) => p.permissionKey) : []
        )
        roleName = userWithRoles.userRoles[0].roleName
      } else if (authType === 'institute' && user.instituteId) {
        const instituteWithRole = await Institute.query()
          .where('id', user.instituteId)
          .preload('role', (query) => {
            query.preload('permissions')
          })
          .first()

        if (instituteWithRole && instituteWithRole.role) {
          roles = [instituteWithRole.role.roleKey]
          permissions = instituteWithRole.role.permissions.map((p) => p.permissionKey)
          roleName = instituteWithRole.role.roleName

          if (syncMissingRole) {
            await this.assignRoleToUser(user, instituteWithRole.role)
          }
        }
      } else if (authType === 'faculty' && user.facultyId) {
        const facultyWithRole = await Faculty.query()
          .where('id', user.facultyId)
          .preload('role', (query) => {
            query.preload('permissions')
          })
          .first()

        if (facultyWithRole && facultyWithRole.role) {
          roles = [facultyWithRole.role.roleKey]
          permissions = facultyWithRole.role.permissions.map((p) => p.permissionKey)
          roleName = facultyWithRole.role.roleName

          if (syncMissingRole) {
            await this.assignRoleToUser(user, facultyWithRole.role)
          }
        }
      } else if (authType === 'student' && user.studentId) {
        const studentWithRole = await user
          .related('student')
          .query()
          .preload('role', (query) => {
            query.preload('permissions')
          })
          .first()
        if (studentWithRole && studentWithRole.role) {
          roles = [studentWithRole.role.roleKey]
          permissions = studentWithRole.role.permissions.map((p) => p.permissionKey)
          roleName = studentWithRole.role.roleName

          if (syncMissingRole) {
            await this.assignRoleToUser(user, studentWithRole.role)
          }
        }
      }
      return {
        ...baseData,
        roles: roles,
        permissions: [...new Set(permissions)],
        roleName: roleName,
      }
    } else if (this.isAdminUserModel(user)) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        authType: 'admin',
        userType: user.userType,
        mobile: user.mobile,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
        roles: [user.userType],
        permissions: ['*'],
        roleName: user.userType,
      }
    }

    return null
  }

  private async syncInstituteToUser(institute: Institute) {
    try {
      // Deleted users bhi dhundo — whereNull hatao
      let user = await User.query()
        .where('email', institute.instituteEmail)
        .where('userType', 'institute')
        .first()

      if (user) {
        // Agar deleted tha toh restore karo
        await db.rawQuery(
          `UPDATE users SET 
          full_name = ?,
          mobile = ?,
          institute_id = ?,
          is_active = ?,
          password = ?,
          deleted_at = NULL,
          updated_at = NOW()
         WHERE id = ?`,
          [
            institute.instituteName,
            institute.institutePhone || '0000000000',
            institute.id,
            institute.isActive,
            institute.institutePassword,
            user.id,
          ]
        )

        user = await User.findOrFail(user.id)
      } else {
        await db.rawQuery(
          `INSERT INTO users (full_name, email, password, user_type, institute_id, mobile, is_active, is_email_verified, is_mobile_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            institute.instituteName,
            institute.instituteEmail,
            institute.institutePassword,
            'institute',
            institute.id,
            institute.institutePhone || '0000000000',
            institute.isActive,
            false,
            false,
          ]
        )

        user = await User.query()
          .where('email', institute.instituteEmail)
          .where('userType', 'institute')
          .firstOrFail()
      }

      return user
    } catch (error) {
      console.error('❌ Error syncing institute to user:', error)
      throw error
    }
  }

 private async syncFacultyToUser(faculty: Faculty) {
    try {
      let user = await User.query()
        .where('email', faculty.facultyEmail)
        .where('userType', 'faculty')
        .first()

      if (user) {
        await db.rawQuery(
          `UPDATE users SET full_name = ?, mobile = ?, institute_id = ?, faculty_id = ?, is_active = ?, password = ?, deleted_at = NULL, updated_at = NOW() WHERE id = ?`,
          [faculty.facultyName, faculty.facultyMobile || '0000000000', faculty.instituteId, faculty.id, faculty.isActive, faculty.facultyPassword, user.id]
        )
        user = await User.findOrFail(user.id)
      } else {
        await db.rawQuery(
          `INSERT INTO users (full_name, email, password, user_type, faculty_id, institute_id, mobile, is_active, is_email_verified, is_mobile_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [faculty.facultyName, faculty.facultyEmail, faculty.facultyPassword, 'faculty', faculty.id, faculty.instituteId, faculty.facultyMobile || '0000000000', faculty.isActive, false, false]
        )
        user = await User.query().where('email', faculty.facultyEmail).where('userType', 'faculty').firstOrFail()
      }

      return user
    } catch (error) {
      console.error('❌ Error syncing faculty to user:', error)
      throw error
    }
  }


private async syncStudentToUser(student: Student) {
    try {
      let user = await User.query()
        .where('email', student.studentEmail)
        .where('userType', 'student')
        .first()

      if (user) {
        await db.rawQuery(
          `UPDATE users SET full_name = ?, mobile = ?, institute_id = ?, student_id = ?, is_active = ?, password = ?, deleted_at = NULL, updated_at = NOW() WHERE id = ?`,
          [student.studentName, student.studentMobile || '0000000000', student.instituteId, student.id, student.isActive, student.studentPassword, user.id]
        )
        user = await User.findOrFail(user.id)
      } else {
        await db.rawQuery(
          `INSERT INTO users (full_name, email, password, user_type, student_id, institute_id, mobile, is_active, is_email_verified, is_mobile_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [student.studentName, student.studentEmail, student.studentPassword, 'student', student.id, student.instituteId, student.studentMobile || '0000000000', student.isActive, false, false]
        )
        user = await User.query().where('email', student.studentEmail).where('userType', 'student').firstOrFail()
      }

      return user
    } catch (error) {
      console.error('❌ Error syncing student to user:', error)
      throw error
    }
  }

  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const ip = request.ip()

      const { authService } = makeServices()
      const result = await authService.login({ email, password }, ip)

      if (!result) {
        return response.unauthorized({
          success: false,
          message: messages.common_messages_no_record_found,
          data: [],
        })
      }

      const cookieOptions = this.getAuthCookieOptions()

      response.clearCookie(AUTH_COOKIE_NAME, {
        path: cookieOptions.path,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      })
      if (cookieOptions.domain) {
        response.clearCookie(AUTH_COOKIE_NAME, {
          path: cookieOptions.path,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
          domain: cookieOptions.domain,
        })
      }

      response.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions)
      response.header('authorization', `Bearer ${result.token}`)
      response.header('x-access-token', result.token)

      return response.ok({
        success: true,
        message: messages.user_login_success,
        authType: result.authType,
        token: result.token,
        user: result.user,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return response.unauthorized({
        success: false,
        message: messages.user_authentication_failed,
        error: message,
      })
    }
  }
  public async me({ auth, response }: HttpContext) {
    try {
      let authenticatedUser = auth.user as AuthUserType | null

      if (!authenticatedUser) {
        try {
          const apiAuth = auth.use('api')
          const apiCheck = await apiAuth.check()
          if (apiCheck) authenticatedUser = (apiAuth.user as AuthUserType | undefined) || null
        } catch {}
      }

      if (!authenticatedUser) {
        try {
          const adminapiAuth = auth.use('adminapi')
          const adminapiCheck = await adminapiAuth.check()
          if (adminapiCheck) authenticatedUser = (adminapiAuth.user as AuthUserType | undefined) || null
        } catch {}
      }

      if (!authenticatedUser) {
        return response.unauthorized({ success: false, message: 'Not authenticated' })
      }

      const { authService } = makeServices()
      let authType = 'user'
      if (this.isUserModel(authenticatedUser)) {
        authType = authenticatedUser.userType
      } else {
        authType = 'admin'
      }
      
      const userProfile = await authService.getProfile(authenticatedUser, authType as AuthType)

      if (!userProfile) {
         return response.unauthorized({ success: false, message: 'Unknown user type' })
      }

      return response.ok({
        success: true,
        authType: authType,
        data: userProfile,
      })
    } catch (error) {
      console.error('Error fetching me profile:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch user data',
      })
    }
  }
  public async logout({ auth, response }: HttpContext) {
    try {
      const { tokenService } = makeServices()

      let user = auth.user as AuthUserType | null

      if (!user) {
        try {
          const apiAuth = auth.use('api')
          await apiAuth.authenticate()
          if (apiAuth.user) user = apiAuth.user as AuthUserType
        } catch {}
      }

      if (!user) {
        try {
          const adminAuth = auth.use('adminapi')
          await adminAuth.authenticate()
          if (adminAuth.user) user = adminAuth.user as AuthUserType
        } catch {}
      }

      if (user) {
        await tokenService.revokeAll(user)
      }

      const cookieOptions = this.getAuthCookieOptions()

      response.clearCookie(AUTH_COOKIE_NAME, {
        path: cookieOptions.path,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
      })

      if (cookieOptions.domain) {
        response.clearCookie(AUTH_COOKIE_NAME, {
          path: cookieOptions.path,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
        })
      }

      return response.ok({
        success: true,
        message: messages.user_logout_success,
      })
    } catch (error) {
      console.error('Logout error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to logout',
      })
    }
  }
  public async getAuthType({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated,
        })
      }

      let authType = 'user'

      if (this.isUserModel(user)) {
        authType = user.userType || 'user'
      } else if (this.isAdminUserModel(user)) {
        authType = 'admin'
      }

      return response.ok({
        success: true,
        authType: authType,
      })
    } catch (error: unknown) {
      console.error('Get auth type error:', error)
      return response.status(500).json({
        success: false,
        message: messages.user_auth_type_failed,
      })
    }
  }

  public async checkPermission({ auth, response, request }: HttpContext) {
    try {
      const { permissionKey } = request.only(['permissionKey'])
      const user = auth.user

      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated,
        })
      }

      let hasPermission = false

      if (this.isUserModel(user)) {
        const userWithPermissions = await User.query()
          .where('id', user.id)
          .preload('userRoles', (query) => {
            query.preload('permissions')
          })
          .first()

        if (userWithPermissions) {
          hasPermission = userWithPermissions.userRoles.some((role) =>
            role.permissions.some((permission) => permission.permissionKey === permissionKey)
          )
        }
      } else if (this.isAdminUserModel(user)) {
        hasPermission = true
      }

      return response.ok({
        success: true,
        hasPermission,
        permissionKey,
      })
    } catch (error: unknown) {
      console.error('Check permission error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to check permission',
      })
    }
  }

  public async getMyPermissions({ auth, response }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated,
        })
      }

      let permissions: string[] = []

      if (this.isUserModel(user)) {
        const userWithPermissions = await User.query()
          .where('id', user.id)
          .preload('userRoles', (query) => {
            query.preload('permissions')
          })
          .first()

        if (userWithPermissions && userWithPermissions.userRoles) {
          permissions = userWithPermissions.userRoles.flatMap((role) =>
            role.permissions ? role.permissions.map((p) => p.permissionKey) : []
          )
          permissions = [...new Set(permissions)]
        }
      } else if (this.isAdminUserModel(user)) {
        permissions = ['*']
      }

      return response.ok({
        success: true,
        permissions,
      })
    } catch (error: unknown) {
      console.error('Get my permissions error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to get permissions',
      })
    }
  }

  public async syncAllInstitutes({ response }: HttpContext) {
    try {
      const institutes = await Institute.query().where('isActive', true).exec()
      let syncedCount = 0
      let errors: string[] = []

      for (const institute of institutes) {
        try {
          await this.syncInstituteToUser(institute)
          syncedCount++
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          const errorMsg = `Failed to sync institute ${institute.instituteEmail}: ${msg}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return response.ok({
        success: true,
        message: `Successfully synced ${syncedCount} institutes to users table`,
        syncedCount,
        totalInstitutes: institutes.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Sync all institutes error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync institutes',
        error: message,
      })
    }
  }

  public async syncAllFaculties({ response }: HttpContext) {
    try {
      const faculties = await Faculty.query().where('isActive', true).exec()
      let syncedCount = 0
      let errors: string[] = []

      for (const faculty of faculties) {
        try {
          await this.syncFacultyToUser(faculty)
          syncedCount++
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          const errorMsg = `Failed to sync faculty ${faculty.facultyEmail}: ${msg}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return response.ok({
        success: true,
        message: `Successfully synced ${syncedCount} faculties to users table`,
        syncedCount,
        totalFaculties: faculties.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error: unknown) {
      console.error('Sync all faculties error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculties',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  public async syncAllStudent({ response }: HttpContext) {
    try {
      const students = await Student.query().where('isActive', true).exec()
      let syncedCount = 0
      let errors: string[] = []

      for (const student of students) {
        try {
          await this.syncStudentToUser(student)
          syncedCount++
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          const errorMsg = `Failed to sync student ${student.studentEmail}: ${msg}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return response.ok({
        success: true,
        message: `Successfully synced ${syncedCount} students to users table`,
        syncedCount,
        totalstudents: students.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculties',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  public async syncInstitute({ request, response }: HttpContext) {
    try {
      const { instituteId } = request.only(['instituteId'])

      const institute = await Institute.query().where('id', instituteId).first()

      if (!institute) {
        return response.notFound({
          success: false,
          message: 'Institute not found',
        })
      }

      const user = await this.syncInstituteToUser(institute)

      return response.ok({
        success: true,
        message: 'Institute synced successfully',
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
        },
      })
    } catch (error: unknown) {
      console.error('Sync institute error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync institute',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  public async syncFaculty({ request, response }: HttpContext) {
    try {
      const { facultyId } = request.only(['facultyId'])

      const faculty = await Faculty.query().where('id', facultyId).first()

      if (!faculty) {
        return response.notFound({
          success: false,
          message: 'Faculty not found',
        })
      }

      const user = await this.syncFacultyToUser(faculty)

      return response.ok({
        success: true,
        message: 'Faculty synced successfully',
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
        },
      })
    } catch (error: unknown) {
      console.error('Sync faculty error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculty',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  public async syncStudent({ request, response }: HttpContext) {
    try {
      const { studentId } = request.only(['studentId'])

      const student = await Student.query().where('id', studentId).first()

      if (!student) {
        return response.notFound({
          success: false,
          message: 'student not found',
        })
      }

      const user = await this.syncStudentToUser(student)

      return response.ok({
        success: true,
        message: 'student synced successfully',
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
        },
      })
    } catch (error: unknown) {
      console.error('Sync student error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync student',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  public async fixInstituteRoles({ response }: HttpContext) {
    try {
      const allInstituteUsers = await User.query()
        .where('userType', 'institute')
        .preload('userRoles')

      const instituteUsersWithoutRoles = allInstituteUsers.filter(
        (user) => !user.userRoles || user.userRoles.length === 0
      )

      let fixedCount = 0
      let errors: string[] = []

      for (const user of instituteUsersWithoutRoles) {
        try {
          if (user.instituteId) {
            const institute = await Institute.query()
              .where('id', user.instituteId)
              .preload('role')
              .first()

            if (institute?.role) {
              await user.related('userRoles').attach([institute.role.id])
              fixedCount++
            } else {
              const errorMsg = `Institute ${user.instituteId} has no role assigned for user ${user.email}`
              errors.push(errorMsg)
              console.log(`❌ ${errorMsg}`)
            }
          } else {
            const errorMsg = `User ${user.email} has no instituteId`
            errors.push(errorMsg)
            console.log(`❌ ${errorMsg}`)
          }
        } catch (error: unknown) {
          const errorMsg = `Failed to assign role to ${user.email}: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          console.log(`❌ ${errorMsg}`)
        }
      }

      return response.json({
        success: true,
        message: `Fixed roles for ${fixedCount} institute users`,
        fixedCount,
        totalInstituteUsers: allInstituteUsers.length,
        usersWithoutRoles: instituteUsersWithoutRoles.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error: unknown) {
      console.error('❌ Error in fixInstituteRoles:', error)
      return response.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
