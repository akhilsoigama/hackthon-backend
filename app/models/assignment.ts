import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Faculty from './faculty.js'
import Department from './department.js'

export default class Assignment extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare assignmentTitle: string

  @column()
  declare assignmentDescription: string | null

  @column()
  declare subject: string | null

  @column()
  declare assignmentFile: string | null

  @column()
  declare std: string | null

  @column()
  declare instituteId: number

  @column()
  declare facultyId: number

@column.date()
declare dueDate: DateTime | null

  @column()
  declare marks: number | null

  @column()
  declare departmentId: number

  @column()
  declare isActive: boolean

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'updated_by' })
  declare updatedBy: number | null

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Faculty)
  declare faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}

