// app/modules/notifications/validators/notification_validator.ts
import vine from '@vinejs/vine'

export const subscribePushValidator = vine.compile(
  vine.object({
    endpoint: vine.string().url(),
    keys: vine.object({
      p256dh: vine.string(),
      auth: vine.string(),
    }),
    userAgent: vine.string().maxLength(255).optional(),
  })
)

export const unsubscribePushValidator = vine.compile(
  vine.object({
    endpoint: vine.string().url(),
  })
)
