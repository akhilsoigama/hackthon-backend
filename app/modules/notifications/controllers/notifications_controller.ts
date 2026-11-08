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
  private async getAuthUser(
    ctx: HttpContext
  ): Promise<{ id: number; userType: 'admin' | 'user' } | null> {
    const anyCtx = ctx as any
    if (anyCtx.authUser?.id) {
      const type =
        anyCtx.authUser.isAdmin || anyCtx.authUser.userType === 'super_admin' ? 'admin' : 'user'
      return { id: anyCtx.authUser.id, userType: type }
    }
    if (anyCtx.user?.id) {
      const type =
        anyCtx.user.isAdmin || anyCtx.user.userType === 'super_admin' ? 'admin' : 'user'
      return { id: anyCtx.user.id, userType: type }
    }

    // Multi-guard check ('adminapi' & 'api')
    try {
      const adminAuth = ctx.auth.use('adminapi')
      if (await adminAuth.check()) {
        if (adminAuth.user?.id) {
          return { id: adminAuth.user.id, userType: 'admin' }
        }
      }
    } catch {}

    try {
      const apiAuth = ctx.auth.use('api')
      if (await apiAuth.check()) {
        if (apiAuth.user?.id) {
          return { id: apiAuth.user.id, userType: 'user' }
        }
      }
    } catch {}

    if (ctx.auth?.user?.id) {
      const user = ctx.auth.user as any
      const type = user.isAdmin || user.userType === 'super_admin' ? 'admin' : 'user'
      return { id: user.id, userType: type }
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

    const paginated = await notificationService.listUserNotifications(
      user.id,
      user.userType,
      {
        page: Number(page),
        limit: Number(limit),
        unreadOnly,
      }
    )

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

    const count = await notificationService.getUnreadCount(user.id, user.userType)
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
    const updated = await notificationService.markAsRead(Number(params.id), user.id, user.userType)

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

    await notificationService.markAllAsRead(user.id, user.userType)
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
    try {
      const payload = await request.validateUsing(subscribePushValidator)
      const userAgent = request.header('user-agent')

      const subscription = await notificationService.savePushSubscription(
        user.id,
        user.userType,
        {
          endpoint: payload.endpoint,
          keys: payload.keys,
          userAgent: payload.userAgent || userAgent,
        }
      )

      // Send instant welcome push to confirm delivery on this device
      notificationService
        .sendWebPush(
          user.id,
          {
            title: '🎉 RuralSpark Alerts Active!',
            body: 'You will now receive instant updates and announcements on this device.',
            url: '/dashboard',
          },
          user.userType
        )
        .catch(() => {})

      return response.ok(ApiResponse.success(subscription, 'Push subscription saved successfully'))
    } catch (error: any) {
      console.error('[NotificationsController] subscribePush error:', error)
      return response.internalServerError(
        ApiResponse.error(error.message || 'Failed to save push subscription', 500)
      )
    }
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
    try {
      const payload = await request.validateUsing(unsubscribePushValidator)
      await notificationService.removePushSubscription(user.id, user.userType, payload.endpoint)
      return response.ok(ApiResponse.success(null, 'Push subscription removed successfully'))
    } catch (error: any) {
      console.error('[NotificationsController] unsubscribePush error:', error)
      return response.internalServerError(
        ApiResponse.error(error.message || 'Failed to remove push subscription', 500)
      )
    }
  }

  /**
   * POST /api/v1/notifications/push/test
   * Trigger an immediate test push to all user's devices
   */
  async sendTestPush(ctx: HttpContext) {
    const user = await this.getAuthUser(ctx)
    if (!user) {
      return ctx.response.unauthorized(ApiResponse.unauthorized('User not authenticated'))
    }

    try {
      await notificationService.sendWebPush(
        user.id,
        {
          title: '🔔 Test Alert - RuralSpark',
          body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
          url: '/dashboard',
        },
        user.userType
      )

      return ctx.response.ok(ApiResponse.success(null, 'Test push notification dispatched'))
    } catch (error: any) {
      console.error('[NotificationsController] sendTestPush error:', error)
      return ctx.response.internalServerError(
        ApiResponse.error(error.message || 'Failed to dispatch test push', 500)
      )
    }
  }
}
