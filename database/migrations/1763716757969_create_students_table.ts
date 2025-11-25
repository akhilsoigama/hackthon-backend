import { STUDENTS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = STUDENTS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('student_name').notNullable()
      table.string('student_id').notNullable().unique()
      table.string('student_email').notNullable().unique()
      table.string('student_mobile').notNullable().unique()
      table.string('student_password').notNullable()

      table
        .integer('department_id')
        .unsigned()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE')

      table
        .integer('institute_id')
        .unsigned()
        .references('id')
        .inTable('institutes')
        .onDelete('CASCADE')

      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')

      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
