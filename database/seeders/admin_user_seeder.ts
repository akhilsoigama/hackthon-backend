import AdminUser, { UserType } from '#models/admin_user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  public async run() {
    const users = [
      {
        fullName: 'Super Admin',
        email: 'super@admin.com',
        mobile: '12345678',
        userType: 'super_admin' as UserType,
        isAdmin: true,
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true,
        password: '12345678',
      },
    ]

    for (const user of users) {
      const exists = await AdminUser.query().where('email', user.email).first()
      if (!exists) {
        await AdminUser.create(user) 
        console.log(`Created new admin user: ${user.email}`)
      } else {
        console.log(`User ${user.email} already exists, skipping seeder.`)
      }
    }
  }
}