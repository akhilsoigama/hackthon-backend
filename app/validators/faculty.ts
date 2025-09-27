import vine from "@vinejs/vine"

export const createFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100),
    facultyId: vine.number().positive(),
    designation: vine.string().trim().minLength(2).maxLength(50),
    departmentId: vine.array(
      vine.number().positive()
    ),
    instituteId: vine.array(
      vine.number().positive()
    ),
    roles: vine.array(
      vine.number().positive()
    ),
    isActive: vine.boolean().optional(),
  })
)

export const updateFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100).optional(),
    facultyId: vine.number().positive().optional(),
    designation: vine.string().trim().minLength(2).maxLength(50).optional(),
    departmentId: vine.array(
      vine.number().positive()
    ).optional(),
    roleId: vine.array(
      vine.number().positive()
    ).optional(),
    instituteId: vine.array(
      vine.number().positive()
    ).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const facultyIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)
