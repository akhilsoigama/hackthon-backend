import vine from "@vinejs/vine";

export const studentIdParamValidator = vine.compile(
    vine.object({
        id: vine.number().positive(),
    })
);

export const studentCreateValidator = vine.compile(
    vine.object({
        studentName: vine.string().trim().minLength(2).maxLength(100),
        studentEmail: vine.string().trim().email(),
        studentPassword: vine.string().trim().minLength(6),
        studentMobile: vine.string().trim().minLength(10).maxLength(15).optional(),
        studentId: vine.string().trim().minLength(2).maxLength(50).optional(),
        departmentId: vine.number().positive(),
        instituteId: vine.number().positive(),
        roleId: vine.number().positive(),
        studentSTD: vine.string().trim().minLength(2).maxLength(50),
        studentGrNo: vine.number().positive(),
        studentGender: vine.string().trim().minLength(2).maxLength(50),
        isActive: vine.boolean().optional(),
    })
);


export const studentUpdateValidator = vine.compile(
    vine.object({
        studentName: vine.string().trim().minLength(2).maxLength(100).optional(),
        studentEmail: vine.string().email().optional(),
        studentPassword: vine.string().minLength(6).optional(),
        studentMobile: vine.string().minLength(10).maxLength(15).optional(),
        studentId: vine.string().trim().minLength(2).maxLength(50).optional(),
        departmentId: vine.number().positive().optional(),
        instituteId: vine.number().positive().optional(),
        roleId: vine.number().positive().optional(), 
        studentSTD: vine.string().trim().minLength(2).maxLength(50).optional(),
        studentGrNo: vine.number().positive().optional(),
        studentGender: vine.string().trim().minLength(2).maxLength(50).optional(),
        isActive: vine.boolean().optional(),
    })
);