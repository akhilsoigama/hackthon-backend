import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    let userId: number | null = null
    try {
      const user = await ctx.auth.authenticate()
      userId = user?.id ?? null
    } catch {
      userId = null
    }

    console.error('[API_ERROR]', {
      method: ctx.request.method(),
      path: ctx.request.url(),
      userId,
      error,
    })

    return super.report(error, ctx)
  }
}

