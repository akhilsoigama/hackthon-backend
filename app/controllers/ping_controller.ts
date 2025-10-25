// app/controllers/ping_controller.ts
import { HttpContext } from '@adonisjs/core/http'

export default class PingController {
  public async handle({ response }: HttpContext) {
    return response.json({ status: true, message: 'alive' })
  }
}
