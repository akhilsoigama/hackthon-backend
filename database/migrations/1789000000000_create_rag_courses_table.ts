import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRagCoursesTable extends BaseSchema {
  protected tableName = 'rag_courses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title', 255).notNullable()
      table.string('category', 100).notNullable().index()
      table.string('sub_category', 100).nullable()
      table.text('description').notNullable()
      table.jsonb('tags').defaultTo('[]')
      table.string('video_type', 50).defaultTo('youtube')
      table.string('video_url', 1000).notNullable()
      table.jsonb('sub_modules').defaultTo('[]')
      table.integer('institute_id').unsigned().nullable().index()
      table.integer('created_by').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()).index()
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
