// app/controllers/auth_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AdminUser from '#models/admin_user'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import Role from '#models/role'
import messages from '#database/constants/messages'

// Define types for better TypeScript support
type AdminUserType = InstanceType<typeof AdminUser>
type AuthUserType = User | AdminUserType

export default class AuthController {
  private isUserModel(user: any): user is User {
    return user instanceof User
  }

  private isAdminUserModel(user: any): user is AdminUserType {
    return user instanceof AdminUser
  }

  // Test database connection
  public async testDB({ response }: HttpContext) {
    try {
      const user = await AdminUser.findBy('email', 'super@admin.com')
      return response.json({
        success: true,
        userExists: !!user,
        user: user
      })
    } catch (error: any) {
      return response.json({
        success: false,
        error: error.message
      })
    }
  }

  // Helper method to auto-assign roles to users
  private async assignRoleToUser(user: User, role: Role) {
    try {
      // Check if user already has this role
      const existingRole = await user.related('userRoles').query().where('roles.id', role.id).first()
      
      if (!existingRole) {
        await user.related('userRoles').attach([role.id])
        console.log(`✅ Auto-assigned role ${role.roleName} to user ${user.email}`)
      }
    } catch (error) {
      console.error('❌ Error assigning role to user:', error)
    }
  }

  private async getUserResponseData(user: AuthUserType, authType: string) {
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

      // 🔥 FIX: Load user with roles first
      const userWithRoles = await User.query()
        .where('id', user.id)
        .preload('userRoles', (query) => {
          query.preload('permissions')
        })
        .first()

      if (userWithRoles && userWithRoles.userRoles && userWithRoles.userRoles.length > 0) {
        // User has direct role assignments
        roles = userWithRoles.userRoles.map(role => role.roleKey)
        permissions = userWithRoles.userRoles.flatMap(role =>
          role.permissions ? role.permissions.map(p => p.permissionKey) : []
        )
        roleName = userWithRoles.userRoles[0].roleName
      } 
      else if (authType === 'institute' && user.instituteId) {
        // Institute user - get role from institute
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
          
          // 🔥 AUTO-ASSIGN ROLE TO USER
          await this.assignRoleToUser(user, instituteWithRole.role)
        }
      }
      else if (authType === 'faculty' && user.facultyId) {
        // Faculty user - get role from faculty
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
          
          // 🔥 AUTO-ASSIGN ROLE TO USER
          await this.assignRoleToUser(user, facultyWithRole.role)
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

  private async syncFacultyToUser(faculty: Faculty, password: string) {
    try {
      let user = await User.query()
        .where('email', faculty.facultyEmail)
        .where('userType', 'faculty')
        .first()

      if (user) {
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
      console.error('❌ Error syncing faculty to user:', error)
      throw error
    }
  }

  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      let user: AuthUserType | null = null
      let token: any = null
      let authType: string = ''

      // Try Admin authentication first
      try {
        const adminUser = await AdminUser.verifyCredentials(email, password)
        if (adminUser) {
          user = adminUser
          token = await AdminUser.adminAccessTokens.create(user)
          authType = 'admin'
        }
      } catch {}

      // Try Institute authentication
      if (!user) {
        try {
          const institute = await Institute.query()
            .where('instituteEmail', email)
            .where('isActive', true)
            .first()

          if (institute) {
            const isValid = await (institute as any).verifyPassword?.(password)
            if (isValid) {
              user = await this.syncInstituteToUser(institute, password)
              token = await User.accessTokens.create(user)
              authType = 'institute'
            }
          }
        } catch (instituteError) {
          console.log('Institute authentication failed, trying other methods...')
        }
      }

      // Try Faculty authentication
      if (!user) {
        try {
          const faculty = await Faculty.query()
            .where('facultyEmail', email)
            .where('isActive', true)
            .first()

          if (faculty) {
            const isValid = await (faculty as any).verifyPassword?.(password)
            if (isValid) {
              user = await this.syncFacultyToUser(faculty, password)
              token = await User.accessTokens.create(user)
              authType = 'faculty'
            }
          }
        } catch (facultyError) {
          console.log('Faculty authentication failed, trying other methods...')
        }
      }

      // Try Regular User authentication
      if (!user) {
        try {
          user = await User.verifyCredentials(email, password)
          if (user) {
            token = await User.accessTokens.create(user)
            authType = 'user'
          }
        } catch (userError) {
          console.log('User authentication failed...')
        }
      }

      // If no user found or token created
      if (!user || !token) {
        return response.unauthorized({
          success: false,
          message: messages.common_messages_no_record_found,
          data: []
        })
      }

      // Load user relations if it's a User model
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
    } catch (error: any) {
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
      let authenticatedUser: AuthUserType | null = null

      try {
        const apiAuth = auth.use('api')
        const apiCheck = await apiAuth.check()
        const apiUser = apiAuth.user as AuthUserType | undefined

        if (apiCheck && apiUser) {
          authenticatedUser = apiUser
        }
      } catch (apiError: any) {
        console.log('❌ API Guard Error:', apiError.message)
      }

      try {
        const adminapiAuth = auth.use('adminapi')
        const adminapiCheck = await adminapiAuth.check()
        const adminapiUser = adminapiAuth.user as AuthUserType | undefined
        if (adminapiCheck && adminapiUser) {
          authenticatedUser = adminapiUser
        }
      } catch (adminapiError: any) {
        console.log('❌ AdminAPI Guard Error:', adminapiError.message)
      }

      if (!authenticatedUser) {
        return response.unauthorized({
          success: false,
          message: 'Not authenticated'
        })
      }

      let authType = 'user'

      if (this.isUserModel(authenticatedUser)) {
        if (authenticatedUser.userType === 'institute') {
          authType = 'institute'
        } else if (authenticatedUser.userType === 'faculty') {
          authType = 'faculty'
        } else if (authenticatedUser.userType === 'super_admin') {
          authType = 'super_admin'
        }

        const userWithRelations = await User.query()
          .where('id', authenticatedUser.id)
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
          // Fallback to basic user data
          const userData = await this.getUserResponseData(authenticatedUser, authType)
          return response.ok({
            success: true,
            authType: authType,
            data: userData
          })
        }
      } else if (this.isAdminUserModel(authenticatedUser)) {
        authType = 'admin'
        const userData = await this.getUserResponseData(authenticatedUser, authType)
        return response.ok({
          success: true,
          authType: authType,
          data: userData
        })
      }

      return response.unauthorized({
        success: false,
        message: 'Unknown user type'
      })

    } catch (error: any) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch user data'
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
    } catch (error: any) {
      console.error('Logout error:', error)
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
    } catch (error: any) {
      console.error('Get auth type error:', error)
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
    } catch (error: any) {
      console.error('Check permission error:', error)
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
    } catch (error: any) {
      console.error('Get my permissions error:', error)
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
        } catch (error: any) {
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
    } catch (error: any) {
      console.error('Sync all institutes error:', error)
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
        } catch (error: any) {
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
    } catch (error: any) {
      console.error('Sync all faculties error:', error)
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
    } catch (error: any) {
      console.error('Sync institute error:', error)
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
    } catch (error: any) {
      console.error('Sync faculty error:', error)
      return response.internalServerError({
        success: false,
        message: 'Failed to sync faculty',
        error: error.message
      })
    }
  }

  // 🔥 NEW: Fix institute roles route
  // In AuthController - fix the fixInstituteRoles method
// AuthController mein yeh method replace karo
public async fixInstituteRoles({ response }: HttpContext) {
  try {
    // Method 1: Simple query without whereDoesntHave
    const allInstituteUsers = await User.query()
      .where('userType', 'institute')
      .preload('userRoles')

    // Filter users who don't have any roles
    const instituteUsersWithoutRoles = allInstituteUsers.filter(user => 
      !user.userRoles || user.userRoles.length === 0
    )

    let fixedCount = 0
    let errors: string[] = []

    console.log(`🔧 Found ${instituteUsersWithoutRoles.length} institute users without roles`)

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
            console.log(`✅ Assigned role ${institute.role.roleName} to ${user.email}`)
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
      } catch (error: any) {
        const errorMsg = `Failed to assign role to ${user.email}: ${error.message}`
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
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('❌ Error in fixInstituteRoles:', error)
    return response.status(500).json({
      success: false,
      error: error.message
    })
  }
}
}

