import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm' // ✅ beforeSave import करो
import hash from '@adonisjs/core/services/hash'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { ADMIN_AUTH_ACCESS_TOKENS, ADMIN_USERS } from '#database/constants/table_names'

export type UserType = 'super_admin' | 'admin' | 'editor'

export default class AdminUser extends BaseModel {
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

  /**
   * ✅ Hash password automatically before saving
   */
  @beforeSave()
  public static async hashPassword(user: AdminUser) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  /**
   * Verify credentials for login
   */
  static async verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
    const user = await this.findBy('email', email)
    
    if (!user || !user.isActive) {
      return null
    }

    // Verify password
    const isValid = await hash.verify(user.password, password)
    return isValid ? user : null
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.userType === 'super_admin'
  }

  /**
   * Check if user is active admin
   */
  isActiveAdmin(): boolean {
    return this.isActive && this.isAdmin
  }
}