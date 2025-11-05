import { BaseSeeder } from '@adonisjs/lucid/seeders'
import AdminUser from '#models/admin_user'
import hash from '@adonisjs/core/services/hash'

export default class ResetAdminPasswordSeeder extends BaseSeeder {
  public async run() {
    const user = await AdminUser.query().where('email', 'super@admin.com').first()
    if (user) {
      user.password = await hash.make('12345678') // Uses bcrypt as per your config
      await user.save()
      console.log('✅ Password reset for super@admin.com')
    } else {
      console.log('⚠️ Admin user not found')
    }
  }
}