import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PermissionSeeder from './permission_seeder.js'
import RoleSeeder from './role_seeder.js'
import AdminUserSeeder from './admin_user_seeder.js'
import TestingDataSeeder from './testing_data_seeder.js'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  public async run() {
    const client = db.connection()

    await new RoleSeeder(client).run()
    await new PermissionSeeder(client).run()
    await new AdminUserSeeder(client).run()
    await new TestingDataSeeder(client).run()
  }
}