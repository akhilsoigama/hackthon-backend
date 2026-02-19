import { QUESTIONS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = QUESTIONS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('question_text').notNullable()
      table.enum('question_type', ['mcq', 'true/false']).notNullable()
      table.integer('marks').notNullable()
      table.integer('quiz_id').unsigned().references('id').inTable('quizzes').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}