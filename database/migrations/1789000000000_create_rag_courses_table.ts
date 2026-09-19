import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRagCoursesTable extends BaseSchema {
  protected tableName = 'rag_courses'

  public async up() {
    await this.db.rawQuery(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id serial PRIMARY KEY,
        title varchar(255) NOT NULL,
        category varchar(100) NOT NULL,
        sub_category varchar(100),
        description text NOT NULL,
        tags jsonb DEFAULT '[]'::jsonb,
        video_type varchar(50) DEFAULT 'youtube',
        video_url varchar(1000) NOT NULL,
        sub_modules jsonb DEFAULT '[]'::jsonb,
        institute_id integer,
        created_by integer,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
      )`
    )

    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_courses_category_idx ON ${this.tableName} (category)`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_courses_institute_idx ON ${this.tableName} (institute_id)`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_courses_created_at_idx ON ${this.tableName} (created_at DESC)`
    )
  }

  public async down() {
    await this.schema.dropTable(this.tableName)
  }
}
