import messages from '#database/constants/messages'
import GovtEvent from '#models/govt_event'
import InstituteEvent from '#models/institute_event'
import type { InstituteEventFilters } from '#models/institute_event'
import apiCacheService from './api_cache_service.js'
import { errorHandler } from '../helper/error_handler.js'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

type SyncedEvent = {
  source: 'institute' | 'govt'
  sourceId: number
  createdAt?: string | Date | null
  [key: string]: unknown
}

@inject()
export default class InstituteEventWithGovtEventService {
  constructor(protected ctx: HttpContext) {}

  private normalizeFilters(input?: {
    isActive?: boolean
    isFeatured?: boolean
    eventStatus?: string
    eventCategory?: string
    eventSubCategory?: string
    isOnline?: boolean
    isFree?: boolean
    startDate?: string
    endDate?: string
    instituteId?: number | string
  }): InstituteEventFilters | undefined {
    if (!input) return undefined

    const normalized: InstituteEventFilters = {
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      eventStatus: input.eventStatus,
      eventCategory: input.eventCategory,
      eventSubCategory: input.eventSubCategory,
      isOnline: input.isOnline,
      isFree: input.isFree,
      startDate: input.startDate,
      endDate: input.endDate,
    }

    if (typeof input.instituteId === 'number') {
      normalized.instituteId = input.instituteId
    } else if (typeof input.instituteId === 'string' && input.instituteId.trim() !== '') {
      const instituteId = Number(input.instituteId)
      if (!Number.isNaN(instituteId)) normalized.instituteId = instituteId
    }

    return normalized
  }

  private setSecurityHeaders() {
    this.ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    this.ctx.response.header('Cross-Origin-Resource-Policy', 'cross-origin')
    this.ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  }

  private buildCacheKey(params: Record<string, unknown>) {
    return `institute-govt-events:list:${JSON.stringify(params)}`
  }

  private normalizeEvent(source: 'institute' | 'govt', event: Record<string, unknown>): SyncedEvent {
    return {
      source,
      sourceId: Number(event.id),
      ...event,
    }
  }

  async findAll({
    search,
    filters,
    searchFor,
  }: {
    search?: string
    filters?: {
      isActive?: boolean
      isFeatured?: boolean
      eventStatus?: string
      eventCategory?: string
      eventSubCategory?: string
      isOnline?: boolean
      isFree?: boolean
      startDate?: string
      endDate?: string
      instituteId?: number | string
    }
    searchFor?: string | null
  } = {}) {
    try {
      this.setSecurityHeaders()
      const normalizedFilters = this.normalizeFilters(filters)

      const isCreateMode = searchFor === 'create'
      const effectiveSearch = search?.trim() || (!isCreateMode ? searchFor?.trim() : undefined)
      const cacheKey = this.buildCacheKey({
        search: effectiveSearch,
        filters: normalizedFilters,
        searchFor,
      })

      const result = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          const instituteQuery = InstituteEvent.query().apply((scope) => scope.softDeletes())
          const govtQuery = GovtEvent.query().apply((scope) => scope.softDeletes())

          if (effectiveSearch) {
            instituteQuery.apply((scope) => scope.search(effectiveSearch))
            govtQuery.apply((scope) => scope.search(effectiveSearch))
          }

          if (normalizedFilters) {
            instituteQuery.apply((scope) => scope.filters(normalizedFilters))
            govtQuery.apply((scope) => scope.filters(normalizedFilters))
          }

          if (isCreateMode) {
            instituteQuery.where('is_active', true)
            govtQuery.where('is_active', true)
          }

          const [instituteEvents, govtEvents] = await Promise.all([
            instituteQuery.orderBy('created_at', 'desc'),
            govtQuery.orderBy('created_at', 'desc'),
          ])

          const normalizedInstituteEvents = instituteEvents.map((event) =>
            this.normalizeEvent('institute', event.toJSON())
          )
          const normalizedGovtEvents = govtEvents.map((event) =>
            this.normalizeEvent('govt', event.toJSON())
          )

          const combined = [...normalizedInstituteEvents, ...normalizedGovtEvents].sort((left, right) => {
            const leftCreatedAt = left.createdAt ? new Date(left.createdAt as string).getTime() : 0
            const rightCreatedAt = right.createdAt ? new Date(right.createdAt as string).getTime() : 0

            return rightCreatedAt - leftCreatedAt
          })

          return {
            status: combined.length > 0,
            message: combined.length
              ? 'Synced institute and govt events fetched successfully'
              : 'No synced institute and govt events found',
            data: combined,
            meta: {
              total: combined.length,
              instituteEventCount: normalizedInstituteEvents.length,
              govtEventCount: normalizedGovtEvents.length,
            },
          }
        },
        ['institute-govt-events']
      )

      return result
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}
