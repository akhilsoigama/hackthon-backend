import QuizzesService from '#services/quizzes_service'
import { inject } from '@adonisjs/core'

import type { HttpContext } from '@adonisjs/core/http'
@inject()
export default class QuizzesControllersController {
  constructor(protected quizzesService: QuizzesService) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.quizzesService.findAll({ searchFor })
  }

  async store() {
    return this.quizzesService.create()
  }

  async show() {
    return this.quizzesService.findOne()
  }

  async update() {
    return this.quizzesService.update()
  }

  async destroy() {
    return this.quizzesService.delete()
  }
}
