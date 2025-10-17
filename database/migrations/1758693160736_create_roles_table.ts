import { ROLES } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = ROLES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('role_name').notNullable()
      table.string('role_description').nullable()
      table.string('role_key').notNullable().unique()
      table.boolean('is_default').defaultTo(false)


      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}