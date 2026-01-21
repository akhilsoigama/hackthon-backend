import vine from "@vinejs/vine";

export const createDepartmentValidator = vine.compile(
    vine.object({
        departmentName: vine.string().trim(),
        departmentCode: vine.string().trim(),
        description: vine.string().trim().optional(),
        isActive: vine.boolean().optional(),
        instituteId: vine.number().positive(),
    })
)

export const updateDepartmentValidator = vine.compile(
    vine.object({
        departmentName: vine.string().trim().optional(),
        departmentCode: vine.string().trim().optional(),
        description: vine.string().trim().optional(),
        isActive: vine.boolean().optional(),
        instituteId: vine.number().positive().optional(),
    })
)

export const departmentIdParamValidator = vine.compile(
    vine.object({
        id: vine.number(),
    })
)

