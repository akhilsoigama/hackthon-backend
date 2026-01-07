import { GOVT_EVENT } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = GOVT_EVENT

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('event_title').notNullable()
      table.string('event_slug').notNullable().unique()
      table.text('event_description')

      table.date('event_date')
      table.string('event_time')
      table.string('event_duration')

      table.string('event_banner')
      table.string('event_link')
      table.string('registration_link')

      table.string('event_organizer')
      table.string('organizer_logo')

      table.string('event_contact')
      table.string('event_email')
      table.string('event_phone')

      table.string('event_category')
      table.string('event_sub_category')

      table.string('tags')

      table.string('event_venue')
      table.string('event_location')

      table.decimal('latitude', 10, 7)
      table.decimal('longitude', 10, 7)

      table.boolean('is_online').defaultTo(false)

      table.string('event_fee')
      table.boolean('is_free').defaultTo(true)

      table
        .enum('event_status', ['upcoming', 'ongoing', 'completed', 'cancelled'])
        .defaultTo('upcoming')

      table.integer('priority').defaultTo(0)
      table.integer('view_count').defaultTo(0)

      table.boolean('is_active').defaultTo(true)
      table.boolean('is_featured').defaultTo(false)
      table.boolean('is_deleted').defaultTo(false)

      table.integer('created_by').unsigned()
      table.integer('updated_by').unsigned()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
