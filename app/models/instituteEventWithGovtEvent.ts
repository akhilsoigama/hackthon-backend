import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import InstituteEvent from './institute_event.js'
import GovtEvent from './govt_event.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { INSTITUTE_WITH_GOVT_EVENTS } from '#database/constants/table_names'

export default class InstituteEventWithGovtEvent extends BaseModel {
  static table = INSTITUTE_WITH_GOVT_EVENTS

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare instituteEventId: number

  @column()
  declare govtEventId: number

  @belongsTo(() => InstituteEvent, {
    foreignKey: 'instituteEventId',
  })
  declare instituteEvent: BelongsTo<typeof InstituteEvent>

  @belongsTo(() => GovtEvent, {
    foreignKey: 'govtEventId',
  })
  declare govtEvent: BelongsTo<typeof GovtEvent>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

}

