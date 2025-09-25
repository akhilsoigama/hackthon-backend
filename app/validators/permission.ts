import { BaseSchema } from '@adonisjs/lucid/schema'
import { ROLE_PERMISSIONS } from '#database/constants/table_names'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('permission_name').notNullable()
      table.string('permission_key').notNullable()
      table.timestamps(true, true) // created_at and updated_at
    })

    // Optionally, create the pivot table for role_permissions
    this.schema.createTable(ROLE_PERMISSIONS, (table) => {
      table.increments('id').primary()
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE')
      table.unique(['role_id', 'permission_id']) // Unique constraint for role_id and permission_id
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(ROLE_PERMISSIONS)
    this.schema.dropTable(this.tableName)
  }
}
