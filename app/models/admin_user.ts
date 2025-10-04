import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { ADMIN_AUTH_ACCESS_TOKENS, ADMIN_USERS } from '#database/constants/table_names'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export type UserType = 'super_admin' | 'admin' | 'editor'

export default class AdminUser extends compose(BaseModel, AuthFinder) {
  public static table = ADMIN_USERS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userType: UserType

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare mobile: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isAdmin: boolean

  @column()
  declare isActive: boolean

  @column()
  declare isEmailVerified: boolean

  @column()
  declare isMobileVerified: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Access token provider
  static adminAccessTokens = DbAccessTokensProvider.forModel(AdminUser, {
    table: ADMIN_AUTH_ACCESS_TOKENS,
  })

  // Helper
  isSuperAdmin(): boolean {
    return this.userType === 'super_admin'
  }
}