// app/modules/auth/services/AuthService.ts
// Core authentication business logic — no HTTP context, no response building.
// Controllers call this service; this service calls Repository and TokenService.

import User from '#models/user'
import AdminUser from '#models/admin_user'
import Institute from '#models/institute'
import Faculty from '#models/faculty'
import Student from '#models/student'
import Role from '#models/role'
import auditLogger from '#infrastructure/logging/AuditLogger'
import redisCacheService from '#shared/cache/RedisCache'
import UserRepository from '../repositories/UserRepository.js'
import TokenService from './TokenService.js'
import type {
  AuthType,
  LoginPayload,
  LoginResponse,
  UserProfileDto,
} from '../types/auth.types.js'

type AdminUserType = InstanceType<typeof AdminUser>
type UserModel = InstanceType<typeof User>

export default class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  // ─── Login ───────────────────────────────────────────────────────────────────

  /**
   * Authenticate a user against all auth sources and return a login response.
   *
   * Order of checks:
   * 1. Admin users (AdminUser table)
   * 2. Institutes (by institute email + password)
   * 3. Faculty
   * 4. Students
   * 5. Direct User table credentials
   */
  async login(payload: LoginPayload, ip: string | null): Promise<LoginResponse | null> {
    await this.tokenService.cleanupExpired()

    const { email, password } = payload
    let resolvedUser: UserModel | AdminUserType | null = null
    let authType: AuthType = 'user'

    // ── 1. Admin ──────────────────────────────────────────────────────────────
    try {
      const admin = await AdminUser.verifyCredentials(email, password)
      if (admin) {
        resolvedUser = admin
        authType = 'admin'
      }
    } catch {
      // Not an admin — continue
    }

    // ── 2. Institute ──────────────────────────────────────────────────────────
    if (!resolvedUser) {
      try {
        const institute = await Institute.query()
          .where('instituteEmail', email)
          .where('isActive', true)
          .first()

        if (institute) {
          const isValid = await (
            institute as unknown as { verifyPassword?: (pwd: string) => Promise<boolean> }
          ).verifyPassword?.(password)

          if (isValid) {
            const user = await this.userRepo.upsertInstituteUser({
              email: institute.instituteEmail,
              fullName: institute.instituteName,
              password: institute.institutePassword,
              mobile: institute.institutePhone || '0000000000',
              instituteId: institute.id,
              isActive: institute.isActive,
            })
            resolvedUser = user
            authType = 'institute'
          }
        }
      } catch {
        // Not an institute — continue
      }
    }

    // ── 3. Faculty ────────────────────────────────────────────────────────────
    if (!resolvedUser) {
      try {
        const faculty = await Faculty.query()
          .where('facultyEmail', email)
          .where('isActive', true)
          .first()

        if (faculty) {
          const isValid = await (
            faculty as unknown as { verifyPassword?: (pwd: string) => Promise<boolean> }
          ).verifyPassword?.(password)

          if (isValid) {
            const user = await this.userRepo.upsertFacultyUser({
              email: faculty.facultyEmail,
              fullName: faculty.facultyName,
              password: faculty.facultyPassword,
              mobile: faculty.facultyMobile || '0000000000',
              facultyId: faculty.id,
              instituteId: faculty.instituteId,
              isActive: faculty.isActive,
            })
            resolvedUser = user
            authType = 'faculty'
          }
        }
      } catch {
        // Not a faculty — continue
      }
    }

    // ── 4. Student ────────────────────────────────────────────────────────────
    if (!resolvedUser) {
      try {
        const student = await Student.query()
          .where('studentEmail', email)
          .where('isActive', true)
          .first()

        if (student) {
          const isValid = await (
            student as unknown as { verifyPassword?: (pwd: string) => Promise<boolean> }
          ).verifyPassword?.(password)

          if (isValid) {
            const user = await this.userRepo.upsertStudentUser({
              email: student.studentEmail,
              fullName: student.studentName,
              password: student.studentPassword,
              mobile: student.studentMobile || '0000000000',
              studentId: student.id,
              instituteId: student.instituteId,
              isActive: student.isActive,
            })
            resolvedUser = user
            authType = 'student'
          }
        }
      } catch {
        // Not a student — continue
      }
    }

    // ── 5. Direct User credentials ────────────────────────────────────────────
    if (!resolvedUser) {
      try {
        resolvedUser = await User.verifyCredentials(email, password)
        if (resolvedUser) authType = 'user'
      } catch {
        // No match found
      }
    }

    if (!resolvedUser) {
      auditLogger.loginFailed(email, ip, 'invalid_credentials')
      return null
    }

    // ── Issue Token ───────────────────────────────────────────────────────────
    let token: import('@adonisjs/auth/access_tokens').AccessToken
    if (resolvedUser instanceof AdminUser) {
      token = await this.tokenService.createAdminToken(resolvedUser as AdminUserType)
    } else {
      token = await this.tokenService.createUserToken(resolvedUser as UserModel)
    }

    const currentTokenId = Number(token.identifier)
    if (Number.isFinite(currentTokenId)) {
      await this.tokenService.enforceSingleSession(resolvedUser, currentTokenId)
    }

    // ── Load roles/permissions for profile ────────────────────────────────────
    if (resolvedUser instanceof User) {
      const withRoles = await this.userRepo.findUserWithRoles(resolvedUser.id)
      if (withRoles) resolvedUser = withRoles
    }

    const userProfile = await this.buildUserProfile(resolvedUser, authType)
    if (!userProfile || !token.value) return null

    auditLogger.loginSuccess(resolvedUser.id, authType, ip)

    return {
      token: token.value.release(),
      authType,
      user: userProfile,
    }
  }

  // ─── Profile / Me ─────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's profile (with Redis caching).
   */
  async getProfile(
    user: UserModel | AdminUserType,
    authType: AuthType
  ): Promise<UserProfileDto | null> {
    const isAdmin = user instanceof AdminUser
    const cacheKey = `auth:me:${isAdmin ? 'admin' : 'user'}:${user.id}:${user.userType}`

    return redisCacheService.getOrSet(
      cacheKey,
      60_000,
      async () => {
        if (user instanceof User) {
          const withRoles = await this.userRepo.findUserWithRoles(user.id)
          return this.buildUserProfile(withRoles ?? user, authType)
        }
        return this.buildUserProfile(user, authType)
      },
      ['auth-me']
    )
  }

  /**
   * Invalidate a user's cached profile (call after role/permission changes).
   */
  async invalidateProfileCache(userId: number, userType: string): Promise<void> {
    await redisCacheService.invalidateByPrefix(`auth:me:user:${userId}:${userType}`)
    await redisCacheService.invalidateByPrefix(`auth:me:admin:${userId}:${userType}`)
  }

  // ─── Sync Operations ──────────────────────────────────────────────────────────

  /**
   * Sync all institutes to the users table.
   * Used for the /sync/institutes migration endpoint.
   */
  async syncAllInstitutes(): Promise<{ synced: number; errors: number }> {
    const institutes = await Institute.all()
    let synced = 0
    let errors = 0

    for (const institute of institutes) {
      try {
        const user = await this.userRepo.upsertInstituteUser({
          email: institute.instituteEmail,
          fullName: institute.instituteName,
          password: institute.institutePassword,
          mobile: institute.institutePhone || '0000000000',
          instituteId: institute.id,
          isActive: institute.isActive,
        })

        const role = await this.getRoleForInstitute(institute.id)
        if (role) {
          await this.userRepo.assignRoleIfMissing(user, role.id)
        }
        synced++
      } catch {
        errors++
      }
    }

    auditLogger.log({ action: 'sync.institute', meta: { synced, errors } })
    return { synced, errors }
  }

  /**
   * Sync all faculties to the users table.
   */
  async syncAllFaculties(): Promise<{ synced: number; errors: number }> {
    const faculties = await Faculty.all()
    let synced = 0
    let errors = 0

    for (const faculty of faculties) {
      try {
        const user = await this.userRepo.upsertFacultyUser({
          email: faculty.facultyEmail,
          fullName: faculty.facultyName,
          password: faculty.facultyPassword,
          mobile: faculty.facultyMobile || '0000000000',
          facultyId: faculty.id,
          instituteId: faculty.instituteId,
          isActive: faculty.isActive,
        })

        const role = await this.getRoleForFaculty(faculty.id)
        if (role) {
          await this.userRepo.assignRoleIfMissing(user, role.id)
        }
        synced++
      } catch {
        errors++
      }
    }

    auditLogger.log({ action: 'sync.faculty', meta: { synced, errors } })
    return { synced, errors }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async getRoleForInstitute(instituteId: number): Promise<InstanceType<typeof Role> | null> {
    const institute = await Institute.query()
      .where('id', instituteId)
      .preload('role', (q) => q.preload('permissions'))
      .first()
    return institute?.role ?? null
  }

  private async getRoleForFaculty(facultyId: number): Promise<InstanceType<typeof Role> | null> {
    const faculty = await Faculty.query()
      .where('id', facultyId)
      .preload('role', (q) => q.preload('permissions'))
      .first()
    return faculty?.role ?? null
  }

  /**
   * Build a UserProfileDto from a User or AdminUser model.
   * All role/permission resolution happens here — in one place.
   */
  async buildUserProfile(
    user: UserModel | AdminUserType,
    authType: AuthType
  ): Promise<UserProfileDto | null> {
    if (user instanceof AdminUser) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        authType: 'admin',
        instituteId: null,
        facultyId: null,
        studentId: null,
        departmentId: null,
        mobile: user.mobile,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
        roles: [user.userType],
        permissions: ['*'],
        roleName: user.userType,
      }
    }

    if (!(user instanceof User)) return null

    // Resolve department for faculty/student
    let departmentId: number | null = null
    if (user.userType === 'faculty' && user.faculty) {
      departmentId = user.faculty.departmentId
    } else if (user.userType === 'student' && user.student) {
      departmentId = user.student.departmentId
    }

    // Resolve roles and permissions
    let roles: string[] = []
    let permissions: string[] = []
    let roleName: string = user.userType

    const userRoles = user.userRoles ?? []

    if (userRoles.length > 0) {
      roles = userRoles.map((r) => r.roleKey)
      permissions = userRoles.flatMap((r) => r.permissions?.map((p) => p.permissionKey) ?? [])
      roleName = userRoles[0].roleName
    } else {
      // Fallback: resolve role from related entity
      const resolvedRole = await this.resolveRoleFromEntity(user, authType)
      if (resolvedRole) {
        roles = [resolvedRole.roleKey]
        permissions = resolvedRole.permissions?.map((p) => p.permissionKey) ?? []
        roleName = resolvedRole.roleName
        // Sync missing role
        await this.userRepo.assignRoleIfMissing(user, resolvedRole.id)
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      authType,
      instituteId: user.instituteId ?? null,
      facultyId: user.facultyId ?? null,
      studentId: user.studentId ?? null,
      departmentId,
      mobile: user.mobile,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      roles,
      permissions: [...new Set(permissions)],
      roleName,
    }
  }

  private async resolveRoleFromEntity(
    user: UserModel,
    authType: AuthType
  ): Promise<InstanceType<typeof Role> | null> {
    if (authType === 'institute' && user.instituteId) {
      return this.getRoleForInstitute(user.instituteId)
    }
    if (authType === 'faculty' && user.facultyId) {
      return this.getRoleForFaculty(user.facultyId)
    }
    if (authType === 'student' && user.studentId) {
      const student = await user.related('student').query()
        .preload('role', (q) => q.preload('permissions'))
        .first()
      return student?.role ?? null
    }
    return null
  }
}
