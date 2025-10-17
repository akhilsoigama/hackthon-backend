// app/models/role.ts
import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { ROLES, USER_ROLES, ROLE_PERMISSIONS } from '#database/constants/table_names'
import User from './user.js'
import Permission from './permission.js'

export default class Role extends BaseModel {
  public static table = ROLES

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roleName: string

  @column()
  declare roleDescription: string | null

  @column()
  declare roleKey: string

  @column()
  declare isDefault: boolean

  @manyToMany(() => User, {
    pivotTable: USER_ROLES,
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Permission, {
    pivotTable: ROLE_PERMISSIONS,
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'permission_id',
  })
  declare permissions: ManyToMany<typeof Permission>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static async hasPermission(roleId: number, permissionKey: string): Promise<boolean> {
    const role = await Role.query()
      .where('id', roleId)
      .preload('permissions')
      .first()

    return role?.permissions.some(permission => permission.permissionKey === permissionKey) || false
  }
}