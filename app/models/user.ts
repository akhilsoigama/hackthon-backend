// app/models/user.ts
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { AUTH_ACCESS_TOKENS, USER_ROLES, USERS } from '#database/constants/table_names'
import Role from '#models/role'
import Institute from '#models/institute'
import Faculty from '#models/faculty'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  public static table = USERS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userType: 'super_admin' | 'institute' | 'faculty' | 'student'

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare mobile: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare instituteId: number | null

  @column()
  declare facultyId: number | null

  @column()
  declare isEmailVerified: boolean

  @column()
  declare isMobileVerified: boolean

  @column()
  declare isActive: boolean

  // Relations
  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Faculty, {
    foreignKey: 'facultyId',
  })
  declare faculty: BelongsTo<typeof Faculty>

  @manyToMany(() => Role, {
    pivotTable: USER_ROLES,
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare userRoles: ManyToMany<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    table: AUTH_ACCESS_TOKENS,
  })

  // Helper methods
  isSuperAdmin(): boolean {
    return this.userType === 'super_admin'
  }

  isInstitute(): boolean {
    return this.userType === 'institute'
  }

  isFacultyUser(): boolean {
    return this.userType === 'faculty'
  }

  isStudent(): boolean {
    return this.userType === 'student'
  }
}