// app/controllers/departments_controller.ts
import DepartmentServices from '#services/department_services'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
@inject()

export default class DepartmentsController {
  constructor(protected FacultyServices: DepartmentServices) {}
  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.FacultyServices.findAll({ searchFor })
  }

  async store() {
    return this.FacultyServices.create()
  }

  async show() {
    return this.FacultyServices.findOne()
  }

  async update() {
    return this.FacultyServices.updateOne()
  }

  async destroy() {
    return this.FacultyServices.deleteOne()
  }
}