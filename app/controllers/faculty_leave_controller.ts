import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import FacultyLeaveService from '#services/faculty_leave_service'

@inject()
export default class FacultyLeaveController {
  constructor(protected facultyLeaveService: FacultyLeaveService) {}

  async index() {
    return this.facultyLeaveService.list()
  }

  async store() {
    return this.facultyLeaveService.create()
  }

  async update() {
    return this.facultyLeaveService.update()
  }

  async destroy() {
    return this.facultyLeaveService.delete()
  }

  async approve({ request }: HttpContext) {
    return this.facultyLeaveService.review('approved', request.input('instituteRemark'))
  }

  async reject({ request }: HttpContext) {
    return this.facultyLeaveService.review('rejected', request.input('instituteRemark'))
  }
}

