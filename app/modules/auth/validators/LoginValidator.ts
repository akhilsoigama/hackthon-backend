// app/modules/auth/validators/LoginValidator.ts
import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(4).maxLength(128),
  })
)

export const checkPermissionValidator = vine.compile(
  vine.object({
    permissionKey: vine.string().minLength(1).maxLength(100),
  })
)
