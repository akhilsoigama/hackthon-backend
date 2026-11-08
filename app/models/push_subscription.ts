import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import { PUSH_SUBSCRIPTIONS } from '#database/constants/table_names'

export default class PushSubscription extends BaseModel {
  public static table = PUSH_SUBSCRIPTIONS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare userType: 'admin' | 'user'

  @column()
  declare endpoint: string

  @column()
  declare p256dh: string

  @column()
  declare auth: string

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
