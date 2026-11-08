// app/modules/notifications/routes/notifications.routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const NotificationsController = () => import('../controllers/notifications_controller.js')

export default function registerNotificationsRoutes() {
  router
    .group(() => {
      // VAPID Public key (accessible to authenticated users)
      router.get('/notifications/push/vapid-key', [NotificationsController, 'getVapidPublicKey'])

      // Push subscription management
      router.post('/notifications/push/subscribe', [NotificationsController, 'subscribePush'])
      router.post('/notifications/push/unsubscribe', [NotificationsController, 'unsubscribePush'])
      router.post('/notifications/push/test', [NotificationsController, 'sendTestPush'])

      // Notifications CRUD
      router.get('/notifications', [NotificationsController, 'index'])
      router.get('/notifications/unread-count', [NotificationsController, 'unreadCount'])
      router.patch('/notifications/read-all', [NotificationsController, 'markAllAsRead'])
      router.patch('/notifications/:id/read', [NotificationsController, 'markAsRead'])
    })
    .use(middleware.auth({ guards: ['adminapi', 'api'] }))
}
