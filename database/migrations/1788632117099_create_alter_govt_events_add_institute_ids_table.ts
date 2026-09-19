import { GOVT_EVENT } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = GOVT_EVENT

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('institute_id').unsigned().nullable().references('id').inTable('institutes').onDelete('CASCADE')
      table.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('institute_id')
      table.dropColumn('department_id')
    })
  }
}