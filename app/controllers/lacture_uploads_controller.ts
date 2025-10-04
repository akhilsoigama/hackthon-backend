import LectureUploadServices from '#services/lacuture_upload'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class LectureUploadsController {
  constructor(protected lectureUploadServices: LectureUploadServices) {}

  // GET /lectures
  async index(ctx: HttpContext) {
    return this.lectureUploadServices.findAll(ctx)
  }

  // POST /lectures
  async store(ctx: HttpContext) {
    return this.lectureUploadServices.create(ctx)
  }

  // GET /lectures/:id
  async show(ctx: HttpContext) {
    return this.lectureUploadServices.findOne(ctx)
  }

  // PUT /lectures/:id
  async update(ctx: HttpContext) {
    return this.lectureUploadServices.updateOne(ctx)
  }

  // DELETE /lectures/:id
  async destroy(ctx: HttpContext) {
    return this.lectureUploadServices.deleteOne(ctx)
  }
}
