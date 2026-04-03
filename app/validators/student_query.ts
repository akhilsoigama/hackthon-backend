import vine from '@vinejs/vine'

export const createStudentQueryValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(150),
    description: vine.string().trim().minLength(10).maxLength(2000),
    subject: vine.string().trim().maxLength(120).optional(),
    category: vine.string().trim().maxLength(80).optional(),
    priority: vine.enum(['low', 'medium', 'high'] as const).optional(),
    assignedFacultyId: vine.number().positive().optional(),
  })
)

export const updateStudentQueryValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(150).optional(),
    description: vine.string().trim().minLength(10).maxLength(2000).optional(),
    subject: vine.string().trim().maxLength(120).optional(),
    category: vine.string().trim().maxLength(80).optional(),
    priority: vine.enum(['low', 'medium', 'high'] as const).optional(),
    status: vine.enum(['open', 'in_progress', 'resolved', 'closed'] as const).optional(),
    response: vine.string().trim().maxLength(3000).optional(),
    assignedFacultyId: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)
