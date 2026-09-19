import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Institute from './institute.js'
import Department from './department.js'
import Faculty from './faculty.js'
import User from './user.js'
import { MATERIALS } from '#database/constants/table_names'

export default class Material extends BaseModel {
  public static table = MATERIALS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string | null

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare subject: string | null

  @column()
  declare std: string | null

  @column({ columnName: 'content_type' })
  declare contentType: 'video' | 'pdf' | 'audio' | 'text' | 'image'

  @column({ columnName: 'thumbnail_url' })
  declare thumbnailUrl: string | null

  @column({ columnName: 'content_url' })
  declare contentUrl: string | null

  @column({ columnName: 'duration_in_seconds' })
  declare durationInSeconds: number | null

  @column({ columnName: 'text_content' })
  declare textContent: string | null

  @column({ columnName: 'institute_id' })
  declare instituteId: number

  @column({ columnName: 'department_id' })
  declare departmentId: number | null

  @column({ columnName: 'faculty_id' })
  declare facultyId: number | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'updated_by' })
  declare updatedBy: number | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @belongsTo(() => Institute, { foreignKey: 'instituteId' })
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Department, { foreignKey: 'departmentId' })
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Faculty, { foreignKey: 'facultyId' })
  declare faculty: BelongsTo<typeof Faculty>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedBy' })
  declare updater: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  // Snake_case getters for consistency with data isolation & tests
  get institute_id(): number {
    return this.instituteId
  }

  get department_id(): number | null {
    return this.departmentId
  }

  get faculty_id(): number | null {
    return this.facultyId
  }

  get created_by(): number | null {
    return this.createdBy
  }

  get updated_by(): number | null {
    return this.updatedBy
  }
}
