import vine from "@vinejs/vine";

export const createQuizzezValidator = vine.compile(
    vine.object({
        quizTitle: vine.string().trim().minLength(4).maxLength(255),
        quizDescription: vine.string().maxLength(255).optional(),
        quizBanner: vine.string().trim(),
        subject: vine.string().trim().maxLength(255).optional(),
        std: vine.string().trim().maxLength(255).optional(),
        dueDate: vine.string().trim().minLength(2).maxLength(100).optional(),
        marks: vine.number().positive().optional(),
        attemptLimit: vine.number().positive().optional(),
        isActive: vine.boolean().optional(),
        instituteId: vine.number().positive(),
        facultyId: vine.number().positive(),
        departmentId: vine.number().positive(),
        questions: vine.array(
            vine.object({
                questionText: vine.string().trim().minLength(4).maxLength(255),
                questionType: vine.enum(['mcq', 'true/false']),
                marks: vine.number().positive(),
                correctOptionId: vine.number().positive().optional(),
                options: vine.array(
                    vine.object({
                        optionText: vine.string().trim().minLength(4).maxLength(255),
                        isCorrect: vine.boolean().optional(),
                    })
                ).optional(),
            })
        ).optional(),
    })
);

export const updateQuizzezValidator = vine.compile(
    vine.object({
        quizTitle: vine.string().trim().minLength(4).maxLength(255).optional(),
        quizDescription: vine.string().maxLength(255).optional(),
        quizBanner: vine.string().trim().optional(),
        subject: vine.string().trim().maxLength(255).optional(),
        std: vine.string().trim().maxLength(255).optional(),
        dueDate: vine.string().trim().minLength(2).maxLength(100).optional(),
        marks: vine.number().positive().optional(),
        attemptLimit: vine.number().positive().optional(),
        isActive: vine.boolean().optional(),
        instituteId: vine.number().positive().optional(),
        facultyId: vine.number().positive().optional(),
        departmentId: vine.number().positive().optional(),
        questions: vine.array(
            vine.object({
                id: vine.number().positive().optional(),
                questionText: vine.string().trim().minLength(4).maxLength(255),
                questionType: vine.enum(['mcq', 'true/false']),
                marks: vine.number().positive(),
                correctOptionId: vine.number().positive().optional(),
                options: vine.array(
                    vine.object({
                        id: vine.number().positive().optional(),
                        optionText: vine.string().trim().minLength(4).maxLength(255),
                        isCorrect: vine.boolean().optional(),
                    })
                ).optional(),
            })
        ).optional(),
    })
);