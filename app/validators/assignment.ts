import vine from "@vinejs/vine";

export const createAssignmentValidator = vine.compile(
    vine.object({
        assignmentTitle: vine.string().trim(),
        assignmentDescription: vine.string().trim().optional(),
        assignmentFile: vine.string().trim(),
        subject: vine.string().trim(),
        std: vine.string().trim(),
        instituteId: vine.number(),
        facultyId: vine.number(),
        departmentId: vine.number(),
dueDate: vine.date().optional(),
        marks: vine.number().optional(),
        isActive: vine.boolean().optional(),
    })
)
export const updateAssignmentValidator = vine.compile(
    vine.object({
        assignmentTitle: vine.string().trim().optional(),
        assignmentDescription: vine.string().trim().optional(),
        assignmentFile: vine.string().trim().optional(),
        subject: vine.string().trim().optional(),
        std: vine.string().trim().optional(),
        instituteId: vine.number().optional(),
        facultyId: vine.number().optional(),
        departmentId: vine.number().optional(),
        dueDate: vine.date().optional(),
        marks: vine.number().optional(),
        isActive: vine.boolean().optional(),
    })
)
