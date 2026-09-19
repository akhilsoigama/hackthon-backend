import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRagDocumentsTable extends BaseSchema {
  protected tableName = 'rag_documents'

  public async up() {
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS vector')

    await this.db.rawQuery(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id serial PRIMARY KEY,
        source_type varchar(50) NOT NULL DEFAULT 'module',
        source_id integer,
        institute_id integer,
        title varchar(255) NOT NULL,
        content text NOT NULL,
        chunk_index integer NOT NULL,
        embedding vector(1536) NOT NULL,
        metadata jsonb,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_documents_source_idx ON ${this.tableName} (source_type, source_id)`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_documents_institute_idx ON ${this.tableName} (institute_id)`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx ON ${this.tableName} USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
    )
  }

  public async down() {
    await this.schema.dropTable(this.tableName)
  }
}