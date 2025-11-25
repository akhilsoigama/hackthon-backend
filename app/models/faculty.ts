// app/models/faculty.ts
import { BaseModel, column, beforeSave, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import hash from '@adonisjs/core/services/hash'
import Institute from './institute.js'
import Department from './department.js'
import Role from './role.js'
import { DateTime } from 'luxon'

export default class Faculty extends BaseModel {
  public static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare facultyName: string

  @column()
  declare facultyEmail: string

  @column({ serializeAs: null })
  declare facultyPassword: string

  @column()
  declare facultyMobile: string

  @column()
  declare designation: string

  @column()
  declare departmentId: number

  @column()
  declare instituteId: number

  @column()
  declare roleId: number

  @column()
  declare facultyId: string

  @column()
  declare isActive: boolean

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare deletedAt?: DateTime

  @beforeSave()
  public static async hashPassword(faculty: Faculty) {
    if (faculty.$dirty.facultyPassword) {
      faculty.facultyPassword = await hash.make(faculty.facultyPassword)
    }
  }

  public async verifyPassword(password: string): Promise<boolean> {
    return await hash.verify(this.facultyPassword, password)
  }

}