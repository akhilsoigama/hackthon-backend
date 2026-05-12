import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from './student.js'

export default class ProgressReport extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column.dateTime({ autoCreate: true })
  declare generatedAt: DateTime

  @column()
  declare instituteId: number

  @column()
  declare aiSummary: string

  @column()
  declare aiRecommendations: string

  @column()
  declare weakAreas: string[] | null

  @column()
  declare strongAreas: string[] | null

  @column()
  declare rawData: Record<string, any> | null

  @column()
  declare overallPerformance: string

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Student)
  declare student: BelongsTo<typeof Student>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
