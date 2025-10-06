import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AdminUser from '#models/admin_user'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import messages from '#database/constants/messages'
import { errorHandler } from '..//helper/error_handler.js'

export default class AuthController {
  private isUserModel(user: any): user is User {
    return user instanceof User
  }

  private isAdminUserModel(user: any): user is AdminUser {
    return user instanceof AdminUser
  }

  private getUserResponseData(user: User | AdminUser, authType: string) {
    if (this.isUserModel(user)) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        authType: authType,
        instituteId: user.instituteId,
        facultyId: user.facultyId,
        mobile: user.mobile,
        isActive: user.isActive,
      }
    } else if (this.isAdminUserModel(user)) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        authType: authType,
      }
    }

    return null
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

      if (!user) {
        try {
          const institute = await Institute.query()
            .where('instituteEmail', email)
            .where('isActive', true)
            .first()

          if (institute) {
            const isValid = await institute.verifyPassword(password)

            if (isValid) {
              user = await User.query()
                .where('email', institute.instituteEmail)
                .where('userType', 'institute')
                .first()

              if (!user) {
                user = await User.create({
                  fullName: institute.instituteName,
                  email: institute.instituteEmail,
                  password: password,
                  userType: 'institute',
                  instituteId: institute.id,
                  mobile: institute.institutePhone || '0000000000',
                  isActive: true,
                  isEmailVerified: false,
                  isMobileVerified: false,
                })
              } else {
                const userPasswordValid = await user.verifyPassword(password)
                if (!userPasswordValid) {
                  user.password = password
                  await user.save()
                }
              }

              token = await User.accessTokens.create(user)
              authType = 'institute'
            }
          }
        } catch (instituteError) {
          errorHandler(HttpContext)
        }
      }

      if (!user) {
        try {
          const faculty = await Faculty.query()
            .where('facultyEmail', email)
            .where('isActive', true)
            .first()

          if (faculty) {
            if (typeof faculty.verifyPassword === 'function') {
              const isValid = await faculty.verifyPassword(password)

              if (isValid) {
                user = await User.query()
                  .where('email', faculty.facultyEmail)
                  .where('userType', 'faculty')
                  .first()

                if (!user) {
                  user = await User.create({
                    fullName: faculty.facultyName,
                    email: faculty.facultyEmail,
                    password: password,
                    userType: 'faculty',
                    facultyId: faculty.id,
                    instituteId: faculty.instituteId,
                    mobile: faculty.facultyMobile || '0000000000',
                    isActive: true,
                    isEmailVerified: false,
                    isMobileVerified: false,
                  })
                }

                token = await User.accessTokens.create(user)
                authType = 'faculty'
              }
            }
          }
        } catch (facultyError) {
          errorHandler(HttpContext)
        }
      }

      if (!user) {
        try {
          user = await User.verifyCredentials(email, password)
          token = await User.accessTokens.create(user)
          await user.load('userRoles', (rolesQuery) => rolesQuery.preload('permissions'))
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
        if (authType === 'user') {
          await user.load('userRoles', (rolesQuery) => rolesQuery.preload('permissions'))
        } else if (authType === 'institute') {
          await user.load('institute')
        } else if (authType === 'faculty') {
          await user.load('faculty')
        }
      }

      const userData = this.getUserResponseData(user, authType)

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
          await user.load('institute')
        } else if (user.userType === 'faculty') {
          authType = 'faculty'
          await user.load('faculty')
        } else if (user.userType === 'super_admin') {
          authType = 'super_admin'
        } else {
          await user.load('userRoles', (rolesQuery) => rolesQuery.preload('permissions'))
        }
      } else if (this.isAdminUserModel(user)) {
        authType = 'admin'
      }

      const userData = this.getUserResponseData(user, authType)

      return response.ok({
        success: true,
        authType: authType,
        data: userData
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
        authType = 'super_admin'
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
}