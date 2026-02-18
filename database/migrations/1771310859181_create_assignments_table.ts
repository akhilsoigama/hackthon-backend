import { ASSIGNMENTS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = ASSIGNMENTS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('assignment_title').notNullable()
      table.text('assignment_description').nullable()
      table.string('subject').nullable()
      table.string('std').nullable()
      table.string('assignment_file').nullable()
      table.integer('institute_id').unsigned().references('id').inTable('institutes').onDelete('CASCADE')
      table.integer('faculty_id').unsigned().references('id').inTable('faculties').onDelete('CASCADE')
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('CASCADE')
      table.dateTime('due_date').nullable()
      table.integer('marks').nullable()
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