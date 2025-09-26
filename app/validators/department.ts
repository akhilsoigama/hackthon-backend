import vine from "@vinejs/vine";

export const createDepartmentValidator = vine.compile(
    vine.object({
        departmentName: vine.string().trim(),
        departmentCode: vine.string().trim(),
        description: vine.string().trim().optional(),
        isActive: vine.boolean().optional(),
    })
)

export const updateDepartmentValidator = vine.compile(
    vine.object({
        departmentName: vine.string().trim().optional(),
        departmentCode: vine.string().trim().optional(),
        description: vine.string().trim().optional(),
        isActive: vine.boolean().optional(),
    })
)

export const departmentIdParamValidator = vine.compile(
    vine.object({
        id: vine.number(),
    })
)

