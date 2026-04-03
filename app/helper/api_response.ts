export type ApiSuccessResponse<T> = {
  success: true
  status: true
  statusCode: number
  message: string
  data: T
  meta?: Record<string, unknown>
  timestamp: string
}

export type ApiErrorResponse = {
  success: false
  status: false
  statusCode: number
  message: string
  errors?: unknown
  timestamp: string
}

export const ApiResponse = {
  success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: Record<string, unknown>
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      status: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    }
  },

  error(
    message = 'Something went wrong',
    statusCode = 500,
    errors?: unknown
  ): ApiErrorResponse {
    return {
      success: false,
      status: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    }
  },
}
