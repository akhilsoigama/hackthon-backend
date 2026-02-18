import AssignmentService from '#services/assignment_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
@inject()
export default class AssignmentsController {
  constructor(protected assignmentService: AssignmentService) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.assignmentService.findAll({ searchFor })
  }
  async store() {
    return this.assignmentService.create()
  }

  async show() {
    return this.assignmentService.findOne()
  }

  async update() {
    return this.assignmentService.update()
  }

  async destroy() {
    return this.assignmentService.deleteOne()
  }
}