import type { HttpContext } from '@adonisjs/core/http'

export type ListQueryParams = {
  page: number
  limit: number
  search?: string
  searchFor?: string
  withDeleted: boolean
}

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export function parseListQuery(ctx: HttpContext): ListQueryParams {
  const pageRaw = Number(ctx.request.input('page', DEFAULT_PAGE))
  const limitRaw = Number(ctx.request.input('limit', DEFAULT_LIMIT))

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : DEFAULT_PAGE
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : DEFAULT_LIMIT

  const search = ctx.request.input('search') as string | undefined
  const searchFor = ctx.request.input('searchFor') as string | undefined
  const withDeleted = String(ctx.request.input('withDeleted', 'false')) === 'true'

  return {
    page,
    limit,
    search,
    searchFor,
    withDeleted,
  }
}
