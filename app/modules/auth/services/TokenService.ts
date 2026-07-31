// app/modules/auth/services/TokenService.ts
// Handles token lifecycle: creation, revocation, and refresh.

import User from '#models/user'
import AdminUser from '#models/admin_user'
import type { AccessToken } from '@adonisjs/auth/access_tokens'
import UserRepository from '../repositories/UserRepository.js'

type AdminUserType = InstanceType<typeof AdminUser>
type UserType = InstanceType<typeof User>

export default class TokenService {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Create an access token for a regular user.
   */
  async createUserToken(user: UserType): Promise<AccessToken> {
    return User.accessTokens.create(user)
  }

  /**
   * Create an access token for an admin user.
   */
  async createAdminToken(admin: AdminUserType): Promise<AccessToken> {
    return AdminUser.adminAccessTokens.create(admin)
  }

  /**
   * Revoke all tokens for a user except the one just issued.
   * Enforces single-session semantics.
   */
  async enforceSingleSession(
    user: UserType | AdminUserType,
    currentTokenId: number
  ): Promise<void> {
    if (user instanceof User) {
      await this.userRepo.revokeUserTokens(user.id, currentTokenId)
    } else {
      await this.userRepo.revokeAdminUserTokens(user.id, currentTokenId)
    }
  }

  /**
   * Revoke ALL tokens for a user (logout).
   */
  async revokeAll(user: UserType | AdminUserType): Promise<void> {
    if (user instanceof User) {
      await this.userRepo.revokeUserTokens(user.id)
    } else {
      await this.userRepo.revokeAdminUserTokens(user.id)
    }
  }

  /**
   * Delete all expired tokens across both user tables.
   */
  async cleanupExpired(): Promise<void> {
    await this.userRepo.cleanupExpiredTokens()
  }
}
