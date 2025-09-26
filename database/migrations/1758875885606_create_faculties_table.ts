import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faculties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('faculty_name').notNullable()
      table.integer('faculty_id').notNullable().unique()
      table.string('designation').notNullable()
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
      table.boolean('is_active').defaultTo(true)
      table.timestamp('deleted_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}