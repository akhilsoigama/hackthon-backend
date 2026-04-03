import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

const AUTH_COOKIE_NAME = env.get('AUTH_COOKIE_NAME') || 'token'

export default class CookieAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = ctx.request.cookie(AUTH_COOKIE_NAME)

    if (token) {
      ctx.request.request.headers.authorization = `Bearer ${token}`
    }

    return next()
  }
}
