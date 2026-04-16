import AssignmentUploadService from '#services/assignment_upload_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
@inject()
export default class AssignmentUploadsController {
    constructor(protected assignmentUploadService: AssignmentUploadService) {}

     async index({ request }: HttpContext) {
    const searchFor = request.input('searchFor')
    return this.assignmentUploadService.findAll({ searchFor })
  }
  async store() {
    return this.assignmentUploadService.create()
  }

  async show() {
    return this.assignmentUploadService.findOne()
  }

  async update() {
    return this.assignmentUploadService.update()
  }

  async destroy() {
    return this.assignmentUploadService.deleteOne()
  }

}

