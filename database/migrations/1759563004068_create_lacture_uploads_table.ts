import { LACTURE_UPLOAD } from "#database/constants/table_names"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class Lectures extends BaseSchema {
  protected tableName = LACTURE_UPLOAD

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title', 100).notNullable()
      table.string('description', 500)
      table.string('video_path').notNullable()
      table.string('thumbnail_path').notNullable()
      table.integer('faculty_id').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.foreign('faculty_id').references('id').inTable('faculties').onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
