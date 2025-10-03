import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Permission from '#models/permission'

inject()
export default class PermissionsController {
  async getAllPermissions({ response }: HttpContext) {
    try {
      const permissions = await Permission.query().orderBy('createdAt', 'asc') // Order by ID in ascending order
      return response.ok({ success: true, data: permissions })
    } catch (error) {
      console.error('Error fetching permissions:', error)
      return response.internalServerError({
        success: false,
        message: 'Error fetching permissions',
        error,
      })
    }
  }
}
