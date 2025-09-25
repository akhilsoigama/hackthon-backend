import AdminUser from '#models/admin_user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await AdminUser.createMany([
      {
        fullName: 'test test',
        email: 'test@test.com',
        password: '12345678',
        mobile: '12345678',
      },
    ])
  }
}
