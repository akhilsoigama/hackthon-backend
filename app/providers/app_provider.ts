// app/providers/app_provider.ts
import EmailService from '#services/email_services'
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(EmailService, () => new EmailService())
  }
}