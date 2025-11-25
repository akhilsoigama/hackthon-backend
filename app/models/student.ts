import { BaseModel, column, beforeSave, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

import Role from './role.js'
import Institute from './institute.js'
import Department from './department.js'

export default class Student extends BaseModel {
  /**
   * Soft delete scope
   */
  public static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'student_name' })
  declare studentName: string

  @column({ columnName: 'student_std' })
  declare studentSTD: string

  @column({ columnName: 'student_gr_no' })
  declare studentGrNo: number

  @column({ columnName: 'student_gender' })
  declare studentGender: string


  @column({ columnName: 'student_email' })
  declare studentEmail: string

  @column({ serializeAs: null, columnName: 'student_password' })
  declare studentPassword: string

  @column({ columnName: 'student_mobile' })
  declare studentMobile: string

  @column({ columnName: 'institute_id' })
  declare instituteId: number

  @column({ columnName: 'role_id' })
  declare roleId: number

  @column({ columnName: 'department_id' })
  declare departmentId: number

  @column({ columnName: 'student_id' })
  declare studentId: string

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt?: DateTime | null

  @belongsTo(() => Institute)
  declare institute: BelongsTo<typeof Institute>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @beforeSave()
  public static async hashPassword(student: Student) {
    if (student.$dirty.studentPassword) {
      student.studentPassword = await hash.make(student.studentPassword)
    }
  }
   public async verifyPassword(password: string): Promise<boolean> {
    return await hash.verify(this.studentPassword, password)
  }
}
