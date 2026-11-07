// app/modules/notifications/services/notifications_service.ts
import * as webpush from 'web-push'
import Notification, { type NotificationType } from '#models/notification'
import PushSubscription from '#models/push_subscription'
import env from '#start/env'

const DEFAULT_VAPID_PUBLIC_KEY =
  env.get('VAPID_PUBLIC_KEY') ||
  'BHAsuvuJfIxqzNUsI0EW0RyoSbdp9PgfHyT4YI93JzQ8vFNsq1Gasdc0gUcaXAYyQ6gOL644uvfFGrgJ-0yAaII'
const DEFAULT_VAPID_PRIVATE_KEY =
  env.get('VAPID_PRIVATE_KEY') || 'qHL3bPsaO--7QCPFTUrav8o_eugIgFPZNanOuRUXXNw'
const DEFAULT_VAPID_SUBJECT = env.get('VAPID_SUBJECT') || 'mailto:support@ruralspark.in'

try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  )
} catch (err) {
  console.error('[WebPush] Error configuring VAPID details:', err)
}

export interface CreateNotificationDTO {
  userId: number
  title: string
  message: string
  type?: NotificationType
  link?: string | null
  metadata?: Record<string, any> | null
}

export default class NotificationsService {
  /**
   * Return the public VAPID key so frontend can register ServiceWorker push
   */
  public getVapidPublicKey(): string {
    return DEFAULT_VAPID_PUBLIC_KEY
  }

  /**
   * Create a single notification and trigger background web push
   */
  public async create(dto: CreateNotificationDTO) {
    const notification = await Notification.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'general',
      link: dto.link || null,
      isRead: false,
      metadata: dto.metadata || null,
    })

    // Non-blocking background push
    this.sendWebPush(dto.userId, {
      title: dto.title,
      body: dto.message,
      url: dto.link || '/dashboard',
    }).catch(() => { })

    return notification
  }

  /**
   * Batch insert notifications (e.g. for whole class or batch)
   */
  public async createBulk(notifications: CreateNotificationDTO[]) {
    if (!notifications.length) return []

    const rows = notifications.map((dto) => ({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'general',
      link: dto.link || null,
      isRead: false,
      metadata: dto.metadata || null,
    }))

    const created = await Notification.createMany(rows)

    // Trigger push for each distinct user in background
    for (const dto of notifications) {
      this.sendWebPush(dto.userId, {
        title: dto.title,
        body: dto.message,
        url: dto.link || '/dashboard',
      }).catch(() => { })
    }

    return created
  }

  /**
   * Fetch paginated user notifications
   */
  public async listUserNotifications(
    userId: number,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const page = options.page && options.page > 0 ? options.page : 1
    const limit = options.limit && options.limit > 0 ? options.limit : 20

    const query = Notification.query().where('userId', userId).orderBy('createdAt', 'desc')

    if (options.unreadOnly) {
      query.where('isRead', false)
    }

    return await query.paginate(page, limit)
  }

  /**
   * Get total unread count for badge
   */
  public async getUnreadCount(userId: number): Promise<number> {
    const count = await Notification.query()
      .where('userId', userId)
      .where('isRead', false)
      .count('* as total')

    return Number((count[0]?.$extras as any)?.total || 0)
  }

  /**
   * Mark single notification as read
   */
  public async markAsRead(notificationId: number, userId: number) {
    const notification = await Notification.query()
      .where('id', notificationId)
      .where('userId', userId)
      .first()

    if (!notification) return null

    notification.isRead = true
    await notification.save()
    return notification
  }

  /**
   * Mark all unread notifications as read for a user
   */
  public async markAllAsRead(userId: number) {
    return await Notification.query()
      .where('userId', userId)
      .where('isRead', false)
      .update({ isRead: true })
  }

  /**
   * Save or update a Web Push subscription from client
   */
  public async savePushSubscription(
    userId: number,
    data: {
      endpoint: string
      keys: { p256dh: string; auth: string }
      userAgent?: string
    }
  ) {
    const existing = await PushSubscription.findBy('endpoint', data.endpoint)

    if (existing) {
      existing.userId = userId
      existing.p256dh = data.keys.p256dh
      existing.auth = data.keys.auth
      existing.userAgent = data.userAgent || null
      await existing.save()
      return existing
    }

    return await PushSubscription.create({
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent || null,
    })
  }

  /**
   * Delete push subscription (e.g. user toggled notifications off)
   */
  public async removePushSubscription(userId: number, endpoint: string) {
    const subscription = await PushSubscription.query()
      .where('userId', userId)
      .where('endpoint', endpoint)
      .first()

    if (subscription) {
      await subscription.delete()
      return true
    }
    return false
  }

  /**
   * Dispatch push alert to all registered devices for user
   */
  public async sendWebPush(
    userId: number,
    payload: { title: string; body: string; url?: string; icon?: string }
  ) {
    const subscriptions = await PushSubscription.query().where('userId', userId)
    if (!subscriptions.length) return

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      icon: payload.icon || '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      timestamp: Date.now(),
    })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(pushConfig, pushPayload)
      } catch (error: any) {
        // If statusCode is 410 (Gone) or 404 (Not Found), token has expired/unsubscribed
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sub.delete()
        }
      }
    })

    await Promise.allSettled(sendPromises)
  }
}
