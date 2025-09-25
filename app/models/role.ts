import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import { ROLE_PERMISSIONS, USER_ROLES } from '#database/constants/table_names'
import Permission from './permission.js'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roleName: string

  @column()
  declare roleDescription: string

  @column()
  declare roleKey: string

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Permission, {
    pivotTable: ROLE_PERMISSIONS,
  })
  declare permissions: ManyToMany<typeof Permission>

  @manyToMany(() => User, {
    pivotTable: USER_ROLES,
  })
  declare users: ManyToMany<typeof User>

  serializeExtras() {
    return {
      isAdmin: this.$extras.pivot_is_admin,
    }
  }
}
