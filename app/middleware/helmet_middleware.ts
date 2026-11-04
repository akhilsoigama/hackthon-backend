// app/middleware/helmet_middleware.ts
// Adds essential HTTP security headers to every response.
// Replaces the need for the 'helmet' npm package by using AdonisJS's response API.

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'

export default class HelmetMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const url = request.url()
    const isDocRoute = url.startsWith('/docs') || url.startsWith('/scalar') || url.startsWith('/swagger')

    // Prevent MIME-type sniffing
    response.header('X-Content-Type-Options', 'nosniff')

    if (!isDocRoute) {
      // Prevent clickjacking
      response.header('X-Frame-Options', 'DENY')
    }

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
    if (isDocRoute) {
      // Allow CDN assets and inline initialization scripts for Swagger UI & Scalar UI
      response.header(
        'Content-Security-Policy',
        [
          "default-src 'self' https: data:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com",
          "img-src 'self' data: https:",
          "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
          "connect-src 'self' https:",
        ].join('; ')
      )
    } else if (app.inProduction) {
      // Strict CSP for production API endpoints
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
    if (app.inProduction && !isDocRoute) {
      response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // Cross-Origin policies
    if (!isDocRoute) {
      response.header('Cross-Origin-Opener-Policy', 'same-origin')
      response.header('Cross-Origin-Resource-Policy', 'same-origin')
    } else {
      response.header('Cross-Origin-Resource-Policy', 'cross-origin')
    }

    await next()
  }
}
