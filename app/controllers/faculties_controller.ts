import FacultyServices from '#services/faculties_services'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class FacultiesController {
  constructor(protected FacultyServices: FacultyServices) {}

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
   async getFacultiesForInstitute() {
    return await this.FacultyServices.getFacultiesForInstitute()
  }

}
