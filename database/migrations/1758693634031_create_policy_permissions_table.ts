import { PERMISSIONS, POLICIES, POLICY_PERMISSIONS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = POLICY_PERMISSIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

       table.integer('policy_id').unsigned().references('id').inTable(POLICIES).onDelete('CASCADE')
      table
        .integer('permission_id')
        .unsigned()
        .references('id')
        .inTable(PERMISSIONS)
        .onDelete('CASCADE')

      table.unique(['policy_id', 'permission_id'])
      table.index(['policy_id', 'permission_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}