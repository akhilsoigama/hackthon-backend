import DepartmentServices from '#services/department_services';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DepartmentsController {
constructor(protected DepartmentServices: DepartmentServices) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.DepartmentServices.findAll({ searchFor })
  }

  async store() {
    return this.DepartmentServices.create()
  }

  async show() {
    return this.DepartmentServices.findOne()
  }

  async update() {
    return this.DepartmentServices.updateOne()
  }

  async destroy() {
    return this.DepartmentServices.deleteOne()
  }
}