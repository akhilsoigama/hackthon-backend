import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

const AUTH_COOKIE_NAME = env.get('AUTH_COOKIE_NAME') || 'token'

function getTokenFromCookieHeader(cookieHeader: string, cookieName: string): string | null {
  const parts = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(`${cookieName}=`))

  if (parts.length === 0) {
    return null
  }

  // If duplicate cookies exist, use the last one sent by the browser.
  const lastCookie = parts[parts.length - 1]
  const rawValue = lastCookie.slice(`${cookieName}=`.length)

  try {
    return decodeURIComponent(rawValue)
  } catch {
    return rawValue
  }
}

export default class CookieAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const existingAuthorization =
      ctx.request.header('authorization') || ctx.request.header('Authorization')

    // Do not override an Authorization header already provided by the client.
    if (existingAuthorization) {
      return next()
    }

    const rawCookieHeader = ctx.request.header('cookie')
    const tokenFromHeader = rawCookieHeader
      ? getTokenFromCookieHeader(rawCookieHeader, AUTH_COOKIE_NAME)
      : null
    const token = tokenFromHeader || ctx.request.cookie(AUTH_COOKIE_NAME)

    if (token) {
      ctx.request.request.headers.authorization = `Bearer ${token}`
    }

    return next()
  }
}
