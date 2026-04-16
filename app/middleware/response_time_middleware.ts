import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ResponseTimeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const start = performance.now()

    try {
      await next()
    } finally {
      const durationMs = Number((performance.now() - start).toFixed(2))
      const thresholdMs = Number(process.env.SLOW_API_THRESHOLD_MS || 800)

      // Do not trigger a second auth lookup here; use the user already resolved by auth middleware.
      const userId = (ctx.auth.user as { id?: number } | null)?.id ?? null

      const payload = {
        method: ctx.request.method(),
        path: ctx.request.url(),
        status: ctx.response.getStatus(),
        durationMs,
        userId,
      }

      if (durationMs >= thresholdMs) {
        console.warn('[API_SLOW]', payload)
      } else {
        // console.info('[API_METRIC]', payload)
      }

      ctx.response.header('X-Response-Time', `${durationMs}ms`)
    }
  }
}

