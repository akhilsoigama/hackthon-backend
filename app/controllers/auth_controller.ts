import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AdminUser from '#models/admin_user'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import messages from '#database/constants/messages'
import { errorHandler } from '../helper/error_handler.js'

export default class AuthController {
  private isUserModel(user: any): user is User {
    return user instanceof User
  }

  private isAdminUserModel(user: any): user is AdminUser {
    return user instanceof AdminUser
  }

  private async getUserResponseData(user: User | AdminUser, authType: string) {
    if (this.isUserModel(user)) {
      const baseData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        authType: authType,
        instituteId: user.instituteId,
        facultyId: user.facultyId,
        mobile: user.mobile,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
      }

      let roles: string[] = []
      let permissions: string[] = []
      let roleName: string = user.userType

      if (authType === 'user') {
        if (user.userRoles) {
          roles = user.userRoles.map(role => role.roleKey)
          permissions = user.userRoles.flatMap(role => 
            role.permissions ? role.permissions.map(p => p.permissionKey) : []
          )
          roleName = user.userRoles.length > 0 ? user.userRoles[0].roleName : user.userType
        }
      } else if (authType === 'institute' && user.instituteId) {
        const instituteWithRole = await Institute.query()
          .where('id', user.instituteId)
          .preload('role', (query) => {
            query.preload('permissions')
          })
          .first()

        if (instituteWithRole && instituteWithRole.role) {
          roles = [instituteWithRole.role.roleKey]
          permissions = instituteWithRole.role.permissions.map(p => p.permissionKey)
          roleName = instituteWithRole.role.roleName
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
          permissions = facultyWithRole.role.permissions.map(p => p.permissionKey)
          roleName = facultyWithRole.role.roleName
        }
      }

      return {
        ...baseData,
        roles: roles,
        permissions: [...new Set(permissions)], 
        roleName: roleName
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
        roleName: user.userType
      }
    }

