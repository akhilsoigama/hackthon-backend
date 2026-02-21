import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { errorHandler } from '../helper/error_handler.js'
import messages from '#database/constants/messages'
import Quizzes from '#models/quizzes'
import Student from '#models/student'
import { DateTime } from 'luxon'
import QuizAttempt from '#models/quiz_attempt'
@inject()
export default class QuizzesAttemptServices {
  constructor(protected ctx: HttpContext) {}
  async attemptQuiz() {
    try {
      const requestData = this.ctx.request.all()

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
      }

      const trx = await db.transaction()
      try {
        const attempt = await quiz.related('attempts').create(attemptData, { client: trx })
        await trx.commit()

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
      const query = QuizAttempt.query()
        .whereNull('deleted_at')
        .preload('quiz', (quizQuery) => {
          quizQuery.select('id', 'quiz_title')
        })
        .preload('student', (studentQuery) => {
          studentQuery.select('id', 'student_name')
        })

      if (searchFor) {
        query.where((subQuery) => {
          subQuery
            .where('status', 'like', `%${searchFor}%`)
            .orWhere('score', 'like', `%${searchFor}%`)
        })
      }

      const attempts = await query

      if (attempts.length > 0) {
        return {
          status: true,
          message: messages.attempt_fetched_successfully,
          data: attempts,
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
      const attempt = await QuizAttempt.query()
        .where('id', attemptId)
        .whereNull('deleted_at')
        .preload('quiz', (quizQuery) => {
          quizQuery.select('id', 'quiz_title')
        })
        .preload('student', (studentQuery) => {
          studentQuery.select('id', 'student_name')
        })
        .first()
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
