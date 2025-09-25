import InstituteServices from '#services/institute_services'
import type { HttpContext } from '@adonisjs/core/http'

export default class InstitutesController {
    constructor(protected InstituteServices: InstituteServices) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.InstituteServices.findAll({ searchFor })
  }

  async store() {
    return this.InstituteServices.create()
  }

  async show() {
    return this.InstituteServices.findOne()
  }

  async update() {
    return this.InstituteServices.updateone()
  }

  async destroy() {
    return this.InstituteServices.deleteOne()
  }
}