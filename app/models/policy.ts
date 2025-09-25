import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { POLICY_PERMISSIONS } from '#database/constants/table_names'
import Permission from './permission.js'
import User from './user.js'

export default class Policy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare policyName: string

  @manyToMany(() => Permission, {
    pivotTable: POLICY_PERMISSIONS,
  })
  declare permissions: ManyToMany<typeof Permission>

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare owner: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}