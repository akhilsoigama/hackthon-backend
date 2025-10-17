import { BaseSchema } from '@adonisjs/lucid/schema'
import { USER_ROLES } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = USER_ROLES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')

      // Ensure a user can't have duplicate roles
      table.unique(['user_id', 'role_id'])

      // Indexing for faster lookups
      table.index(['user_id', 'role_id'])

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}