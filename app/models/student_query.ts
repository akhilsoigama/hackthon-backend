import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Student from './student.js'
import Institute from './institute.js'
import Faculty from './faculty.js'
import User from './user.js'
import { STUDENT_QUERIES } from '#database/constants/table_names'

export type StudentQueryPriority = 'low' | 'medium' | 'high'
export type StudentQueryStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export default class StudentQuery extends BaseModel {
  static table = STUDENT_QUERIES

  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column()
  declare instituteId: number

  @column()
  declare assignedFacultyId: number | null

  @column()
  declare resolvedByUserId: number | null

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare subject: string | null

  @column()
  declare category: string | null

  @column()
  declare priority: StudentQueryPriority

  @column()
  declare status: StudentQueryStatus

  @column()
  declare response: string | null

  @column.dateTime()
  declare resolvedAt: DateTime | null

  @column()
  declare isActive: boolean

  @belongsTo(() => Student)
  declare student: BelongsTo<typeof Student>

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Faculty, {
    foreignKey: 'assignedFacultyId',
  })
  declare assignedFaculty: BelongsTo<typeof Faculty>

  @belongsTo(() => User, {
    foreignKey: 'resolvedByUserId',
  })
  declare resolvedBy: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}

