import { BaseModel, column, scope } from "@adonisjs/lucid/orm"
import { DateTime } from "luxon"

export default class GovtEvent extends BaseModel {

  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  static search = scope((query, search?: string) => {
    if (!search) return

    query.where((q) => {
      q.whereILike('event_title', `%${search}%`)
       .orWhereILike('event_description', `%${search}%`)
       .orWhereILike('event_organizer', `%${search}%`)
       .orWhereILike('event_venue', `%${search}%`)
       .orWhereILike('tags', `%${search}%`)
    })
  })

  static filters = scope((query, filters: unknown) => {
    if (!filters || typeof filters !== 'object') return

    const f = filters as Partial<{
      isActive: boolean
      isFeatured: boolean
      eventStatus: string
      eventCategory: string
      eventSubCategory: string
      isOnline: boolean
      isFree: boolean
      startDate: string
      endDate: string
    }>

    if (typeof f.isActive === 'boolean') {
      query.where('is_active', f.isActive)
    }

    if (typeof f.isFeatured === 'boolean') {
      query.where('is_featured', f.isFeatured)
    }

    if (typeof f.eventStatus === 'string' && f.eventStatus) {
      query.where('event_status', f.eventStatus)
    }

    if (typeof f.eventCategory === 'string' && f.eventCategory) {
      query.where('event_category', f.eventCategory)
    }

    if (typeof f.eventSubCategory === 'string' && f.eventSubCategory) {
      query.where('event_sub_category', f.eventSubCategory)
    }

    if (typeof f.isOnline === 'boolean') {
      query.where('is_online', f.isOnline)
    }

    if (typeof f.isFree === 'boolean') {
      query.where('is_free', f.isFree)
    }

    if (typeof f.startDate === 'string' && typeof f.endDate === 'string' && f.startDate && f.endDate) {
      query.whereBetween('event_date', [
        f.startDate,
        f.endDate,
      ])
    }
  })

  @column({ isPrimary: true }) declare id: number
  @column() declare eventTitle: string
  @column() declare eventSlug: string
  @column() declare eventDescription: string
  @column() declare eventDate: string
  @column() declare eventTime: string
  @column() declare eventDuration: string
  @column() declare eventBanner: string
  @column() declare eventLink: string
  @column() declare registrationLink: string
  @column() declare eventOrganizer: string
  @column() declare organizerLogo: string
  @column() declare eventContact: string
  @column() declare eventEmail: string
  @column() declare eventPhone: string
  @column() declare eventCategory: string
  @column() declare eventSubCategory: string
  @column() declare tags: string
  @column() declare eventVenue: string
  @column() declare eventLocation: string
  @column() declare latitude: string
  @column() declare longitude: string
  @column() declare isOnline: boolean
  @column() declare eventFee: string
  @column() declare isFree: boolean
  @column() declare eventStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  @column() declare priority: number
  @column() declare viewCount: number
  @column() declare isActive: boolean
  @column() declare isFeatured: boolean
  @column() declare createdBy: number
  @column() declare updatedBy: number

  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
  @column.dateTime({ serializeAs: null }) declare deletedAt: DateTime
}

