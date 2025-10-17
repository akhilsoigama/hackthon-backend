import AdminUser, { UserType } from '#models/admin_user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  public async run() {
    const users: {
      fullName: string
      email: string
      password: string
      mobile: string
      userType: UserType
      isAdmin: boolean
      isActive: boolean
      isEmailVerified: boolean
      isMobileVerified: boolean
    }[] = [
      {
        fullName: 'Super Admin',
        email: 'super@admin.com',
        password: '12345678',
        mobile: '12345678',
        userType: 'super_admin',
        isAdmin: true,
        isActive: true,
        isEmailVerified: true,
        isMobileVerified: true,
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