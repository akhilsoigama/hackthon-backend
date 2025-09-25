import { POLICIES, USERS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = POLICIES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('policy_name')
      table.integer('user_id').unsigned().references('id').inTable(USERS).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}