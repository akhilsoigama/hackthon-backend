import type { HttpContext } from '@adonisjs/core/http'

export const errorHandler = (e: unknown, ctx?: HttpContext) => {
  const errorObj = e as Record<string, unknown>;
  
  if (ctx) {
    ctx.response.status(400)
  }
  
  if (errorObj?.code === '23505') {
    return {
      error: errorObj?.detail,
    }
  }
  
  if (errorObj?.code === 'E_VALIDATION_ERROR') {
    return e
  }
  
  if (errorObj?.message) {
    return {
      error: errorObj?.message,
    }
  }
  
  return {
    error: 'Something went wrong',
  }
}

