import { permissions } from '#database/constants/permission'
import Permission from '#models/permission'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Permission.updateOrCreateMany('permissionKey', permissions)
  }
}
