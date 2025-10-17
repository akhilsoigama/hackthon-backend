import vine from '@vinejs/vine'

export const createLectureValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
    content_type: vine.enum(['video', 'audio', 'pdf', 'text', 'image']),
    content_url: vine.string().url().optional(),
    thumbnail_url: vine.string().url().optional(),
    duration_in_seconds: vine.number().positive().optional(),
    text_content: vine.string().optional(),
    subject: vine.string().trim().maxLength(50),
    faculty_id: vine.number().positive(),
    std: vine.string().trim().maxLength(50),
    duration: vine.string().optional(),
  })
)


export const updateLectureValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(150).optional(),
    description: vine.string().trim().maxLength(1000).optional(),
    subject: vine.string().trim().minLength(2).maxLength(100).optional(),
    contentType: vine.enum(['video', 'pdf', 'text', 'audio']).optional(),
    contentUrl: vine.string().url().optional(),
    thumbnailPath: vine.string().url().optional(),
    textContent: vine.string().optional(),
    duration: vine.string().optional(),
    std: vine.string().trim().optional(),
    language: vine.string().trim().maxLength(30).optional(),
  })
)

export const lectureIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)
