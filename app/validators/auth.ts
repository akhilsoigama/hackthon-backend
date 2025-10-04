// app/validators/auth.ts
import vine from '@vinejs/vine'

const mobileSchema = vine.string().regex(/^[6-9]\d{9}$/)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6)
  })
)

export const changePasswordInputValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(6),
    confirmPassword: vine.string().minLength(6)
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(3).maxLength(255).optional(),
    mobile: mobileSchema.optional(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email()
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string(), // Keep as string for validation
    password: vine.string().minLength(6),
    confirmPassword: vine.string().minLength(6)
  })
)