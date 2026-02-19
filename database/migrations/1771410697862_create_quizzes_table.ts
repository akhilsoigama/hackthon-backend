import { QUIZZES } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = QUIZZES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('quiz_title').notNullable()
      table.text('quiz_description')
      table.string('quiz_banner')
      table.string('subject')
      table.string('std')
      table.integer('institute_id').unsigned().references('id').inTable('institutes').onDelete('CASCADE')
      table.integer('faculty_id').unsigned().references('id').inTable('faculties').onDelete('CASCADE')
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('CASCADE')
      table.timestamp('due_date')
      table.integer('marks')
      table.integer('attempt_limit')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}