import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import Quizzes from './quizzes.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Options from './options.js'

export default class Question extends BaseModel {
  static softDeletes = scope((query) => {
    query.whereNull('deleted_at')
  })

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare questionText: string

  @column({ columnName: 'quiz_id' })
  declare quizId: number

  @column()
  declare questionType: 'mcq' | 'true/false'

  @column()
  declare marks: number

  @belongsTo(() => Quizzes, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quizzes>

  @hasMany(() => Options)
  declare options: HasMany<typeof Options>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
