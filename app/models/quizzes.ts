import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Department from './department.js'
import Faculty from './faculty.js'
import QuizAttempt from './quiz_attempt.js'
import Question from './question.js'

export default class Quizzes extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'quiz_title' })
  declare quizTitle: string

  @column({ columnName: 'quiz_description' })
  declare quizDescription: string | null

  @column()
  declare quizBanner: string | null

  @column({ columnName: 'subject' })
  declare subject: string | null

  @column({ columnName: 'std' })
  declare std: string | null

  @column({ columnName: 'institute_id' })
  declare instituteId: number

  @column({ columnName: 'faculty_id' })
  declare facultyId: number

  @column({ columnName: 'department_id' })
  declare departmentId: number

  @column({ columnName: 'due_date' })
  declare dueDate: DateTime

  @column({ columnName: 'marks' })
  declare marks: number

  @column({ columnName: 'attempt_limit' })
  declare attemptLimit: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @hasMany(() => Question, {
    foreignKey: 'quizId',
  })
  declare questions: HasMany<typeof Question>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Faculty)
  declare faculty: BelongsTo<typeof Faculty>

  @hasMany(() => QuizAttempt, {
    foreignKey: 'quizId',
  })
  declare attempts: HasMany<typeof QuizAttempt>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt?: DateTime | null
}

