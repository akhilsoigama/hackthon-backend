import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('students', (table) => {
      table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      table.index(['institute_id'], 'students_institute_id_idx')
      table.index(['created_at'], 'students_created_at_idx')
      table.index(['is_active'], 'students_is_active_idx')
      table.index(['student_name'], 'students_student_name_idx')
      table.index(['student_email'], 'students_student_email_idx')
      table.index(['deleted_at'], 'students_deleted_at_idx')
    })

    this.schema.alterTable('assignments', (table) => {
      table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      table.index(['institute_id'], 'assignments_institute_id_idx')
      table.index(['faculty_id'], 'assignments_faculty_id_idx')
      table.index(['department_id'], 'assignments_department_id_idx')
      table.index(['created_at'], 'assignments_created_at_idx')
      table.index(['is_active'], 'assignments_is_active_idx')
      table.index(['assignment_title'], 'assignments_title_idx')
      table.index(['subject'], 'assignments_subject_idx')
      table.index(['deleted_at'], 'assignments_deleted_at_idx')
    })

    this.schema.alterTable('quiz_attempts', (table) => {
      table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      table.index(['quiz_id'], 'quiz_attempts_quiz_id_idx')
      table.index(['student_id'], 'quiz_attempts_student_id_idx')
      table.index(['institute_id'], 'quiz_attempts_institute_id_idx')
      table.index(['status'], 'quiz_attempts_status_idx')
      table.index(['created_at'], 'quiz_attempts_created_at_idx')
      table.index(['deleted_at'], 'quiz_attempts_deleted_at_idx')
    })
  }

  async down() {
    this.schema.alterTable('quiz_attempts', (table) => {
      table.dropIndex(['quiz_id'], 'quiz_attempts_quiz_id_idx')
      table.dropIndex(['student_id'], 'quiz_attempts_student_id_idx')
      table.dropIndex(['institute_id'], 'quiz_attempts_institute_id_idx')
      table.dropIndex(['status'], 'quiz_attempts_status_idx')
      table.dropIndex(['created_at'], 'quiz_attempts_created_at_idx')
      table.dropIndex(['deleted_at'], 'quiz_attempts_deleted_at_idx')
      table.dropColumn('created_by')
      table.dropColumn('updated_by')
    })

    this.schema.alterTable('assignments', (table) => {
      table.dropIndex(['institute_id'], 'assignments_institute_id_idx')
      table.dropIndex(['faculty_id'], 'assignments_faculty_id_idx')
      table.dropIndex(['department_id'], 'assignments_department_id_idx')
      table.dropIndex(['created_at'], 'assignments_created_at_idx')
      table.dropIndex(['is_active'], 'assignments_is_active_idx')
      table.dropIndex(['assignment_title'], 'assignments_title_idx')
      table.dropIndex(['subject'], 'assignments_subject_idx')
      table.dropIndex(['deleted_at'], 'assignments_deleted_at_idx')
      table.dropColumn('created_by')
      table.dropColumn('updated_by')
    })

    this.schema.alterTable('students', (table) => {
      table.dropIndex(['institute_id'], 'students_institute_id_idx')
      table.dropIndex(['created_at'], 'students_created_at_idx')
      table.dropIndex(['is_active'], 'students_is_active_idx')
      table.dropIndex(['student_name'], 'students_student_name_idx')
      table.dropIndex(['student_email'], 'students_student_email_idx')
      table.dropIndex(['deleted_at'], 'students_deleted_at_idx')
      table.dropColumn('created_by')
      table.dropColumn('updated_by')
    })
  }
}
