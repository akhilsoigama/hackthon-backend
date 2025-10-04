import vine from '@vinejs/vine'

export const createLectureValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
  })
)

export const updateLectureValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(100).optional(),
    description: vine.string().trim().maxLength(500).optional(),
  })
)

export const lectureIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)
