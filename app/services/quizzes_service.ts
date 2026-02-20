import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { errorHandler } from '../helper/error_handler.js'
import { createQuizzezValidator, updateQuizzezValidator } from '#validators/quizzes'
import Quizzes from '#models/quizzes'
import { DateTime } from 'luxon'
import messages from '#database/constants/messages'

@inject()
export default class QuizzesService {
  constructor(protected ctx: HttpContext) {}
  async create() {
    const trx = await db.transaction()
    try {
      const requestData = this.ctx.request.all()
      const existingQuiz = await Quizzes.query()
        .where('quiz_title', requestData.quizTitle)
        .whereNull('deleted_at')
        .first()
      if (existingQuiz) {
        return this.ctx.response.status(422).send({
          status: false,
          message: messages.quiz_already_exists,
        })
      }
      const validatedData = await createQuizzezValidator.validate(requestData)
      const quizData = {
        ...validatedData,
        dueDate: validatedData.dueDate ? DateTime.fromISO(validatedData.dueDate) : undefined,
      }
      const quiz = await Quizzes.create({ ...quizData }, { client: trx })

      if (validatedData.questions && validatedData.questions.length > 0) {
        for (const q of validatedData.questions) {
          const { options, ...questionData } = q

          const createdQuestion = await quiz
            .related('questions')
            .create(questionData, { client: trx })

          if (options?.length) {
            await createdQuestion.related('options').createMany(options, {
              client: trx,
            })
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
        error: errorHandler(error),
      }
    }
  }
  async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      let query = Quizzes.query()
        .preload('department')
        .preload('questions', (questionQuery) => {
          questionQuery.preload('options', (optionQuery) => {
            optionQuery.select(['id', 'optionText'])
          })
        })
        .preload('faculty')
        .preload('institute')
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
        .preload('department')
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

      const existingQuiz = await Quizzes.find(id)

      if (!existingQuiz || existingQuiz.deletedAt) {
        await trx.rollback()
        return {
          status: false,
          message: messages.quiz_not_found,
          data: null,
        }
      }

      const validatedData = await updateQuizzezValidator.validate(requestData)

      // Attach transaction
      existingQuiz.useTransaction(trx)

      // Update quiz fields
      existingQuiz.merge({
        ...validatedData,
        dueDate: validatedData.dueDate ? DateTime.fromISO(validatedData.dueDate) : undefined,
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
        // CASE 1: Update existing question
        if (q.id && existingQuestionsMap.has(q.id)) {
          const existingQuestion = existingQuestionsMap.get(q.id)!
          incomingQuestionIds.push(existingQuestion.id)

          existingQuestion.useTransaction(trx)
          existingQuestion.merge({
            questionText: q.questionText,
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
              // Create new option
              const newOption = await existingQuestion.related('options').create(
                {
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                },
                { client: trx }
              )

              incomingOptionIds.push(newOption.id)
            }
          }

          // Delete removed options
          for (const [optId, existingOpt] of existingOptionsMap) {
            if (!incomingOptionIds.includes(optId)) {
              existingOpt.useTransaction(trx)
              await existingOpt.delete()
            }
          }
        }

        // CASE 2: Create new question
        else {
          const newQuestion = await existingQuiz.related('questions').create(
            {
              questionText: q.questionText,
              marks: q.marks,
            },
            { client: trx }
          )

          incomingQuestionIds.push(newQuestion.id)

          // Create options for new question
          if (q.options?.length) {
            await newQuestion.related('options').createMany(
              q.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
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
        error: errorHandler(error),
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
