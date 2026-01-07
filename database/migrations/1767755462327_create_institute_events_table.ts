import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'institute_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('event_title').notNullable()
      table.text('event_description').notNullable()
      table.string('event_slug').notNullable()
      table.string('event_organizer').notNullable()
      table.string('event_venue').notNullable()
      table.string('event_location').nullable()
      table.string('registration_link').nullable()
      table.string('event_fee').nullable()
      table.string('event_duration').notNullable()
      table
        .integer('institute_id')
        .unsigned()
        .references('id')
        .inTable('institutes')
        .onDelete('CASCADE')
      table
        .enum('event_status', ['upcoming', 'ongoing', 'completed', 'cancelled'])
        .defaultTo('upcoming')
      table.date('event_date').notNullable()
      table.string('event_start_time').notNullable()
      table.string('event_end_time').notNullable()
      table.string('event_banner').notNullable()
      table.string('event_category').notNullable()
      table.string('event_sub_category').notNullable()
      table.string('tags').nullable()
      table.decimal('latitude', 10, 7)
      table.decimal('longitude', 10, 7)
      table.integer('priority').defaultTo(0)
      table.integer('view_count').defaultTo(0)
      table.string('event_contact').notNullable()
      table.string('event_email').notNullable()
      table.string('event_phone').notNullable()
      table.boolean('is_online').notNullable().defaultTo(false)
      table.boolean('is_free').notNullable().defaultTo(false)
      table.boolean('is_featured').notNullable().defaultTo(false)
      table.boolean('is_published').notNullable().defaultTo(false)
      table.integer('created_by').unsigned().notNullable()
      table.integer('updated_by').unsigned().notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}