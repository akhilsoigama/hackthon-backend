import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Role from './role.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { ROLE_PERMISSIONS } from '#database/constants/table_names'

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare permissionName: string

  @column()
  declare permissionKey: string

  @manyToMany(() => Role, {
    pivotTable: ROLE_PERMISSIONS, // This is the pivot table
  })
  declare roles: ManyToMany<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
