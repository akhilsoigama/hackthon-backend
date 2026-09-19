import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MaterialService from './material_service.js'

@inject()
export default class MaterialsController {
  constructor(protected materialService: MaterialService) {}

  async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.materialService.findAll({ searchFor })
  }

  async store() {
    return this.materialService.create()
  }

  async show() {
    return this.materialService.findOne()
  }

  async update() {
    return this.materialService.updateOne()
  }

  async destroy() {
    return this.materialService.deleteOne()
  }

  async sync() {
    return this.materialService.sync()
  }
}
