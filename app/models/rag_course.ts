import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class RagCourse extends BaseModel {
  public static table = 'rag_courses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare category: string

  @column({ columnName: 'sub_category' })
  declare subCategory: string | null

  @column()
  declare description: string

  @column({
    prepare: (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value ?? [])),
    consume: (value: unknown) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(String(value))
      } catch {
        return []
      }
    },
  })
  declare tags: string[]

  @column({ columnName: 'video_type' })
  declare videoType: string

  @column({ columnName: 'video_url' })
  declare videoUrl: string

  @column({
    columnName: 'sub_modules',
    prepare: (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value ?? [])),
    consume: (value: unknown) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      try {
        return JSON.parse(String(value))
      } catch {
        return []
      }
    },
  })
  declare subModules: any[]

  @column({ columnName: 'institute_id' })
  declare instituteId: number | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

