// app/controllers/lacture_uploads_controller.ts
import LectureUploadServices from '#services/lacuture_upload_services'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class LectureUploadsController {
  constructor(private lectureUploadServices: LectureUploadServices) {}

  async store(ctx: HttpContext) {
    return this.lectureUploadServices.create(ctx)
  }

  async index(ctx: HttpContext) {
    return this.lectureUploadServices.findAll(ctx)
  }

  async show(ctx: HttpContext) {
    return this.lectureUploadServices.findOne(ctx)
  }

  async update(ctx: HttpContext) {
    return this.lectureUploadServices.updateOne(ctx)
  }

  async destroy(ctx: HttpContext) {
    return this.lectureUploadServices.deleteOne(ctx)
  }
}