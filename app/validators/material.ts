import vine from '@vinejs/vine'

export const createMaterialValidator = vine.compile(
  vine.object({
    uuid: vine.string().trim().optional(),
    title: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().optional(),
    subject: vine.string().trim().optional(),
    std: vine.string().trim().optional(),
    contentType: vine.enum(['video', 'pdf', 'audio', 'text', 'image']).optional(),
    content_type: vine.enum(['video', 'pdf', 'audio', 'text', 'image']).optional(),
    thumbnailUrl: vine.string().optional(),
    thumbnail_url: vine.string().optional(),
    contentUrl: vine.string().optional(),
    content_url: vine.string().optional(),
    durationInSeconds: vine.number().optional(),
    duration_in_seconds: vine.number().optional(),
    textContent: vine.string().optional(),
    text_content: vine.string().optional(),
    instituteId: vine.number().optional(),
    institute_id: vine.number().optional(),
    departmentId: vine.number().optional(),
    department_id: vine.number().optional(),
    facultyId: vine.number().optional(),
    faculty_id: vine.number().optional(),
    isActive: vine.boolean().optional(),
    is_active: vine.boolean().optional(),
  })
)

export const updateMaterialValidator = vine.compile(
  vine.object({
    uuid: vine.string().trim().optional(),
    title: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().optional(),
    subject: vine.string().trim().optional(),
    std: vine.string().trim().optional(),
    contentType: vine.enum(['video', 'pdf', 'audio', 'text', 'image']).optional(),
    content_type: vine.enum(['video', 'pdf', 'audio', 'text', 'image']).optional(),
    thumbnailUrl: vine.string().optional(),
    thumbnail_url: vine.string().optional(),
    contentUrl: vine.string().optional(),
    content_url: vine.string().optional(),
    durationInSeconds: vine.number().optional(),
    duration_in_seconds: vine.number().optional(),
    textContent: vine.string().optional(),
    text_content: vine.string().optional(),
    instituteId: vine.number().optional(),
    institute_id: vine.number().optional(),
    departmentId: vine.number().optional(),
    department_id: vine.number().optional(),
    facultyId: vine.number().optional(),
    faculty_id: vine.number().optional(),
    isActive: vine.boolean().optional(),
    is_active: vine.boolean().optional(),
  })
)

export const syncMaterialsValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        uuid: vine.string().trim(),
        action: vine.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
        status: vine.string().optional(),
        instituteId: vine.any().optional(),
        institute_id: vine.any().optional(),
        departmentId: vine.any().optional(),
        department_id: vine.any().optional(),
        createdBy: vine.any().optional(),
        created_by: vine.any().optional(),
        payload: vine.record(vine.any()).optional(),
        // Or direct fields if payload was flattened
        title: vine.string().trim().optional(),
        description: vine.string().trim().optional(),
        subject: vine.string().trim().optional(),
        std: vine.string().trim().optional(),
        contentType: vine.string().trim().optional(),
        content_type: vine.string().trim().optional(),
        thumbnailUrl: vine.string().optional(),
        thumbnail_url: vine.string().optional(),
        contentUrl: vine.string().optional(),
        content_url: vine.string().optional(),
        durationInSeconds: vine.number().optional(),
        duration_in_seconds: vine.number().optional(),
        textContent: vine.string().optional(),
        text_content: vine.string().optional(),
      })
    ),
  })
)
