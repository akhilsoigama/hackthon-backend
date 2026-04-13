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

      let userId: number | null = null
      try {
        const user = await ctx.auth.authenticate()
        userId = user?.id ?? null
      } catch {
        userId = null
      }

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
