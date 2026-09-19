import { MATERIALS } from '#database/constants/table_names'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = MATERIALS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('uuid', 64).nullable().unique()
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('subject', 150).nullable()
      table.string('std', 50).nullable()
      table.enum('content_type', ['video', 'pdf', 'audio', 'text', 'image']).notNullable().defaultTo('pdf')
      table.string('thumbnail_url').nullable()
      table.string('content_url').nullable()
      table.integer('duration_in_seconds').nullable()
      table.text('text_content').nullable()

      table
        .integer('institute_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('institutes')
        .onDelete('CASCADE')

      table
        .integer('department_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')

      table
        .integer('faculty_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculties')
        .onDelete('SET NULL')

      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table
        .integer('updated_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()

      // Indexes for performance and filtering
      table.index(['uuid'], 'materials_uuid_idx')
      table.index(['institute_id'], 'materials_institute_id_idx')
      table.index(['department_id'], 'materials_department_id_idx')
      table.index(['faculty_id'], 'materials_faculty_id_idx')
      table.index(['created_by'], 'materials_created_by_idx')
      table.index(['is_active'], 'materials_is_active_idx')
      table.index(['deleted_at'], 'materials_deleted_at_idx')
      table.index(['title'], 'materials_title_idx')
      table.index(['subject'], 'materials_subject_idx')
      table.index(['created_at'], 'materials_created_at_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}