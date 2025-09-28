import AdminUser from '#models/admin_user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  public async run() {
    const users = [
      {
        fullName: 'test test',
        email: 'test@test.com',
        password: '12345678',
        mobile: '12345678',
      },
    ]

    for (const user of users) {
      const exists = await AdminUser.query().where('email', user.email).first()
      if (!exists) {
        await AdminUser.create(user)
      }
    }
  }
}
