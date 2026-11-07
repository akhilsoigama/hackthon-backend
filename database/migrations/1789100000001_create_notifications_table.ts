import { BaseSchema } from '@adonisjs/lucid/schema'
import { NOTIFICATIONS, USERS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = NOTIFICATIONS

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(USERS)
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.string('type', 50).notNullable().defaultTo('general')
      table.string('link', 500).nullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.jsonb('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'])
      table.index(['user_id', 'is_read'])
      table.index(['created_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
