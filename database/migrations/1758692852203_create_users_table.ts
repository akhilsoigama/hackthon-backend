import { BaseSchema } from '@adonisjs/lucid/schema'
import { USERS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = USERS

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.enum('user_type', ['super_admin', 'institute', 'faculty', 'student']).notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('mobile', 20).notNullable().unique()
      table.string('password').notNullable()
      table.integer('institute_id').unsigned().nullable()
      table.integer('faculty_id').unsigned().nullable()
      table.boolean('is_email_verified').notNullable().defaultTo(false)
      table.boolean('is_mobile_verified').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
