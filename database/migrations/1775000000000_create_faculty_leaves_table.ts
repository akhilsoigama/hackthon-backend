import { FACULTIES, FACULTY_LEAVES, INSTITUTES, USERS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = FACULTY_LEAVES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('faculty_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(FACULTIES)
        .onDelete('CASCADE')

      table
        .integer('institute_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(INSTITUTES)
        .onDelete('CASCADE')

      table.string('leave_type', 50).notNullable()
      table.text('reason').notNullable()
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
      table.integer('total_days').notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.text('institute_remark').nullable()

      table
        .integer('reviewed_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(USERS)
        .onDelete('SET NULL')

      table.timestamp('reviewed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
