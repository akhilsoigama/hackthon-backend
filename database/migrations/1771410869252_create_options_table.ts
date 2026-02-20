import { OPTIONS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = OPTIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('question_id').unsigned().references('id').inTable('questions').onDelete('CASCADE')
      table.text('option_text').notNullable()
      table.boolean('is_correct').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}