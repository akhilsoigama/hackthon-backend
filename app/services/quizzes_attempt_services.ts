import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { errorHandler } from '../helper/error_handler.js'
import messages from '#database/constants/messages'
import Quizzes from '#models/quizzes'
import Student from '#models/student'
import { DateTime } from 'luxon'
import QuizAttemptRepository from '../repositories/quiz_attempt_repository.js'
import { parseListQuery } from '../helper/list_query.js'
import apiCacheService from './api_cache_service.js'
@inject()
export default class QuizzesAttemptServices {
  private readonly quizAttemptRepository = new QuizAttemptRepository()

  constructor(protected ctx: HttpContext) {}

  private async getAuthenticatedUser() {
    try {
      return await this.ctx.auth.authenticate()
    } catch {
      return null
    }
  }

  private invalidateQuizAttemptCache() {
    apiCacheService.invalidateByPrefix('quiz-attempts:list:')
    apiCacheService.invalidateByPrefix('quiz-attempts:one:')
  }

  async attemptQuiz() {
    try {
      const requestData = this.ctx.request.all()
      const authUser = await this.getAuthenticatedUser()

      const quizId = Number(requestData.quizId ?? requestData.quiz_id)
      const studentId = Number(requestData.studentId ?? requestData.student_id)
      const instituteId = requestData.instituteId ?? requestData.institute_id
      const score = Number(requestData.score ?? 0)
      const allowedStatuses = ['in_progress', 'submitted', 'completed'] as const
      const status = allowedStatuses.includes(requestData.status)
        ? requestData.status
        : 'in_progress'
      const attemptedAtInput = requestData.attemptedAt ?? requestData.attempted_at

      if (!quizId || Number.isNaN(quizId)) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'Quiz ID is required',
        })
      }

      if (!studentId || Number.isNaN(studentId)) {
        return this.ctx.response.status(400).send({
          status: false,
          message: 'Student ID is required',
        })
      }

      const quiz = await Quizzes.query().where('id', quizId).whereNull('deleted_at').first()
      if (!quiz) {
        return this.ctx.response.status(404).send({
          status: false,
          message: messages.quiz_not_found,
        })
      }

      const student = await Student.query().where('id', studentId).whereNull('deleted_at').first()
      if (!student) {
        return this.ctx.response.status(404).send({
          status: false,
          message: messages.student_not_found,
        })
      }

      const existingAttempt = await quiz
        .related('attempts')
        .query()
        .where('student_id', studentId)
        .whereNull('deleted_at')
        .first()

      if (existingAttempt) {
        return this.ctx.response
          .status(422)
          .send({ status: false, message: messages.quiz_already_attempted })
      }

      const parsedAttemptedAt = attemptedAtInput ? DateTime.fromISO(String(attemptedAtInput)) : null
      const normalizedAttemptedAt = parsedAttemptedAt?.isValid ? parsedAttemptedAt : DateTime.now()

      const attemptData = {
        studentId,
        instituteId: instituteId || student.instituteId,
        score: Number.isNaN(score) ? 0 : score,
        status,
        attemptedAt: normalizedAttemptedAt,
        createdBy: authUser?.id,
        updatedBy: authUser?.id,
      }

      const trx = await db.transaction()
      try {
        const attempt = await quiz.related('attempts').create(attemptData, { client: trx })
        await trx.commit()

        this.invalidateQuizAttemptCache()

        return {
          status: true,
          message: messages.quiz_attempt_success,
          data: attempt,
        }
      } catch (error) {
        await trx.rollback()
        throw error
      }
    } catch (error) {
      return {
        status: false,
        message: messages.quiz_attempt_failed,
        error: errorHandler(error),
      }
    }
  }
  async findAll({ searchFor }: { searchFor?: string }) {
    try {
      const authUser = await this.getAuthenticatedUser()
      const { page, limit, search, withDeleted, searchFor: searchForQuery } = parseListQuery(this.ctx)
      const effectiveSearch = search || searchFor || searchForQuery

      let instituteId: number | undefined
      let studentId: number | undefined

      if (authUser?.userType === 'institute') {
        instituteId = authUser.instituteId
      }

      if (authUser?.userType === 'student') {
        studentId = authUser.studentId || undefined
        instituteId = authUser.instituteId
      }

      const requestQuizId = Number(this.ctx.request.input('quizId'))
      const requestStudentId = Number(this.ctx.request.input('studentId'))
      const requestInstituteId = Number(this.ctx.request.input('instituteId'))

      const quizId = Number.isFinite(requestQuizId) && requestQuizId > 0 ? requestQuizId : undefined
      const filteredStudentId = studentId || (Number.isFinite(requestStudentId) && requestStudentId > 0 ? requestStudentId : undefined)
      const filteredInstituteId = instituteId || (Number.isFinite(requestInstituteId) && requestInstituteId > 0 ? requestInstituteId : undefined)

      const cacheKey = `quiz-attempts:list:${JSON.stringify({
        page,
        limit,
        effectiveSearch,
        withDeleted,
        quizId,
        studentId: filteredStudentId,
        instituteId: filteredInstituteId,
      })}`

      const paginated = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          return this.quizAttemptRepository.list(
            {
              quizId,
              studentId: filteredStudentId,
              instituteId: filteredInstituteId,
              search: effectiveSearch,
              withDeleted,
            },
            page,
            limit
          )
        },
        ['quiz-attempts']
      )

      const attempts = paginated.all()

      if (attempts.length > 0) {
        return {
          status: true,
          message: messages.attempt_fetched_successfully,
          data: attempts,
          meta: {
            total: paginated.total,
            perPage: paginated.perPage,
            currentPage: paginated.currentPage,
            lastPage: paginated.lastPage,
          },
        }
      } else {
        return {
          status: false,
          message: messages.attempt_not_found,
          data: [],
        }
      }
    } catch (error) {
      return {
        status: false,
        message: messages.attempt_fetch_failed,
        error: errorHandler(error),
      }
    }
  }

  async findOne() {
    try {
      const attemptId = this.ctx.params.id
      const authUser = await this.getAuthenticatedUser()
      const instituteId = authUser?.userType === 'institute' || authUser?.userType === 'student'
        ? authUser.instituteId
        : undefined
      const studentId = authUser?.userType === 'student' ? authUser.studentId || undefined : undefined

      const attempt = await apiCacheService.getOrSet(
        `quiz-attempts:one:${attemptId}:institute:${instituteId || 'all'}:student:${studentId || 'all'}`,
        30_000,
        async () => this.quizAttemptRepository.findById(Number(attemptId), instituteId, studentId),
        ['quiz-attempts']
      )

      if (attempt) {
        return {
          status: true,
          message: messages.attempt_fetched_successfully,
          data: attempt,
        }
      } else {
        return {
          status: false,
          message: messages.attempt_not_found,
          data: null,
        }
      }
    } catch (error) {
      return {
        status: false,
        message: messages.attempt_fetch_failed,
        error: errorHandler(error),
      }
    }
  }
}
