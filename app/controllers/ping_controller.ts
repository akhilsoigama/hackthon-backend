// app/controllers/ping_controller.ts
import { HttpContext } from '@adonisjs/core/http'

export default class PingController {
  async ping({ response }: HttpContext) {
    return response.json({ status: true, message: 'alive' })
  }
}
