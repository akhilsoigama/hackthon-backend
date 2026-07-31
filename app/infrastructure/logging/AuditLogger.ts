export type AuditAction =
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.token.refresh'
  | 'auth.token.revoke'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role.assign'
  | 'user.role.remove'
  | 'permission.denied'
  | 'rate_limit.exceeded'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'sync.institute'
  | 'sync.faculty'
  | 'sync.student'

export interface AuditEntry {
  action: AuditAction
  actorId?: number | null
  actorType?: string | null
  targetId?: number | string | null
  targetType?: string | null
  ip?: string | null
  userAgent?: string | null
  meta?: Record<string, unknown>
  timestamp: string
}

class AuditLogger {
  private formatEntry(partial: Omit<AuditEntry, 'timestamp'>): AuditEntry {
    return {
      ...partial,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Log a security / audit event.
   */
  log(partial: Omit<AuditEntry, 'timestamp'>): void {
    const entry = this.formatEntry(partial)
    // In production, stream to log aggregator (Pino transport, DataDog, etc.)
    // Never log passwords or tokens — only identifiers and actions.
    process.stdout.write(JSON.stringify({ level: 'AUDIT', ...entry }) + '\n')
  }

  /**
   * Log a failed authentication attempt.
   */
  loginFailed(email: string, ip: string | null, reason: string): void {
    this.log({
      action: 'auth.login.failed',
      actorId: null,
      meta: { email, reason },
      ip,
    })
  }

  /**
   * Log a successful login.
   */
  loginSuccess(userId: number, userType: string, ip: string | null): void {
    this.log({
      action: 'auth.login.success',
      actorId: userId,
      actorType: userType,
      ip,
    })
  }

  /**
   * Log a logout event.
   */
  logout(userId: number, ip: string | null): void {
    this.log({
      action: 'auth.logout',
      actorId: userId,
      ip,
    })
  }

  /**
   * Log a permission denial.
   */
  permissionDenied(userId: number | null, requiredPermission: string, ip: string | null): void {
    this.log({
      action: 'permission.denied',
      actorId: userId,
      meta: { requiredPermission },
      ip,
    })
  }

  /**
   * Log a data mutation.
   */
  dataMutation(
    action: 'data.create' | 'data.update' | 'data.delete',
    actorId: number,
    targetType: string,
    targetId: number | string,
    meta?: Record<string, unknown>
  ): void {
    this.log({
      action,
      actorId,
      targetType,
      targetId,
      meta,
    })
  }

  /**
   * Log a rate limit breach.
   */
  rateLimitExceeded(ip: string | null, endpoint: string): void {
    this.log({
      action: 'rate_limit.exceeded',
      ip,
      meta: { endpoint },
    })
  }
}

const auditLogger = new AuditLogger()

export default auditLogger
