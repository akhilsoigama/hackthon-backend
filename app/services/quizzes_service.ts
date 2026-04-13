import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { errorHandler } from '../helper/error_handler.js'
import { createQuizzezValidator, updateQuizzezValidator } from '#validators/quizzes'
import Quizzes from '#models/quizzes'
import { DateTime } from 'luxon'
import messages from '#database/constants/messages'

type QuestionType = 'mcq' | 'true/false'

type QuizOptionPayload = {
  id?: number
  optionText: string
  isCorrect?: boolean
}

type QuizQuestionPayload = {
  id?: number
  questionText: string
  questionType: QuestionType
  marks: number
  options?: QuizOptionPayload[]
}

type CreateQuizPayload = {
  quizTitle: string
  quizDescription?: string
  quizBanner: string
  subject?: string
  std?: string
  dueDate?: string
  marks?: number
  attemptLimit?: number
  isActive?: boolean
  instituteId: number
  facultyId: number
  departmentId: number
  questions?: QuizQuestionPayload[]
}

type UpdateQuizPayload = {
  quizTitle?: string
  quizDescription?: string
  quizBanner?: string
  subject?: string
  std?: string
  dueDate?: string
  marks?: number
  attemptLimit?: number
  isActive?: boolean
  instituteId?: number
  facultyId?: number
  departmentId?: number
  questions?: QuizQuestionPayload[]
}

@inject()
export default class QuizzesService {
  constructor(protected ctx: HttpContext) {}

  private parseDueDate(dueDate?: string) {
    if (!dueDate) {
      return undefined
    }

    const parsedDueDate = DateTime.fromISO(dueDate)
    if (!parsedDueDate.isValid) {
      throw new Error('Invalid dueDate. Expected ISO format.')
    }

    return parsedDueDate
  }

  async create() {
    const trx = await db.transaction()

    try {
      const requestData = this.ctx.request.all()
      const validatedData = (await createQuizzezValidator.validate(
        requestData
      )) as CreateQuizPayload

      const existingQuiz = await Quizzes.query()
        .where('quiz_title', validatedData.quizTitle)
        .whereNull('deleted_at')
        .first()

      if (existingQuiz) {
        await trx.rollback()
        return {
          status: false,
          message: messages.quiz_already_exists,
          data: null,
        }
      }

      const quiz = await Quizzes.create(
        {
          quizTitle: validatedData.quizTitle,
          quizDescription: validatedData.quizDescription,
          quizBanner: validatedData.quizBanner,
          subject: validatedData.subject,
          std: validatedData.std,
          dueDate: this.parseDueDate(validatedData.dueDate),
          marks: validatedData.marks,
          attemptLimit: validatedData.attemptLimit,
          isActive: validatedData.isActive,
          instituteId: validatedData.instituteId,
          facultyId: validatedData.facultyId,
          departmentId: validatedData.departmentId,
        },
        { client: trx }
      )

      if (validatedData.questions && validatedData.questions.length > 0) {
        for (const q of validatedData.questions) {
          const createdQuestion = await quiz.related('questions').create(
            {
              questionText: q.questionText,
              questionType: q.questionType,
              marks: q.marks,
            },
            { client: trx }
          )

          if (q.options?.length) {
            await createdQuestion.related('options').createMany(
              q.options.map((option) => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect ?? false,
              })),
              { client: trx }
            )
          }
        }
      }

