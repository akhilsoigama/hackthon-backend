import { inject } from '@adonisjs/core'
import InstituteServices from '#services/institute_services'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class InstitutesController {
  constructor(protected instituteServices: InstituteServices) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.instituteServices.findAll({ searchFor })
  }

  async store() {
    return this.instituteServices.create()
  }

  async show() {
    return this.instituteServices.findOne()
  }

  async update() {
    return this.instituteServices.updateone()
  }

  async destroy() {
    return this.instituteServices.deleteOne()
  }
}
