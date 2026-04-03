import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Faculty from './faculty.js'
import Institute from './institute.js'

export type FacultyLeaveStatus = 'pending' | 'approved' | 'rejected'

export default class FacultyLeave extends BaseModel {
  static table = 'faculty_leaves'

  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare facultyId: number

  @column()
  declare instituteId: number

  @column()
  declare leaveType: string

  @column()
  declare reason: string

  @column.date()
  declare startDate: DateTime

  @column.date()
  declare endDate: DateTime

  @column()
  declare totalDays: number

  @column()
  declare status: FacultyLeaveStatus

  @column()
  declare instituteRemark: string | null

  @column()
  declare reviewedByUserId: number | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @belongsTo(() => Faculty)
  declare faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
