import type { HttpContext } from '@adonisjs/core/http'
import StudentQueryService from '#services/student_query_service'
import StudentProgressService from '#services/student_progress_service'

export default class StudentQueriesController {
  async index(ctx: HttpContext) {
    return new StudentQueryService(ctx).list()
  }

  async store(ctx: HttpContext) {
    return new StudentQueryService(ctx).create()
  }

  async show(ctx: HttpContext) {
    return new StudentQueryService(ctx).show()
  }

  async update(ctx: HttpContext) {
    return new StudentQueryService(ctx).update()
  }

  async destroy(ctx: HttpContext) {
    return new StudentQueryService(ctx).delete()
  }

  async progressReport(ctx: HttpContext) {
    return new StudentProgressService(ctx).generateProgressReport()
  }
}

