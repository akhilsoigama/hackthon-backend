// app/modules/users/validators/UserValidator.ts
import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    fullName: vine.string().minLength(2).maxLength(100),
    password: vine.string().minLength(8).maxLength(128),
    mobile: vine.string().minLength(10).maxLength(15),
    userType: vine.enum(['institute', 'faculty', 'student', 'super_admin']),
    instituteId: vine.number().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(2).maxLength(100).optional(),
    mobile: vine.string().minLength(10).maxLength(15).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const assignRolesValidator = vine.compile(
  vine.object({
    roleIds: vine.array(vine.number()).minLength(1),
  })
)
