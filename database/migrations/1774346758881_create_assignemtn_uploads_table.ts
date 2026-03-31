import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'assignemtn_uploads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('assignment_id')
        .unsigned()
        .references('id')
        .inTable('assignments')
        .onDelete('CASCADE')
      table
        .integer('student_id')
        .unsigned()
        .references('id')
        .inTable('students')
        .onDelete('CASCADE') 
      table
        .integer('faculty_id')
        .unsigned()
        .references('id')
        .inTable('faculties')
        .onDelete('CASCADE') 
      table
        .integer('institute_id')
        .unsigned()
        .references('id')
        .inTable('institutes')
        .onDelete('CASCADE') 
      table
        .integer('department_id')
        .unsigned()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE') 
      table.integer('marks').unsigned().nullable()
      table.string('grad').nullable()
      table.string('assignment_file', 255).notNullable()
      table.boolean('is_submitted').notNullable().defaultTo(false)
      table.boolean('is_graded_by_faculty').notNullable().defaultTo(false)
      table.boolean('is_graded').notNullable().defaultTo(false)
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
