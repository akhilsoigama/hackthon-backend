import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from './student.js'

export default class SubjectProgress extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare studentId: number;

  @column()
  declare instituteId: number;

  @column()
  declare subject: string;

  @column()
  declare totalQuizzes: number;

  @column()
  declare totalAssignments: number;

  @column()
  declare aveQuizScore: number;

  @column()
  declare aveAssignmentScore: number;

  @column()
  declare submittedAssignments: number;

  @column()
  declare overAllProgress: number;

  @belongsTo(() => Student)
  declare student: BelongsTo<typeof Student>

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
