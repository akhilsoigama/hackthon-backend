// app/middleware/helmet_middleware.ts
// Adds essential HTTP security headers to every response.
// Replaces the need for the 'helmet' npm package by using AdonisJS's response API.

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'

export default class HelmetMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    // Prevent MIME-type sniffing
    response.header('X-Content-Type-Options', 'nosniff')

    // Prevent clickjacking
    response.header('X-Frame-Options', 'DENY')

    // Disable XSS auditor (deprecated but belt-and-suspenders)
    response.header('X-XSS-Protection', '0')

    // Only send origin on cross-origin requests
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Control browser features
    response.header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    )

    // Content Security Policy
    // Strict in production; relaxed in development to allow Vite HMR, etc.
    if (app.inProduction) {
      response.header(
        'Content-Security-Policy',
        [
          "default-src 'none'",
          "script-src 'self'",
          "style-src 'self'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self'",
          "frame-ancestors 'none'",
        ].join('; ')
      )
    }

    // Remove the server fingerprint
    response.removeHeader('X-Powered-By')
    response.removeHeader('Server')

    // Enforce HTTPS in production
    if (app.inProduction) {
      response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // Cross-Origin policies
    response.header('Cross-Origin-Opener-Policy', 'same-origin')
    response.header('Cross-Origin-Resource-Policy', 'same-origin')

    await next()
  }
}
