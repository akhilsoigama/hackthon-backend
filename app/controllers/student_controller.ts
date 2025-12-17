import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import StudentServices from '#services/student_services'

@inject()
export default class StudentController {
  constructor(protected studentServices: StudentServices) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.studentServices.findAll({ searchFor })
  }

  async store() {
    return this.studentServices.create()
  }

  async show() {
    return this.studentServices.findOne()
  }

  async update() {
    return this.studentServices.updateOne()
  }

  async destroy() {
    return this.studentServices.deleteOne()
  }

  async getStudentsForInstitute() {
    return await this.studentServices.getStudentsForInstitute()
  }
}
