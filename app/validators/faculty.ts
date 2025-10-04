import vine from '@vinejs/vine';

/**
 * Validator to create a new faculty
 */
export const createFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100),
    facultyId: vine.string().trim().minLength(2).maxLength(50).optional(),
    designation: vine.string().trim().minLength(2).maxLength(50),
    departmentId: vine.number().positive(),
    instituteId: vine.number().positive(),
    roleId: vine.number().positive(),
    facultyEmail: vine.string().trim().email(),
    facultyMobile: vine.string().trim().minLength(10).maxLength(15).optional(),
    facultyPassword: vine.string().trim().minLength(6),
    isActive: vine.boolean().optional(),
  })
);

/**
 * Validator to update an existing faculty
 */
export const updateFacultyValidator = vine.compile(
  vine.object({
    facultyName: vine.string().trim().minLength(2).maxLength(100).optional(),
    facultyEmail: vine.string().email().optional(),
    facultyPassword: vine.string().minLength(6).optional(),
    facultyMobile: vine.string().minLength(10).maxLength(15).optional(),
    designation: vine.string().trim().minLength(2).maxLength(50).optional(),
    departmentId: vine.number().positive().optional(),
    instituteId: vine.number().positive().optional(),
    roleId: vine.number().positive().optional(),
    facultyId: vine.string().trim().minLength(2).maxLength(50).optional(),
    isActive: vine.boolean().optional(),
  })
);

/**
 * Validator for route param: faculty ID
 */
export const facultyIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
);