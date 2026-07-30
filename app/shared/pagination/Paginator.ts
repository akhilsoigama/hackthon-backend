// app/shared/pagination/Paginator.ts
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import type { PaginatedResult, PaginationInput, PaginationMeta } from '../types/shared.types.js'

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

/**
 * Parse and sanitize pagination query parameters from an incoming request.
 */
export function parsePaginationInput(qs: Record<string, unknown>): PaginationInput {
  const page = Math.max(1, Number(qs.page) || DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(qs.limit) || DEFAULT_LIMIT))
  const search = typeof qs.search === 'string' && qs.search.trim() ? qs.search.trim() : undefined
  const sortBy = typeof qs.sortBy === 'string' && qs.sortBy.trim() ? qs.sortBy.trim() : undefined
  const sortOrder =
    qs.sortOrder === 'asc' || qs.sortOrder === 'desc' ? qs.sortOrder : ('desc' as const)

  return { page, limit, search, sortBy, sortOrder }
}

/**
 * Build pagination meta from raw counts.
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const lastPage = Math.max(1, Math.ceil(total / limit))
  return {
    total,
    page,
    limit,
    lastPage,
    hasNextPage: page < lastPage,
    hasPreviousPage: page > 1,
  }
}

/**
 * Paginate a Lucid query builder and return a typed PaginatedResult.
 *
 * @example
 * const result = await paginate(
 *   User.query().where('isActive', true),
 *   { page: 1, limit: 20 }
 * )
 */
export async function paginate<M extends LucidModel>(
  query: ModelQueryBuilderContract<M>,
  input: PaginationInput
): Promise<PaginatedResult<InstanceType<M>>> {
  const { page, limit } = input

  const paginatedData = await query.paginate(page, limit)
  const { total, lastPage, currentPage, perPage } = paginatedData.getMeta()

  return {
    data: paginatedData.all() as InstanceType<M>[],
    meta: {
      total,
      page: currentPage,
      limit: perPage,
      lastPage,
      hasNextPage: currentPage < lastPage,
      hasPreviousPage: currentPage > 1,
    },
  }
}
