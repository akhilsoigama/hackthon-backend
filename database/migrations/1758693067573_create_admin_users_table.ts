import { ADMIN_USERS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = ADMIN_USERS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('mobile', 254).notNullable().unique()
      table.string('password').notNullable()
      table.boolean('is_admin').defaultTo(true).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
