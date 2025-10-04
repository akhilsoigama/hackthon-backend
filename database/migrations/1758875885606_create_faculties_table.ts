import { FACULTIES } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = FACULTIES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('faculty_name').notNullable()
      table.string('faculty_id').notNullable().unique() 
      table.string('designation').notNullable()

      table.string('faculty_email').notNullable().unique()
      table.string('faculty_mobile').notNullable().unique()
      table.string('faculty_password').notNullable()

      // Foreign keys
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
      table.timestamp('deleted_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}