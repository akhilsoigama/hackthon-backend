import vine from '@vinejs/vine'

export const createFacultyLeaveValidator = vine.compile(
  vine.object({
    leaveType: vine.string().trim().minLength(2).maxLength(50),
    reason: vine.string().trim().minLength(3).maxLength(1000),
    startDate: vine.date(),
    endDate: vine.date(),
  })
)

export const reviewFacultyLeaveValidator = vine.compile(
  vine.object({
    instituteRemark: vine.string().trim().maxLength(1000).optional(),
  })
)

export const updateFacultyLeaveValidator = vine.compile(
  vine.object({
    leaveType: vine.string().trim().minLength(2).maxLength(50).optional(),
    reason: vine.string().trim().minLength(3).maxLength(1000).optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
  })
)
