import vine from '@vinejs/vine'

export const createQuestionValidator = vine.compile(
  vine.object({
    questionText: vine.string().trim().minLength(4).maxLength(255),
    questionType: vine.enum(['mcq', 'true/false']),
    marks: vine.number().positive(),
    quizId: vine.number().positive(),
  })
)

export const updateQuestionValidator = vine.compile(
  vine.object({
    questionText: vine.string().trim().minLength(4).maxLength(255).optional(),
    questionType: vine.enum(['mcq', 'true/false']).optional(),
    marks: vine.number().positive().optional(),
    quizId: vine.number().positive().optional(),
  })
)
