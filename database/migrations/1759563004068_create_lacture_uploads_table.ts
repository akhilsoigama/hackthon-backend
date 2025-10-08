import { LACTURE_UPLOAD } from "#database/constants/table_names"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class Lectures extends BaseSchema {
  protected tableName = LACTURE_UPLOAD

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      table.string('title', 150).notNullable()
      table.text('description').nullable()

      table.enum('content_type', ['video', 'pdf', 'audio', 'text', 'image']).notNullable()

      table.string('content_url').nullable()

      table.text('text_content').nullable()

      table.string('thumbnail_url').nullable()
      table.integer('duration_in_seconds').nullable()

      table.string('subject').nullable()

      table.integer('faculty_id').unsigned().notNullable()
      table.string('std').nullable()
      table
        .foreign('faculty_id')
        .references('id')
        .inTable('faculties')
        .onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
