import vine from "@vinejs/vine";

export const createOptionsValidator = vine.compile(
    vine.object({
        optionText: vine.string().trim().minLength(4).maxLength(255),
        questionId: vine.number().positive(),
        isCorrect: vine.boolean().optional(),
    })
);

export const updateOptionsValidator = vine.compile(
    vine.object({
        optionText: vine.string().trim().minLength(4).maxLength(255).optional(),
        questionId: vine.number().positive().optional(),
        isCorrect: vine.boolean().optional(),
    })
);
