import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Institute from './institute.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Assignment from './assignment.js'
import Faculty from './faculty.js'
import Student from './student.js'
import Department from './department.js'

export default class AssignmentUpload extends BaseModel {
  static table = 'assignment_uploads'

  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare assignmentId: number

  @column()
  declare studentId: number

  @column()
  declare facultyId: number | null

  @column()
  declare instituteId: number | null

  @column()
  declare marks: number | null

  @column()
  declare grad: string | null

  @column()
  declare grade: string | null

  @column()
  declare assignmentFile: string

  @column()
  declare isSubmitted: boolean

  @column()
  declare departmentId: number | null

  @column()
  declare isGradedByFaculty: boolean | null

  @column()
  declare isGraded: boolean

  @column()
  declare isActive: boolean

  @belongsTo(() => Institute)
  declare Institute: BelongsTo<typeof Institute>

  @belongsTo(() => Assignment)
  declare Assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => Faculty)
  declare Faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => Student)
  declare Student: BelongsTo<typeof Student>

  @belongsTo(() => Department)
  declare Department: BelongsTo<typeof Department>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}

