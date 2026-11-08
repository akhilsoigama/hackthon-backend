import { BaseSchema } from '@adonisjs/lucid/schema'
import { NOTIFICATIONS, PUSH_SUBSCRIPTIONS, USERS } from '#database/constants/table_names'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable(PUSH_SUBSCRIPTIONS, (table) => {
      table.dropForeign(['user_id'])
      table.string('user_type', 20).notNullable().defaultTo('user')
      table.index(['user_id', 'user_type'])
    })

    this.schema.alterTable(NOTIFICATIONS, (table) => {
      table.dropForeign(['user_id'])
      table.string('user_type', 20).notNullable().defaultTo('user')
      table.index(['user_id', 'user_type'])
    })
  }

  public async down() {
    this.schema.alterTable(PUSH_SUBSCRIPTIONS, (table) => {
      table.dropIndex(['user_id', 'user_type'])
      table.dropColumn('user_type')
      table
        .foreign('user_id')
        .references('id')
        .inTable(USERS)
        .onDelete('CASCADE')
    })

    this.schema.alterTable(NOTIFICATIONS, (table) => {
      table.dropIndex(['user_id', 'user_type'])
      table.dropColumn('user_type')
      table
        .foreign('user_id')
        .references('id')
        .inTable(USERS)
        .onDelete('CASCADE')
    })
  }
}

