import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. assignment_uploads cleanup: Add 'grade' column and copy 'grad' data
    const hasGradeCol = await this.schema.hasColumn('assignment_uploads', 'grade')
    if (!hasGradeCol) {
      this.schema.alterTable('assignment_uploads', (table) => {
        table.string('grade', 10).nullable()
      })
    }

    this.schema.alterTable('assignment_uploads', (table) => {
      table.integer('faculty_id').unsigned().nullable().alter()
      table.integer('institute_id').unsigned().nullable().alter()
      table.integer('department_id').unsigned().nullable().alter()
      table.boolean('is_graded_by_faculty').nullable().alter()
      table.string('grad').nullable().alter()
    })

    // Populate grade from grad if any rows exist using Lucid Query Builder
    this.defer(async (db) => {
      try {
        await db
          .from('assignment_uploads')
          .whereNull('grade')
          .whereNotNull('grad')
          .update({
            grade: db.raw('grad'),
          })
      } catch { }
    })

    // 2. govt_events cleanup: Ensure deleted_at covers any soft-deletes using Lucid Query Builder
    this.defer(async (db) => {
      try {
        await db.from('govt_events').where('is_deleted', true).whereNull('deleted_at').update({
          deleted_at: this.now(),
        })
      } catch { }
    })

    // 3. admin_users cleanup: Relax meaningless institute/faculty references
    this.schema.alterTable('admin_users', (table) => {
      table.integer('institute_id').unsigned().nullable().alter()
      table.integer('faculty_id').unsigned().nullable().alter()
      table.boolean('is_admin').nullable().alter()
    })
  }

  async down() {
    // Reversible operations
    this.schema.alterTable('assignment_uploads', (table) => {
      table.dropColumn('grade')
    })
  }
}
