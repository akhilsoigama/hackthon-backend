import vine from "@vinejs/vine";

export const createQuizAttemptValidator = vine.compile(
    vine.object({
        quizId: vine.number().positive(),
        studentId: vine.number().positive(),
        instituteId: vine.number().positive(),
        score: vine.number().positive().optional(),
        attemptedAt: vine.string().trim().minLength(2).maxLength(100).optional(),
        status: vine.enum(['in_progress', 'submitted', 'completed']),

    })
);

export const updateQuizAttemptValidator = vine.compile(
    vine.object({
        quizId: vine.number().positive().optional(),
        studentId: vine.number().positive().optional(),
        instituteId: vine.number().positive().optional(),
        score: vine.number().positive().optional(),
        attemptedAt: vine.string().trim().minLength(2).maxLength(100).optional(),
        status: vine.enum(['in_progress', 'submitted', 'completed']).optional(),
    })    
);