      await trx.commit()
      return {
        status: true,
        message: messages.quiz_created_successfully,
        data: quiz,
      }
    } catch (error) {
      await trx.rollback()
      return {
        status: false,
        message: messages.quiz_creation_failed,
        data: errorHandler(error),
      }
    }
  }
  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      let query = Quizzes.query()
        .select([
          'id',
          'quiz_title',
          'quiz_description',
          'quiz_banner',
          'subject',
          'std',
          'institute_id',
          'faculty_id',
          'department_id',
          'due_date',
          'marks',
          'attempt_limit',
          'is_active',
          'created_at',
          'updated_at',
        ])
        .preload('questions', (questionQuery) => {
          questionQuery.select(['id'])
        })
        .apply((scopes) => scopes.softDeletes())
      if (searchFor === 'create') {
        query = query.where('is_active', true)
      }
      const quizzes = await query
      if (quizzes && quizzes.length > 0) {
        return {
          status: true,
          message: messages.quiz_fetched_successfully,
          data: quizzes,
        }
      } else {
        return {
          status: false,
          message: messages.quiz_not_found,
          data: [],
        }
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async findOne() {
    try {
      const id = this.ctx.request.param('id')
      const quiz = await Quizzes.query()
        .where('id', id)
        .whereNull('deleted_at')
        .preload('department', (departmentQuery) => {
          departmentQuery.select(['id', 'departmentName'])
        })
        .preload('questions', (questionQuery) => {
          questionQuery.preload('options', (optionQuery) => {
            optionQuery.select(['id', 'optionText', 'isCorrect'])
          })
        })
        .preload('faculty', (facultyQuery) => {
          facultyQuery.select(['id', 'facultyName', 'facultyEmail'])
        })
        .preload('institute', (instituteQuery) => {
          instituteQuery.select(['id', 'instituteName'])
        })
        .first()
      if (quiz) {
        return {
          status: true,
          message: messages.quiz_fetched_successfully,
          data: quiz,
        }
      } else {
        return {
          status: false,
          message: messages.quiz_not_found,
          data: null,
        }
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
  async update() {
    const trx = await db.transaction()

    try {
      const id = this.ctx.request.param('id')
      const requestData = this.ctx.request.all()
      const validatedData = (await updateQuizzezValidator.validate(
        requestData
      )) as UpdateQuizPayload

      const existingQuiz = await Quizzes.query().where('id', id).whereNull('deleted_at').first()

      if (!existingQuiz) {
        await trx.rollback()
        return {
          status: false,
          message: messages.quiz_not_found,
          data: null,
        }
      }

      existingQuiz.useTransaction(trx)

      existingQuiz.merge({
        quizTitle: validatedData.quizTitle,
        quizDescription: validatedData.quizDescription,
        quizBanner: validatedData.quizBanner,
        subject: validatedData.subject,
        std: validatedData.std,
        dueDate: this.parseDueDate(validatedData.dueDate),
        marks: validatedData.marks,
        attemptLimit: validatedData.attemptLimit,
        isActive: validatedData.isActive,
        instituteId: validatedData.instituteId,
        facultyId: validatedData.facultyId,
        departmentId: validatedData.departmentId,
      })

      await existingQuiz.save()

      await existingQuiz.load('questions', (query) => {
        query.preload('options')
      })

      const existingQuestionsMap = new Map()
      existingQuiz.questions.forEach((q) => {
        existingQuestionsMap.set(q.id, q)
      })

      const incomingQuestionIds: number[] = []

      for (const q of validatedData.questions || []) {
        if (q.id && existingQuestionsMap.has(q.id)) {
          const existingQuestion = existingQuestionsMap.get(q.id)!
          incomingQuestionIds.push(existingQuestion.id)

          existingQuestion.useTransaction(trx)
          existingQuestion.merge({
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
          })
          await existingQuestion.save()

          const existingOptionsMap = new Map()
          existingQuestion.options.forEach((opt: any) => {
            existingOptionsMap.set(opt.id, opt)
          })

          const incomingOptionIds: number[] = []

          for (const opt of q.options || []) {
            if (opt.id && existingOptionsMap.has(opt.id)) {
              const existingOption = existingOptionsMap.get(opt.id)!
              incomingOptionIds.push(existingOption.id)

              existingOption.useTransaction(trx)
              existingOption.merge({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })
              await existingOption.save()
            } else {
              const newOption = await existingQuestion.related('options').create(
                {
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect ?? false,
                },
                { client: trx }
              )

              incomingOptionIds.push(newOption.id)
            }
          }

          for (const [optId, existingOpt] of existingOptionsMap) {
            if (!incomingOptionIds.includes(optId)) {
              existingOpt.useTransaction(trx)
              await existingOpt.delete()
            }
          }
        } else {
          const newQuestion = await existingQuiz.related('questions').create(
            {
              questionText: q.questionText,
              questionType: q.questionType,
              marks: q.marks,
            },
            { client: trx }
          )

          incomingQuestionIds.push(newQuestion.id)

          if (q.options?.length) {
            await newQuestion.related('options').createMany(
              q.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect ?? false,
              })),
              { client: trx }
            )
          }
        }
      }

      for (const [questionId, existingQuestion] of existingQuestionsMap) {
        if (!incomingQuestionIds.includes(questionId)) {
          existingQuestion.useTransaction(trx)
          await existingQuestion.delete()
        }
      }

      await trx.commit()

      return {
        status: true,
        message: messages.quiz_updated_successfully,
        data: existingQuiz,
      }
    } catch (error) {
      await trx.rollback()

      return {
        status: false,
        message: messages.quiz_update_failed,
        data: errorHandler(error),
      }
    }
  }

  async delete() {
    try {
      const id = this.ctx.request.param('id')
      const quiz = await Quizzes.query().where('id', id).whereNull('deleted_at').first()
      if (!quiz) {
        return {
          status: false,
          message: messages.quiz_not_found,
          data: null,
        }
      }
      await quiz.delete()
      return {
        status: true,
        message: messages.common_messages_record_deleted,
        data: null,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }
}
