// app/controllers/ping_controller.ts
import { HttpContext } from '@adonisjs/core/http'

export default class PingController {
  public async handle({ response }: HttpContext) {
    return response.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  }
}
