// app/modules/search/controllers/search_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { ApiResponse } from '#shared/response/ApiResponse'
import SearchService from '../services/search_service.js'

const searchService = new SearchService()

export default class SearchController {
  private async getAuthUser(ctx: HttpContext): Promise<{ id: number; instituteId?: number | null } | null> {
    try {
      const anyCtx = ctx as any
      if (anyCtx.authUser) return anyCtx.authUser
      if (anyCtx.user) return anyCtx.user
      if (ctx.auth?.user) return ctx.auth.user

      for (const guard of ['api', 'adminapi'] as const) {
        try {
          const authInstance = ctx.auth.use(guard)
          if (await authInstance.check()) {
            return authInstance.user as { id: number; instituteId?: number | null }
          }
        } catch {}
      }
    } catch {}

    return null
  }

  /**
   * GET /api/v1/search?q=keyword&limit=5
   */
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const q = request.input('q', '')
    const limit = request.input('limit', 5)
    const user = await this.getAuthUser(ctx)

    const results = await searchService.search(String(q), {
      instituteId: user?.instituteId || null,
      limitPerCategory: Number(limit) || 5,
    })

    return response.ok(ApiResponse.success(results, 'Search results fetched successfully'))
  }
}
