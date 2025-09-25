import type { HttpContext } from '@adonisjs/core/http'

export const errorHandler = (e: any, ctx?: HttpContext) => {
  if (ctx) {
    ctx.response.status(400)
  }
  if (e?.code === '23505') {
    return {
      error: e?.detail,
    }
  }
  if (e?.code === 'E_VALIDATION_ERROR') {
    return e
  }
  if (e?.message) {
    return {
      error: e?.message,
    }
  }

  return e
}
