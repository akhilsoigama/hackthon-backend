import vine from "@vinejs/vine"



export const createFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100),
    facultyId: vine.number().positive(),
    designation: vine.string().trim().minLength(2).maxLength(50),
<<<<<<< HEAD
    departmentId: vine.array(
      vine.number().positive()
    ),
    instituteId: vine.array(
      vine.number().positive()
    ),
    roles: vine.array(
      vine.number().positive()
    ),
=======
    departmentId: vine.number().positive(),   // single id
    instituteId: vine.number().positive(),    // single id
    roleId: vine.number().positive(),         // single id
>>>>>>> 3e483d4 (solve faculty module issue)
    isActive: vine.boolean().optional(),
  })
)

export const updateFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100).optional(),
    facultyId: vine.number().positive().optional(),
    designation: vine.string().trim().minLength(2).maxLength(50).optional(),
    departmentIds: vine.number().positive().optional(),
    instituteIds: vine.number().positive().optional(),
    roles: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const facultyIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)
