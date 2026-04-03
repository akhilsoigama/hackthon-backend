import { BaseSchema } from '@adonisjs/lucid/schema'
import { STUDENT_QUERIES } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = STUDENT_QUERIES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('student_id')
        .unsigned()
        .references('id')
        .inTable('students')
        .onDelete('CASCADE')

      table
        .integer('institute_id')
        .unsigned()
        .references('id')
        .inTable('institutes')
        .onDelete('CASCADE')

      table
        .integer('assigned_faculty_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculties')
        .onDelete('SET NULL')

      table
        .integer('resolved_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('subject').nullable()
      table.string('category').nullable()
      table.enum('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium')
      table
        .enum('status', ['open', 'in_progress', 'resolved', 'closed'])
        .notNullable()
        .defaultTo('open')
      table.text('response').nullable()
      table.timestamp('resolved_at').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
