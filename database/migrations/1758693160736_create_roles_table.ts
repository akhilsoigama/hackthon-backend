import { ROLES } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = ROLES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('role_name')
      table.string('role_description')
      table.string('role_key')
      table.string('role_access_level')
      table.boolean('is_default').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
