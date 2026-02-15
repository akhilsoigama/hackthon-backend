import vine from '@vinejs/vine'

export const createRoleValidator = vine.compile(
  vine.object({
    roleName: vine.string(),
    roleDescription: vine.string().optional(),
    roleKey: vine.string(),
  })
)
export const updateRoleValidator  = vine.compile(
  vine.object({
     roleName: vine.string().optional(),
    roleDescription: vine.string().optional(),
    roleKey: vine.string().optional(),
  })
)
export const roleIdParamValidator = vine.compile(
    vine.object({
        id: vine.number(),
    })
)