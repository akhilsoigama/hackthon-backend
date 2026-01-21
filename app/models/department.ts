import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Department extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare departmentName: string

  @column()
  declare departmentCode: string

  @column()
  declare description: string
  @column()
  declare instituteId: number
  @column()
  declare isActive: boolean
  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
