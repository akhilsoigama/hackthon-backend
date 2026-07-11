import ContactService from '#services/contact_us_service'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ContactController {
  constructor(private contactService: ContactService) {}

  async store(ctx: HttpContext) {
    return this.contactService.store(ctx)
  }
}