// app/controllers/permissions_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Permission from '#models/permission'

export default class PermissionsController {
  /**
   * GET /permissions - Get all permissions (for resource route)
   */
  async index({ response }: HttpContext) {
    try {
      const permissions = await Permission.query().orderBy('created_at', 'asc') 
      return response.json({ 
        success: true, 
        data: permissions 
      })
    } catch (error) {
      console.error('Error fetching permissions:', error)
      return response.internalServerError({
        success: false,
        message: 'Error fetching permissions',
        error: error.message,
      })
    }
  }

  /**
   * GET /permissions/:id - Get single permission
   */
  async show({ params, response }: HttpContext) {
    try {
      const permission = await Permission.findOrFail(params.id)
      return response.json({ 
        success: true, 
        data: permission 
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Permission not found',
      })
    }
  }

  /**
   * Keep your existing method if needed for other routes
   */
  async getAllPermissions({ response }: HttpContext) {
    // Same as index method, or you can remove this if index is used
    return this.index({ response } as HttpContext)
  }
}