    return null
  }
  private async syncInstituteToUser(institute: Institute, password: string) {
    try {
      let user = await User.query()
        .where('email', institute.instituteEmail)
        .where('userType', 'institute')
        .first()

      if (user) {
        user.fullName = institute.instituteName
        user.mobile = institute.institutePhone || '0000000000'
        user.instituteId = institute.id
        user.isActive = institute.isActive
        user.password = password
        await user.save()
      } else {
        user = await User.create({
          fullName: institute.instituteName,
          email: institute.instituteEmail,
          password: password,
          userType: 'institute',
          instituteId: institute.id,
          mobile: institute.institutePhone || '0000000000',
          isActive: institute.isActive,
          isEmailVerified: false,
          isMobileVerified: false,
        })
      }
      
      return user
    } catch (error) {
      console.error('❌ Error syncing institute to user:', error)
      throw error
    }
  }

  /**
   * Sync Faculty to User table
   */
  private async syncFacultyToUser(faculty: Faculty, password: string) {
    try {
      // Check if user already exists
      let user = await User.query()
        .where('email', faculty.facultyEmail)
        .where('userType', 'faculty')
        .first()

      if (user) {
        // Update existing user
        user.fullName = faculty.facultyName
        user.mobile = faculty.facultyMobile || '0000000000'
        user.instituteId = faculty.instituteId
        user.facultyId = faculty.id
        user.isActive = faculty.isActive
        user.password = password
        await user.save()
      } else {
        user = await User.create({
          fullName: faculty.facultyName,
          email: faculty.facultyEmail,
          password: password,
          userType: 'faculty',
          facultyId: faculty.id,
          instituteId: faculty.instituteId,
          mobile: faculty.facultyMobile || '0000000000',
          isActive: faculty.isActive,
          isEmailVerified: false,
          isMobileVerified: false,
        })
      }
      
      return user
    } catch (error) {
      errorHandler(HttpContext)
      throw error
    }
  }

  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      let user: User | AdminUser | null = null
      let token: any = null
      let authType: string = ''

      try {
        const adminUser = await AdminUser.verifyCredentials(email, password)
        user = adminUser
        token = await AdminUser.adminAccessTokens.create(user)
        authType = 'admin'
      } catch (adminError) {
        errorHandler(HttpContext)
      }

      // Try Institute
      if (!user) {
        try {
          const institute = await Institute.query()
            .where('instituteEmail', email)
            .where('isActive', true)
            .first()

          if (institute) {
            const isValid = await institute.verifyPassword(password)
            if (isValid) {
              user = await this.syncInstituteToUser(institute, password)
              token = await User.accessTokens.create(user)
              authType = 'institute'
            }
          }
        } catch (instituteError) {
          errorHandler(HttpContext)
        }
      }

      // Try Faculty
      if (!user) {
        try {
          const faculty = await Faculty.query()
            .where('facultyEmail', email)
            .where('isActive', true)
            .first()

          if (faculty) {
            const isValid = await faculty.verifyPassword(password)
            if (isValid) {
              user = await this.syncFacultyToUser(faculty, password)
              token = await User.accessTokens.create(user)
              authType = 'faculty'
            }
          }
        } catch (facultyError) {
          errorHandler(HttpContext)
        }
      }

      // Try Regular User
      if (!user) {
        try {
          user = await User.verifyCredentials(email, password)
          token = await User.accessTokens.create(user)
          authType = 'user'
        } catch (userError) {
          errorHandler(HttpContext)
        }
      }

      if (!user || !token) {
        return response.unauthorized({
          success: false,
          message: messages.common_messages_no_record_found,
          data: []
        })
      }

      if (this.isUserModel(user)) {
        const userWithRelations = await User.query()
          .where('id', user.id)
          .preload('userRoles', (query) => {
            query.preload('permissions')
          })
          .first()

        if (userWithRelations) {
          user = userWithRelations
        }
      }

      const userData = await this.getUserResponseData(user, authType)

      if (!userData) {
        return response.internalServerError({
          success: false,
          message: messages.user_failed_data
        })
      }

      return response.ok({
        success: true,
        message: messages.user_login_success,
        authType: authType,
        token: token.value!.release(),
        user: userData,
      })
    } catch (error) {
      console.error('Login error:', error)
      return response.unauthorized({
        success: false,
        message: messages.user_authentication_failed,
        error: error.message
      })
    }
  }

  public async me({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated
        })
      }

      let authType = 'user'

      if (this.isUserModel(user)) {
        if (user.userType === 'institute') {
          authType = 'institute'
        } else if (user.userType === 'faculty') {
          authType = 'faculty'
        } else if (user.userType === 'super_admin') {
          authType = 'super_admin'
        }
        
        const userWithRelations = await User.query()
          .where('id', user.id)
          .preload('userRoles', (query) => {
            query.preload('permissions')
          })
          .first()

        if (userWithRelations) {
          const userData = await this.getUserResponseData(userWithRelations, authType)
          return response.ok({
            success: true,
            authType: authType,
            data: userData
          })
        } else {
          const userData = await this.getUserResponseData(user, authType)
          return response.ok({
            success: true,
            authType: authType,
            data: userData
          })
        }
      } else if (this.isAdminUserModel(user)) {
        authType = 'admin'
        const userData = await this.getUserResponseData(user, authType)
        
        return response.ok({
          success: true,
          authType: authType,
          data: userData
        })
      }

      return response.status(401).json({
        success: false,
        message: messages.user_not_authenticated
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: messages.failed_to_fetch_user_data
      })
    }
  }

  public async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      const token = auth.user?.currentAccessToken

      if (!user || !token) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated
        })
      }

      if (this.isUserModel(user)) {
        await User.accessTokens.delete(user, token.identifier)
      } else if (this.isAdminUserModel(user)) {
        await AdminUser.adminAccessTokens.delete(user, token.identifier)
      }

      return response.ok({
        success: true,
        message: messages.user_logout_success
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: messages.user_logout_failed
      })
    }
  }

  public async getAuthType({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated
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
        authType: authType
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: messages.user_auth_type_failed
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
          message: messages.user_not_authenticated
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
          hasPermission = userWithPermissions.userRoles.some(role => 
            role.permissions.some(permission => permission.permissionKey === permissionKey)
          )
        }
      } else if (this.isAdminUserModel(user)) {
        hasPermission = true
      }

      return response.ok({
        success: true,
        hasPermission,
        permissionKey
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to check permission'
      })
    }
  }

  public async getMyPermissions({ auth, response }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.status(401).json({
          success: false,
          message: messages.user_not_authenticated
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
          permissions = userWithPermissions.userRoles.flatMap(role => 
            role.permissions ? role.permissions.map(p => p.permissionKey) : []
          )
          permissions = [...new Set(permissions)] 
        }
      } else if (this.isAdminUserModel(user)) {
        permissions = ['*'] 
      }

      return response.ok({
        success: true,
        permissions
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to get permissions'
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
          const defaultPassword = 'defaultPassword123'
          await this.syncInstituteToUser(institute, defaultPassword)
          syncedCount++
        } catch (error) {
          const errorMsg = `Failed to sync institute ${institute.instituteEmail}: ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return response.ok({
        success: true,
        message: `Successfully synced ${syncedCount} institutes to users table`,
        syncedCount,
        totalInstitutes: institutes.length,
        errors: errors.length > 0 ? errors : undefined
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to sync institutes',
        error: error.message
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
          const defaultPassword = 'defaultPassword123'
          await this.syncFacultyToUser(faculty, defaultPassword)
          syncedCount++
        } catch (error) {
          const errorMsg = `Failed to sync faculty ${faculty.facultyEmail}: ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return response.ok({
        success: true,
        message: `Successfully synced ${syncedCount} faculties to users table`,
        syncedCount,
        totalFaculties: faculties.length,
        errors: errors.length > 0 ? errors : undefined
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculties',
        error: error.message
      })
    }
  }

  public async syncInstitute({ request, response }: HttpContext) {
    try {
      const { instituteId, password } = request.only(['instituteId', 'password'])
      
      const institute = await Institute.query()
        .where('id', instituteId)
        .first()

      if (!institute) {
        return response.notFound({
          success: false,
          message: 'Institute not found'
        })
      }

      const user = await this.syncInstituteToUser(institute, password)

      return response.ok({
        success: true,
        message: 'Institute synced successfully',
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType
        }
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to sync institute',
        error: error.message
      })
    }
  }
  public async syncFaculty({ request, response }: HttpContext) {
    try {
      const { facultyId, password } = request.only(['facultyId', 'password'])
      
      const faculty = await Faculty.query()
        .where('id', facultyId)
        .first()

      if (!faculty) {
        return response.notFound({
          success: false,
          message: 'Faculty not found'
        })
      }

      const user = await this.syncFacultyToUser(faculty, password)

      return response.ok({
        success: true,
        message: 'Faculty synced successfully',
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType
        }
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculty',
        error: error.message
      })
    }
  }
}