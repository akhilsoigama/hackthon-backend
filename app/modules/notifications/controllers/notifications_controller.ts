// app/modules/notifications/controllers/notifications_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { ApiResponse } from '#shared/response/ApiResponse'
import NotificationsService from '../services/notifications_service.js'
import {
  subscribePushValidator,
  unsubscribePushValidator,
} from '../validators/notification_validator.js'

const notificationService = new NotificationsService()

export default class NotificationsController {
  /**
   * Safe helper to extract authenticated user from any guard or middleware context
   */
  private async getAuthUser(ctx: HttpContext): Promise<{ id: number } | null> {
    const anyCtx = ctx as any
    if (anyCtx.authUser?.id) return anyCtx.authUser as { id: number }
    if (anyCtx.user?.id) return anyCtx.user as { id: number }
    if (ctx.auth?.user?.id) return ctx.auth.user as { id: number }

    // Multi-guard check ('api' & 'adminapi')
    for (const guard of ['api', 'adminapi'] as const) {
      try {
        const authInstance = ctx.auth.use(guard)
        if (await authInstance.check()) {
          if (authInstance.user?.id) {
            return authInstance.user as { id: number }
          }
        }
      } catch {}
    }

    return null
  }

  /**
   * GET /api/v1/notifications
   * List paginated notifications for current user
   */
  async index(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    const { request, response } = ctx
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const unreadOnly = request.input('unreadOnly', 'false') === 'true'

    const paginated = await notificationService.listUserNotifications(user.id, {
      page: Number(page),
      limit: Number(limit),
      unreadOnly,
    })

    return response.ok(
      ApiResponse.success(paginated.all(), 'Notifications fetched successfully', 200, {
        total: paginated.total,
        perPage: paginated.perPage,
        currentPage: paginated.currentPage,
        lastPage: paginated.lastPage,
      })
    )
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Return total unread notifications count for badge
   */
  async unreadCount(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    const count = await notificationService.getUnreadCount(user.id)
    return ctx.response.ok(ApiResponse.success({ count }, 'Unread count fetched'))
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    const { params, response } = ctx
    const updated = await notificationService.markAsRead(Number(params.id), user.id)

    if (!updated) {
      return response.notFound(ApiResponse.notFound('Notification not found'))
    }

    return response.ok(ApiResponse.success(updated, 'Notification marked as read'))
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications as read
   */
  async markAllAsRead(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    await notificationService.markAllAsRead(user.id)
    return ctx.response.ok(ApiResponse.success(null, 'All notifications marked as read'))
  }

  /**
   * GET /api/v1/notifications/push/vapid-key
   * Public endpoint to get VAPID public key
   */
  async getVapidPublicKey({ response }: HttpContext) {
    const publicKey = notificationService.getVapidPublicKey()
    return response.ok(ApiResponse.success({ publicKey }, 'VAPID public key fetched'))
  }

  /**
   * POST /api/v1/notifications/push/subscribe
   * Save Web Push subscription token for current user
   */
  async subscribePush(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    const { request, response } = ctx
    const payload = await request.validateUsing(subscribePushValidator)
    const userAgent = request.header('user-agent')

    const subscription = await notificationService.savePushSubscription(user.id, {
      endpoint: payload.endpoint,
      keys: payload.keys,
      userAgent: payload.userAgent || userAgent,
    })

    return response.ok(ApiResponse.success(subscription, 'Push subscription saved successfully'))
  }

  /**
   * POST /api/v1/notifications/push/unsubscribe
   * Remove Web Push subscription
   */
  async unsubscribePush(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    const { request, response } = ctx
    const payload = await request.validateUsing(unsubscribePushValidator)

    await notificationService.removePushSubscription(user.id, payload.endpoint)
    return response.ok(ApiResponse.success(null, 'Push subscription removed successfully'))
  }
}
