import vine from '@vinejs/vine'

/**
 * Validator to create a single user
 */
export const createUserValidator = vine.compile(
  vine.object({
    userType: vine.enum(['super_admin', 'institute', 'faculty', 'student']),
    fullName: vine.string().trim(),
    email: vine.string().trim().email(),
    password: vine.string().trim(),
    mobile: vine.string().trim(),
    instituteId: vine.number().optional(),
    facultyId: vine.number().optional(),
    studentId: vine.number().optional(),
    isEmailVerified: vine.boolean().optional(),
    isMobileVerified: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator to create multiple users
 */
export const createManyUserValidator = vine.compile(
  vine.array(
    vine.object({
      userType: vine.enum(['super_admin', 'institute', 'faculty', 'student']),
      fullName: vine.string().trim(),
      email: vine.string().trim().email(),
      password: vine.string().trim(),
      mobile: vine.string().trim(),
      instituteId: vine.number().optional(),
      facultyId: vine.number().optional(),
      studentId: vine.number().optional(),
      isEmailVerified: vine.boolean().optional(),
      isMobileVerified: vine.boolean().optional(),
      isActive: vine.boolean().optional(),
    })
  )
)

/**
 * Validator with optional id for updates
 */
export const userSchemaWithRole = vine.object({
  id: vine.number().optional(),
  userType: vine.enum(['super_admin', 'institute', 'faculty', 'student']).optional(),
  fullName: vine.string().trim().optional().requiredIfMissing('id'),
  email: vine.string().trim().email().optional().requiredIfMissing('id'),
  password: vine.string().trim().optional(),
  mobile: vine.string().trim().optional().requiredIfMissing('id'),
  instituteId: vine.number().optional(),
  facultyId: vine.number().optional(),
  studentId: vine.number().optional(),
  isEmailVerified: vine.boolean().optional(),
  isMobileVerified: vine.boolean().optional(),
  isActive: vine.boolean().optional(),
})
