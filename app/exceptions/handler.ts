// app/exceptions/handler.ts
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'
import { ApiResponse } from '../shared/response/ApiResponse.js'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * Debug mode shows verbose errors only outside production.
   * Stack traces are NEVER sent to the client even in debug mode.
   */
  protected debug = !app.inProduction

  /**
   * Handle exception and return a consistent JSON envelope.
   * Never expose stack traces or internal error details to the client.
   */
  async handle(error: unknown, ctx: HttpContext) {
    const { response } = ctx

    // ── VineJS Validation Error ────────────────────────────────────────────────
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      const errors = error.messages.map((m: Record<string, unknown>) => ({
        field: typeof m.field === 'string' ? m.field : undefined,
        message: typeof m.message === 'string' ? m.message : 'Validation error',
        rule: typeof m.rule === 'string' ? m.rule : undefined,
      }))
      return response.status(422).json(ApiResponse.validationError(errors))
    }

    // ── Lucid — Row Not Found ──────────────────────────────────────────────────
    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return response.status(404).json(ApiResponse.notFound())
    }

    // ── Auth — Unauthorized ────────────────────────────────────────────────────
    if (error instanceof Error && error.message === 'E_UNAUTHORIZED_ACCESS') {
      return response.status(401).json(ApiResponse.unauthorized())
    }

    // ── HTTP Exceptions (AdonisJS built-in) ────────────────────────────────────
    const httpError = error as { status?: number; message?: string }
    if (httpError.status && typeof httpError.status === 'number') {
      const statusCode = httpError.status
      const message = httpError.message ?? 'An error occurred'

      // Never expose internal messages in production (might contain SQL, paths, etc.)
      const safeMessage = app.inProduction ? getDefaultMessageForStatus(statusCode) : message

      return response.status(statusCode).json(ApiResponse.error(safeMessage, statusCode))
    }

    // ── Unhandled / Internal Server Error ─────────────────────────────────────
    // Log internally but never expose the raw error message to the client.
    return response.status(500).json(ApiResponse.error('Internal server error', 500))
  }

  /**
   * Report error to internal logging. Does NOT send a response.
   * Captures user context for correlation.
   */
  async report(error: unknown, ctx: HttpContext) {
    let userId: number | null = null
    let userType: string | null = null

    try {
      const user = ctx.auth?.user as { id?: number; userType?: string } | null
      userId = user?.id ?? null
      userType = user?.userType ?? null
    } catch {
      // Auth may not be initialized on public routes
    }

    // Structured error log (NDJSON — friendly for log aggregators)
    process.stderr.write(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        method: ctx.request.method(),
        path: ctx.request.url(),
        userId,
        userType,
        ip: ctx.request.ip(),
        error: {
          name: error instanceof Error ? error.constructor.name : 'UnknownError',
          message: error instanceof Error ? error.message : String(error),
          // Stack trace logged server-side only — never sent to client
          stack: app.inProduction ? undefined : error instanceof Error ? error.stack : undefined,
        },
      }) + '\n'
    )

    return super.report(error, ctx)
  }
}

/**
 * Return a safe, generic message for an HTTP status code in production.
 * Prevents leaking internal messages like SQL errors, file paths, etc.
 */
function getDefaultMessageForStatus(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    405: 'Method not allowed',
    409: 'Conflict',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
  }
  return messages[status] ?? 'An error occurred'
}
