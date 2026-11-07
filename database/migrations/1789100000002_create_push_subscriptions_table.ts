import { BaseSchema } from '@adonisjs/lucid/schema'
import { PUSH_SUBSCRIPTIONS, USERS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = PUSH_SUBSCRIPTIONS

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
      table.text('endpoint').notNullable().unique()
      table.text('p256dh').notNullable()
      table.text('auth').notNullable()
      table.string('user_agent', 255).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'])
      table.index(['endpoint'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
