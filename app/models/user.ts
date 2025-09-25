import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import { AUTH_ACCESS_TOKENS, USER_ROLES } from '#database/constants/table_names'
import Role from '#models/role'
import Policy from './policy.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare mobile: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isEmailVerified: boolean

  @column()
  declare isMobileVerified: boolean

  @manyToMany(() => Role, {
    pivotTable: USER_ROLES,
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare userRoles: ManyToMany<typeof Role>

  @hasOne(()=>Policy)
  declare policy: HasOne<typeof Policy>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    table: AUTH_ACCESS_TOKENS,
  })
}