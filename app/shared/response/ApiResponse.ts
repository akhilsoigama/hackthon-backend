// app/shared/response/ApiResponse.ts
import type { ApiErrorDetail, PaginationMeta } from '../types/shared.types.js'

// ─── Response Shapes ───────────────────────────────────────────────────────────

export type SuccessResponse<T> = {
  success: true
  statusCode: number
  message: string
  data: T
  meta?: PaginationMeta | Record<string, unknown>
  timestamp: string
}

export type ErrorResponse = {
  success: false
  statusCode: number
  message: string
  errors?: ApiErrorDetail[] | Record<string, unknown>
  timestamp: string
}

export type ApiResponseType<T> = SuccessResponse<T> | ErrorResponse

// ─── Builder ───────────────────────────────────────────────────────────────────

export const ApiResponse = {
  /**
   * Return a successful response envelope.
   */
  success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta | Record<string, unknown>
  ): SuccessResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * Return a created (201) response envelope.
   */
  created<T>(data: T, message = 'Created successfully'): SuccessResponse<T> {
    return ApiResponse.success(data, message, 201)
  },

  /**
   * Return an error response envelope. Never include a stack trace.
   */
  error(
    message = 'Something went wrong',
    statusCode = 500,
    errors?: ApiErrorDetail[] | Record<string, unknown>
  ): ErrorResponse {
    return {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * Return a 401 Unauthorized envelope.
   */
  unauthorized(message = 'Authentication required'): ErrorResponse {
    return ApiResponse.error(message, 401)
  },

  /**
   * Return a 403 Forbidden envelope — never expose permission details.
   */
  forbidden(message = 'Insufficient permissions'): ErrorResponse {
    return ApiResponse.error(message, 403)
  },

  /**
   * Return a 404 Not Found envelope.
   */
  notFound(resource = 'Resource'): ErrorResponse {
    return ApiResponse.error(`${resource} not found`, 404)
  },

  /**
   * Return a 422 Validation Failed envelope.
   */
  validationError(errors: ApiErrorDetail[]): ErrorResponse {
    return ApiResponse.error('Validation failed', 422, errors)
  },
}
