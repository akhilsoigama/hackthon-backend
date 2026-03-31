import vine from "@vinejs/vine";

export const assignmentUploadValidator = vine.compile(
    vine.object({
        assignmentId: vine.number().positive(),
        studentId: vine.number().positive(),
        facultyId: vine.number().positive().optional(),
        instituteId: vine.number().positive(),
        departmentId: vine.number().positive(),
        marks: vine.number().min(0).max(100).optional(),
        grad: vine.string().maxLength(2).optional(),
        assignmentFile: vine.string().maxLength(255),
        isSubmitted: vine.boolean(),
        isActive: vine.boolean(),
        isGradedByFaculty: vine.boolean().optional(),
        isGraded: vine.boolean().optional(),
    })
)

export const assignmentUploadUpdateValidator = vine.compile(
    vine.object({
        assignmentId: vine.number().positive().optional(),
        studentId: vine.number().positive().optional(),
        departmentId: vine.number().positive().optional(),
        facultyId: vine.number().positive().optional(),
        instituteId: vine.number().positive().optional(),
        marks: vine.number().min(0).max(100).optional(),
        grad: vine.string().maxLength(2).optional(),
        assignmentFile: vine.string().maxLength(255).optional(),
        isSubmitted: vine.boolean().optional(),
        isActive: vine.boolean().optional(),
        isGradedByFaculty: vine.boolean().optional(),
        isGraded: vine.boolean().optional(),
    })
)

export const assignmentUploadIdParamValidator = vine.compile(
    vine.object({
        id: vine.number().positive(),
    })
)
