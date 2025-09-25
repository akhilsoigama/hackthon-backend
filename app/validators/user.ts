import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new user.
 */
export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim(),
    email: vine.string().trim(),
    password: vine.string().trim().optional(),
    mobile: vine.string().trim(),
  })
)

/**
 * Validator to validate the payload when creating
 * a new users.
 */
export const createManyUserValidator = vine.compile(
  vine.array(
    vine.object({
      fullName: vine.string().trim(),
      email: vine.string().trim(),
      password: vine.string().trim().optional(),
      mobile: vine.string().trim(),
    })
  )
)

export const userSchemaWithRole = vine.object({
  id: vine.number().optional(),
  fullName: vine.string().trim().optional().requiredIfMissing('id'),
  email: vine.string().trim().optional().requiredIfMissing('id'),
  password: vine.string().trim().optional(),
  mobile: vine.string().trim().optional().requiredIfMissing('id'),
})
