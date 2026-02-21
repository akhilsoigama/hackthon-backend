import { QUIZ_ATTEMPT } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = QUIZ_ATTEMPT

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('quiz_id').unsigned().references('id').inTable('quizzes').onDelete('CASCADE')
      table.integer('student_id').unsigned().references('id').inTable('students').onDelete('CASCADE')
      table.integer('institute_id').unsigned().references('id').inTable('institutes').onDelete('CASCADE')
      table.integer('score')
      table.timestamp('attempted_at')
      table.enum('status', ['in_progress', 'submitted', 'completed']).defaultTo('in_progress')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}