import { BaseSchema } from '@adonisjs/lucid/schema'
import { INSTITUTES } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = INSTITUTES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('institute_name').notNullable()
      table.string('institute_password').notNullable()
      table.string('institute_address').nullable()
      table.string('institute_phone').nullable()
      table.string('institute_email').nullable()
      table.string('institute_website').nullable()
      table.string('institute_code').nullable()
      table.string('affiliation').nullable()
      table.string('established_year').nullable()
      table.string('principal_name').nullable()
      table.string('principal_email').nullable()
      table.string('principal_phone').nullable()
      table.string('institute_city').nullable()
      table.string('institute_state').nullable()
      table.string('institute_country').nullable()
      table.string('institute_pin_code').nullable()
      table.string('institute_type').notNullable()
      table.integer('role_id').unsigned().nullable()
      table.foreign('role_id').references('id').inTable('roles')

      table.string('principal_qualification').nullable()
      table.string('principal_experience').nullable()
      table.string('campus_area').nullable()
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
