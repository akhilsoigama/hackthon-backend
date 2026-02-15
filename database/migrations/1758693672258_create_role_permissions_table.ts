import { BaseSchema } from '@adonisjs/lucid/schema'
import { ROLE_PERMISSIONS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = ROLE_PERMISSIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
      
      table.unique(['role_id', 'permission_id'])

      table.index(['role_id', 'permission_id'])

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}