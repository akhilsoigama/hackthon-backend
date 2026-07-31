// app/modules/auth/repositories/UserRepository.ts
// Encapsulates all raw DB queries for User and AdminUser models.
// Services call this — never hit models directly for complex queries.

import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import AdminUser from '#models/admin_user'
import { ADMIN_AUTH_ACCESS_TOKENS, AUTH_ACCESS_TOKENS } from '#database/constants/table_names'

export default class UserRepository {
  // ─── Token Cleanup ───────────────────────────────────────────────────────────

  /**
   * Delete all expired access tokens from both user and admin tables.
   */
  async cleanupExpiredTokens(): Promise<void> {
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

  /**
   * Revoke all access tokens for a regular user, optionally keeping one.
   */
  async revokeUserTokens(userId: number, keepTokenId?: number): Promise<void> {
    const query = db.from(AUTH_ACCESS_TOKENS).where('tokenable_id', userId)
    if (keepTokenId !== undefined) {
      query.whereNot('id', keepTokenId)
    }
    await query.delete()
  }

  /**
   * Revoke all access tokens for an admin user, optionally keeping one.
   */
  async revokeAdminUserTokens(adminUserId: number, keepTokenId?: number): Promise<void> {
    const query = db.from(ADMIN_AUTH_ACCESS_TOKENS).where('tokenable_id', adminUserId)
    if (keepTokenId !== undefined) {
      query.whereNot('id', keepTokenId)
    }
    await query.delete()
  }

  // ─── User Lookups ─────────────────────────────────────────────────────────────

  /**
   * Find a User with roles and permissions preloaded.
   */
  async findUserWithRoles(userId: number): Promise<InstanceType<typeof User> | null> {
    return User.query()
      .select([
        'id', 'email', 'full_name', 'user_type', 'institute_id',
        'faculty_id', 'student_id', 'mobile', 'is_active',
        'is_email_verified', 'is_mobile_verified',
      ])
      .where('id', userId)
      .preload('userRoles', (q) => {
        q.select(['id', 'role_name', 'role_key']).preload('permissions', (pq) => {
          pq.select(['id', 'permission_key'])
        })
      })
      .first()
  }

  /**
   * Find AdminUser by email.
   */
  async findAdminByEmail(email: string): Promise<InstanceType<typeof AdminUser> | null> {
    return AdminUser.findBy('email', email)
  }

  // ─── User Sync (Upsert) ───────────────────────────────────────────────────────
  // Uses Lucid ORM instead of raw SQL to eliminate the SQL injection surface
  // that existed in the original auth_controller.ts.

  /**
   * Upsert a User record for an institute. Returns the user.
   */
  async upsertInstituteUser(data: {
    email: string
    fullName: string
    password: string
    mobile: string
    instituteId: number
    isActive: boolean
  }): Promise<InstanceType<typeof User>> {
    let user = await User.query()
      .where('email', data.email)
      .where('userType', 'institute')
      .first()

    if (user) {
      await User.query().where('id', user.id).update({
        fullName: data.fullName,
        mobile: data.mobile,
        instituteId: data.instituteId,
        isActive: data.isActive,
        password: data.password,
        deletedAt: null,
        updatedAt: new Date(),
      })
      user = await User.findOrFail(user.id)
    } else {
      user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        userType: 'institute',
        instituteId: data.instituteId,
        mobile: data.mobile,
        isActive: data.isActive,
        isEmailVerified: false,
        isMobileVerified: false,
      })
    }

    return user
  }

  /**
   * Upsert a User record for a faculty member.
   */
  async upsertFacultyUser(data: {
    email: string
    fullName: string
    password: string
    mobile: string
    facultyId: number
    instituteId: number
    isActive: boolean
  }): Promise<InstanceType<typeof User>> {
    let user = await User.query()
      .where('email', data.email)
      .where('userType', 'faculty')
      .first()

    if (user) {
      await User.query().where('id', user.id).update({
        fullName: data.fullName,
        mobile: data.mobile,
        instituteId: data.instituteId,
        facultyId: data.facultyId,
        isActive: data.isActive,
        password: data.password,
        deletedAt: null,
        updatedAt: new Date(),
      })
      user = await User.findOrFail(user.id)
    } else {
      user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        userType: 'faculty',
        facultyId: data.facultyId,
        instituteId: data.instituteId,
        mobile: data.mobile,
        isActive: data.isActive,
        isEmailVerified: false,
        isMobileVerified: false,
      })
    }

    return user
  }

  /**
   * Upsert a User record for a student.
   */
  async upsertStudentUser(data: {
    email: string
    fullName: string
    password: string
    mobile: string
    studentId: number
    instituteId: number
    isActive: boolean
  }): Promise<InstanceType<typeof User>> {
    let user = await User.query()
      .where('email', data.email)
      .where('userType', 'student')
      .first()

    if (user) {
      await User.query().where('id', user.id).update({
        fullName: data.fullName,
        mobile: data.mobile,
        instituteId: data.instituteId,
        studentId: data.studentId,
        isActive: data.isActive,
        password: data.password,
        deletedAt: null,
        updatedAt: new Date(),
      })
      user = await User.findOrFail(user.id)
    } else {
      user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        userType: 'student',
        studentId: data.studentId,
        instituteId: data.instituteId,
        mobile: data.mobile,
        isActive: data.isActive,
        isEmailVerified: false,
        isMobileVerified: false,
      })
    }

    return user
  }

  /**
   * Assign a role to a user if not already assigned.
   */
  async assignRoleIfMissing(user: InstanceType<typeof User>, roleId: number): Promise<void> {
    const existing = await user.related('userRoles').query().where('roles.id', roleId).first()
    if (!existing) {
      await user.related('userRoles').attach([roleId])
    }
  }
}
