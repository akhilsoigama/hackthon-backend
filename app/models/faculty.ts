import { BaseModel, belongsTo, column, scope } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"
import Department from "./department.js"
import Institute from "./institute.js"
import Role from "./role.js"

export default class Faculty extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare facultyName: string

  @column()
  declare facultyId: number

  @column()
  declare designation: string

  @column()
  declare departmentId: number

  @column()
  declare instituteId: number

  @column()
  declare roleId: number

  @column()
  declare isActive: boolean

  @belongsTo(() => Department, {
    foreignKey: 'departmentId',
  })
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Institute, {
    foreignKey: 'instituteId',
  })
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Role, {
    foreignKey: 'roleId',
  })
  declare role: BelongsTo<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
