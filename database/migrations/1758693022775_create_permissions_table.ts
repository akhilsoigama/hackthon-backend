import { PERMISSIONS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = PERMISSIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('permission_name').notNullable()
      table.string('permission_key').notNullable().unique()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
