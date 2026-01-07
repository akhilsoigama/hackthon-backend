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

  static filters = scope((query, filters: any) => {
    if (!filters) return

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    if (filters.isFeatured !== undefined) {
      query.where('is_featured', filters.isFeatured)
    }

    if (filters.eventStatus) {
      query.where('event_status', filters.eventStatus)
    }

    if (filters.eventCategory) {
      query.where('event_category', filters.eventCategory)
    }

    if (filters.eventSubCategory) {
      query.where('event_sub_category', filters.eventSubCategory)
    }

    if (filters.isOnline !== undefined) {
      query.where('is_online', filters.isOnline)
    }

    if (filters.isFree !== undefined) {
      query.where('is_free', filters.isFree)
    }

    if (filters.startDate && filters.endDate) {
      query.whereBetween('event_date', [
        filters.startDate,
        filters.endDate,
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
