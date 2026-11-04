import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('govt_events', (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })

    this.schema.alterTable('institute_events', (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })
  }

  async down() {
    this.schema.alterTable('govt_events', (table) => {
      table.decimal('latitude', 10, 7).nullable()
      table.decimal('longitude', 10, 7).nullable()
    })

    this.schema.alterTable('institute_events', (table) => {
      table.decimal('latitude', 10, 7).nullable()
      table.decimal('longitude', 10, 7).nullable()
    })
  }
}
