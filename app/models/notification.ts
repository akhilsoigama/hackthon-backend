import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import { NOTIFICATIONS } from '#database/constants/table_names'

export type NotificationType =
  | 'assignment'
  | 'quiz'
  | 'lecture'
  | 'query'
  | 'leave'
  | 'general'
  | 'system'

export default class Notification extends BaseModel {
  public static table = NOTIFICATIONS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare userType: 'admin' | 'user'

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare type: NotificationType

  @column()
  declare link: string | null

  @column()
  declare isRead: boolean

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
