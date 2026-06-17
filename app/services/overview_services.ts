// app/services/overview_services.ts
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

import Institute from '#models/institute'
import Faculty from '#models/faculty'
import Student from '#models/student'

@inject()
export default class OverviewServices {
  constructor(protected ctx: HttpContext) {}

  private async getAuthUser() {
    try {
      return await this.ctx.auth.authenticate()
    } catch {
      return null
    }
  }

  private getUserId(authUser: unknown, key: 'instituteId' | 'facultyId' | 'studentId') {
    if (!authUser || typeof authUser !== 'object') {
      return undefined
    }

    const value = Number((authUser as Record<string, unknown>)[key])

    return Number.isFinite(value) && value > 0 ? value : undefined
  }

  private getCurrentPeriodName(): string {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  private getPreviousPeriodName(): string {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  private calculateGrowthPercent(current: number, previous: number): number {
    if (!previous || previous === 0) return 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }

  /**
   * Institute Dashboard with Growth - Fixed soft delete handling
   */
  async getInstituteOverviewWithGrowth() {
    const authUser = await this.getAuthUser()

    const requestedInstituteId = Number(
      this.ctx.params.instituteId ??
        this.ctx.request.input('instituteId') ??
        this.ctx.request.input('institute_id') ??
        this.ctx.request.qs().instituteId ??
        this.ctx.request.qs().institute_id
    )

    const instituteId = this.getUserId(authUser, 'instituteId') ?? requestedInstituteId

    if (!instituteId || Number.isNaN(instituteId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Institute ID is required',
      })
    }

    const institute = await Institute.find(instituteId)

    if (!institute) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Institute not found',
      })
    }

    // Fixed: Added deleted_at IS NULL filter
    const result = await db.rawQuery(
      `
      WITH current_data AS (
        SELECT
          COUNT(*) FILTER (WHERE table_name = 'students') AS total_students,
          COUNT(*) FILTER (WHERE table_name = 'faculties') AS total_faculties,
          COUNT(*) FILTER (WHERE table_name = 'departments') AS total_departments,
          COUNT(*) FILTER (WHERE table_name = 'institute_events') AS total_events
        FROM (
          SELECT 'students' AS table_name, created_at 
          FROM students 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          
          UNION ALL
          
          SELECT 'faculties' AS table_name, created_at 
          FROM faculties 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          
          UNION ALL
          
          SELECT 'departments' AS table_name, created_at 
          FROM departments 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          
          UNION ALL
          
          SELECT 'institute_events' AS table_name, created_at 
          FROM institute_events 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
        ) all_records
      ),
      previous_data AS (
        SELECT
          COUNT(*) FILTER (WHERE table_name = 'students') AS prev_students,
          COUNT(*) FILTER (WHERE table_name = 'faculties') AS prev_faculties,
          COUNT(*) FILTER (WHERE table_name = 'departments') AS prev_departments,
          COUNT(*) FILTER (WHERE table_name = 'institute_events') AS prev_events
        FROM (
          SELECT 'students' AS table_name, created_at 
          FROM students 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          AND created_at < DATE_TRUNC('month', NOW())
          
          UNION ALL
          
          SELECT 'faculties' AS table_name, created_at 
          FROM faculties 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          AND created_at < DATE_TRUNC('month', NOW())
          
          UNION ALL
          
          SELECT 'departments' AS table_name, created_at 
          FROM departments 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          AND created_at < DATE_TRUNC('month', NOW())
          
          UNION ALL
          
          SELECT 'institute_events' AS table_name, created_at 
          FROM institute_events 
          WHERE institute_id = :instituteId 
          AND deleted_at IS NULL
          AND created_at < DATE_TRUNC('month', NOW())
        ) all_records
      )
      SELECT 
        (SELECT total_students FROM current_data) AS students,
        (SELECT total_faculties FROM current_data) AS faculties,
        (SELECT total_departments FROM current_data) AS departments,
        (SELECT total_events FROM current_data) AS events,
        (SELECT prev_students FROM previous_data) AS prev_students,
        (SELECT prev_faculties FROM previous_data) AS prev_faculties,
        (SELECT prev_departments FROM previous_data) AS prev_departments,
        (SELECT prev_events FROM previous_data) AS prev_events
      `,
      { instituteId }
    )

    const data = result.rows[0]

    const currentStudents = Number(data?.students) || 0
    const currentFaculties = Number(data?.faculties) || 0
    const currentDepartments = Number(data?.departments) || 0
    const currentEvents = Number(data?.events) || 0
    const previousStudents = Number(data?.prev_students) || 0
    const previousFaculties = Number(data?.prev_faculties) || 0
    const previousDepartments = Number(data?.prev_departments) || 0
    const previousEvents = Number(data?.prev_events) || 0

    return {
      status: true,
      message: 'Institute overview with growth fetched successfully',
      data: {
        current: {
          period: this.getCurrentPeriodName(),
          totalStudents: currentStudents,
          totalFaculties: currentFaculties,
          totalDepartments: currentDepartments,
          totalEvents: currentEvents,
        },
        previous: {
          period: this.getPreviousPeriodName(),
          totalStudents: previousStudents,
          totalFaculties: previousFaculties,
          totalDepartments: previousDepartments,
          totalEvents: previousEvents,
        },
        growth: {
          students: this.calculateGrowthPercent(currentStudents, previousStudents),
          faculties: this.calculateGrowthPercent(currentFaculties, previousFaculties),
          departments: this.calculateGrowthPercent(currentDepartments, previousDepartments),
          events: this.calculateGrowthPercent(currentEvents, previousEvents),
        },
        periods: {
          current: this.getCurrentPeriodName(),
          previous: this.getPreviousPeriodName(),
        },
      },
    }
  }

  /**
   * Faculty Dashboard with Growth - Fixed soft delete handling
   */
  async getFacultyOverviewWithGrowth() {
    const authUser = await this.getAuthUser()

    const requestedFacultyId = Number(
      this.ctx.params.facultyId ??
        this.ctx.request.input('facultyId') ??
        this.ctx.request.input('faculty_id') ??
        this.ctx.request.qs().facultyId ??
        this.ctx.request.qs().faculty_id
    )

    const facultyId = this.getUserId(authUser, 'facultyId') ?? requestedFacultyId

    if (!facultyId || Number.isNaN(facultyId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Faculty ID is required',
      })
    }

    const faculty = await Faculty.find(facultyId)

    if (!faculty) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Faculty not found',
      })
    }

    // Fixed: Added deleted_at IS NULL filter for all tables
    const result = await db.rawQuery(
      `
      SELECT
        COUNT(*) FILTER (WHERE type = 'assignments') AS assignments,
        COUNT(*) FILTER (WHERE type = 'quizzes') AS quizzes,
        COUNT(*) FILTER (WHERE type = 'leaves') AS leaves,
        COUNT(*) FILTER (WHERE type = 'lectures') AS lectures,
        COUNT(*) FILTER (WHERE type = 'assignments' AND created_at < DATE_TRUNC('month', NOW())) AS prev_assignments,
        COUNT(*) FILTER (WHERE type = 'quizzes' AND created_at < DATE_TRUNC('month', NOW())) AS prev_quizzes,
        COUNT(*) FILTER (WHERE type = 'leaves' AND created_at < DATE_TRUNC('month', NOW())) AS prev_leaves,
        COUNT(*) FILTER (WHERE type = 'lectures' AND created_at < DATE_TRUNC('month', NOW())) AS prev_lectures
      FROM (
        SELECT 'assignments' AS type, created_at 
        FROM assignments 
        WHERE faculty_id = :facultyId 
        AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 'quizzes' AS type, created_at 
        FROM quizzes 
        WHERE faculty_id = :facultyId 
        AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 'leaves' AS type, created_at 
        FROM faculty_leaves 
        WHERE faculty_id = :facultyId 
        AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 'lectures' AS type, created_at 
        FROM lectures 
        WHERE faculty_id = :facultyId 
        AND deleted_at IS NULL
      ) all_activities
      `,
      { facultyId }
    )

    const data = result.rows[0]

    const currentAssignments = Number(data?.assignments) || 0
    const currentQuizzes = Number(data?.quizzes) || 0
    const currentLeaves = Number(data?.leaves) || 0
    const currentLectures = Number(data?.lectures) || 0

    const previousAssignments = Number(data?.prev_assignments) || 0
    const previousQuizzes = Number(data?.prev_quizzes) || 0
    const previousLeaves = Number(data?.prev_leaves) || 0
    const previousLectures = Number(data?.prev_lectures) || 0

    return {
      status: true,
      message: 'Faculty overview with growth fetched successfully',
      data: {
        current: {
          period: this.getCurrentPeriodName(),
          totalAssignments: currentAssignments,
          totalQuizzes: currentQuizzes,
          totalLeaves: currentLeaves,
          totalLectures: currentLectures,
        },
        previous: {
          period: this.getPreviousPeriodName(),
          totalAssignments: previousAssignments,
          totalQuizzes: previousQuizzes,
          totalLeaves: previousLeaves,
          totalLectures: previousLectures,
        },
        growth: {
          assignments: this.calculateGrowthPercent(currentAssignments, previousAssignments),
          quizzes: this.calculateGrowthPercent(currentQuizzes, previousQuizzes),
          leaves: this.calculateGrowthPercent(currentLeaves, previousLeaves),
          lectures: this.calculateGrowthPercent(currentLectures, previousLectures),
        },
        periods: {
          current: this.getCurrentPeriodName(),
          previous: this.getPreviousPeriodName(),
        },
      },
    }
  }

  /**
   * Student Dashboard with Growth - Fixed soft delete handling
   */
  async getStudentOverviewWithGrowth() {
    const authUser = await this.getAuthUser()

    const requestedStudentId = Number(
      this.ctx.params.studentId ??
        this.ctx.request.input('studentId') ??
        this.ctx.request.input('student_id') ??
        this.ctx.request.qs().studentId ??
        this.ctx.request.qs().student_id
    )

    const studentId = this.getUserId(authUser, 'studentId') ?? requestedStudentId

    if (!studentId || Number.isNaN(studentId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Student ID is required',
      })
    }

    const student = await Student.find(studentId)

    if (!student) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Student not found',
      })
    }

    // Fixed: Added deleted_at IS NULL filter
    const result = await db.rawQuery(
      `
      SELECT
        COUNT(*) FILTER (WHERE type = 'submissions') AS assignments_submitted,
        COUNT(*) FILTER (WHERE type = 'attempts') AS quiz_attempts,
        COUNT(*) FILTER (WHERE type = 'submissions' AND created_at < DATE_TRUNC('month', NOW())) AS prev_submissions,
        COUNT(*) FILTER (WHERE type = 'attempts' AND created_at < DATE_TRUNC('month', NOW())) AS prev_attempts
      FROM (
        SELECT 'submissions' AS type, created_at 
        FROM assignment_uploads 
        WHERE student_id = :studentId 
        AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 'attempts' AS type, created_at 
        FROM quiz_attempts 
        WHERE student_id = :studentId 
        AND deleted_at IS NULL
      ) all_activities
      `,
      { studentId }
    )

    const data = result.rows[0]

    const currentAssignmentsSubmitted = Number(data?.assignments_submitted) || 0
    const currentQuizAttempts = Number(data?.quiz_attempts) || 0

    const previousAssignmentsSubmitted = Number(data?.prev_submissions) || 0
    const previousQuizAttempts = Number(data?.prev_attempts) || 0

    return {
      status: true,
      message: 'Student overview with growth fetched successfully',
      data: {
        current: {
          period: this.getCurrentPeriodName(),
          totalAssignmentsSubmitted: currentAssignmentsSubmitted,
          totalQuizAttempts: currentQuizAttempts,
        },
        previous: {
          period: this.getPreviousPeriodName(),
          totalAssignmentsSubmitted: previousAssignmentsSubmitted,
          totalQuizAttempts: previousQuizAttempts,
        },
        growth: {
          assignmentsSubmitted: this.calculateGrowthPercent(currentAssignmentsSubmitted, previousAssignmentsSubmitted),
          quizAttempts: this.calculateGrowthPercent(currentQuizAttempts, previousQuizAttempts),
        },
        periods: {
          current: this.getCurrentPeriodName(),
          previous: this.getPreviousPeriodName(),
        },
      },
    }
  }

  /**
   * Legacy methods without growth - Fixed soft delete handling
   */
  async getInstituteOverview() {
    const authUser = await this.getAuthUser()

    const requestedInstituteId = Number(
      this.ctx.params.instituteId ??
        this.ctx.request.input('instituteId') ??
        this.ctx.request.input('institute_id') ??
        this.ctx.request.qs().instituteId ??
        this.ctx.request.qs().institute_id
    )

    const instituteId = this.getUserId(authUser, 'instituteId') ?? requestedInstituteId

    if (!instituteId || Number.isNaN(instituteId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Institute ID is required',
      })
    }

    const [institute, result] = await Promise.all([
      Institute.find(instituteId),
      db.rawQuery(
        `
        SELECT
          (SELECT COUNT(*) FROM students WHERE institute_id = :instituteId AND deleted_at IS NULL) AS students,
          (SELECT COUNT(*) FROM faculties WHERE institute_id = :instituteId AND deleted_at IS NULL) AS faculties,
          (SELECT COUNT(*) FROM departments WHERE institute_id = :instituteId AND deleted_at IS NULL) AS departments,
          (SELECT COUNT(*) FROM institute_events WHERE institute_id = :instituteId AND deleted_at IS NULL) AS events
        `,
        { instituteId }
      )
    ])

    if (!institute) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Institute not found',
      })
    }

    const overview = result.rows[0]

    return {
      status: true,
      message: 'Institute overview fetched successfully',
      data: {
        institute: {
          id: institute.id,
          instituteName: institute.instituteName,
        },
        totalStudents: Number(overview.students),
        totalFaculties: Number(overview.faculties),
        totalDepartments: Number(overview.departments),
        totalEvents: Number(overview.events),
      },
    }
  }

  async getFacultyOverview() {
    const authUser = await this.getAuthUser()

    const requestedFacultyId = Number(
      this.ctx.params.facultyId ??
        this.ctx.request.input('facultyId') ??
        this.ctx.request.input('faculty_id') ??
        this.ctx.request.qs().facultyId ??
        this.ctx.request.qs().faculty_id
    )

    const facultyId = this.getUserId(authUser, 'facultyId') ?? requestedFacultyId

    if (!facultyId || Number.isNaN(facultyId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Faculty ID is required',
      })
    }

    const [faculty, result] = await Promise.all([
      Faculty.find(facultyId),
      db.rawQuery(
        `
        SELECT
          (SELECT COUNT(*) FROM assignments WHERE faculty_id = :facultyId AND deleted_at IS NULL) AS assignments,
          (SELECT COUNT(*) FROM quizzes WHERE faculty_id = :facultyId AND deleted_at IS NULL) AS quizzes,
          (SELECT COUNT(*) FROM faculty_leaves WHERE faculty_id = :facultyId AND deleted_at IS NULL) AS leaves,
          (SELECT COUNT(*) FROM lectures WHERE faculty_id = :facultyId AND deleted_at IS NULL) AS lectures
        `,
        { facultyId }
      )
    ])

    if (!faculty) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Faculty not found',
      })
    }

    const overview = result.rows[0]

    return {
      status: true,
      message: 'Faculty overview fetched successfully',
      data: {
        faculty: {
          id: faculty.id,
          facultyName: faculty.facultyName,
        },
        totalAssignments: Number(overview.assignments),
        totalQuizzes: Number(overview.quizzes),
        totalLeaves: Number(overview.leaves),
        totalLectures: Number(overview.lectures),
      },
    }
  }

  async getStudentOverview() {
    const authUser = await this.getAuthUser()

    const requestedStudentId = Number(
      this.ctx.params.studentId ??
        this.ctx.request.input('studentId') ??
        this.ctx.request.input('student_id') ??
        this.ctx.request.qs().studentId ??
        this.ctx.request.qs().student_id
    )

    const studentId = this.getUserId(authUser, 'studentId') ?? requestedStudentId

    if (!studentId || Number.isNaN(studentId)) {
      return this.ctx.response.status(400).send({
        status: false,
        message: 'Student ID is required',
      })
    }

    const [student, result] = await Promise.all([
      Student.find(studentId),
      db.rawQuery(
        `
        SELECT
          (SELECT COUNT(*) FROM assignment_uploads WHERE student_id = :studentId AND deleted_at IS NULL) AS assignments_submitted,
          (SELECT COUNT(*) FROM quiz_attempts WHERE student_id = :studentId AND deleted_at IS NULL) AS quiz_attempts
        `,
        { studentId }
      )
    ])

    if (!student) {
      return this.ctx.response.status(404).send({
        status: false,
        message: 'Student not found',
      })
    }

    const overview = result.rows[0]

    return {
      status: true,
      message: 'Student overview fetched successfully',
      data: {
        student: {
          id: student.id,
          studentName: student.studentName,
        },
        totalAssignmentsSubmitted: Number(overview.assignments_submitted),
        totalQuizAttempts: Number(overview.quiz_attempts),
      },
    }
  }

  /**
   * Main Overview Method
   */
  async getOverview() {
  const authUser = await this.getAuthUser()

  if (!authUser) {
    return this.ctx.response.status(401).send({
      status: false,
      message: 'Unauthorized',
    })
  }

  const includeGrowth = this.ctx.request.qs().includeGrowth === 'true'
  const userType = (authUser as any).userType as string

  switch (userType?.toLowerCase()) {
    case 'institute':
      return includeGrowth
        ? this.getInstituteOverviewWithGrowth()
        : this.getInstituteOverview()

    case 'faculty':
      return includeGrowth
        ? this.getFacultyOverviewWithGrowth()
        : this.getFacultyOverview()

    case 'student':
      return includeGrowth
        ? this.getStudentOverviewWithGrowth()
        : this.getStudentOverview()

    default:
      return this.ctx.response.status(403).send({
        status: false,
        message: 'Invalid user role',
      })
  }
}
}