import { BaseSchema } from '@adonisjs/lucid/schema'
import { ROLE_PERMISSIONS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = ROLE_PERMISSIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
      
      // Ensure a role can't have duplicate permissions
      table.unique(['role_id', 'permission_id'])

      // Indexing for better performance
      table.index(['role_id', 'permission_id'])

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}