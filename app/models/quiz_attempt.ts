import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Quizzes from './quizzes.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Student from './student.js'
import Institute from './institute.js'

export default class QuizAttempt extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'quiz_id' })
  declare quizId: number

  @column({ columnName: 'student_id' })
  declare studentId: number

  @column({ columnName: 'institute_id' })
  declare instituteId: number

  @column({ columnName: 'score' })
  declare score: number

  @column({ columnName: 'attempted_at' })
  declare attemptedAt: DateTime | null

  @column({ columnName: 'status' })
  declare status: 'in_progress' | 'submitted' | 'completed'

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'updated_by' })
  declare updatedBy: number | null

  @belongsTo(() => Quizzes, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quizzes>

  @belongsTo(() => Student)
  declare student: BelongsTo<typeof Student>

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
