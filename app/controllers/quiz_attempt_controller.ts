import QuizzesAttemptServices from '#services/quizzes_attempt_services'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
@inject()
export default class QuizAttemptController {
  constructor(protected quizAttemptServices: QuizzesAttemptServices) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.quizAttemptServices.findAll({ searchFor })
  }
  async store() {
    return this.quizAttemptServices.attemptQuiz()
  }
  async show() {
    return this.quizAttemptServices.findOne()
  }
}
