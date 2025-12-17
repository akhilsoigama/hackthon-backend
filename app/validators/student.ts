// app/validators/student.ts
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const dateRule = vine.string().transform((value) => {
  const date = DateTime.fromISO(value)
  if (!date.isValid) {
    throw new Error('Invalid date format')
  }
  return date
})

export const studentCreateValidator = vine.compile(
  vine.object({
    studentName: vine.string().trim().minLength(2),
    studentEmail: vine.string().email(),
    studentPassword: vine.string().minLength(6),
    studentMobile: vine.string().minLength(10),
    studentId: vine.string(),
    departmentId: vine.number(),
    instituteId: vine.number(),
    roleId: vine.number(),
    studentDob: dateRule.optional(),
    studentAddmissionDate: dateRule.optional(),
    studentStd: vine.string(),
    studentGrNo: vine.number(),
    studentGender: vine.string(),
    studentAddress: vine.string(),
    studentCity: vine.string().optional(),
    studentState: vine.string().optional(),
    studentCountry: vine.string().optional(),
    studentPincode: vine.string().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const studentUpdateValidator = vine.compile(
  vine.object({
    studentName: vine.string().optional(),
    studentEmail: vine.string().email().optional(),
    studentPassword: vine.string().minLength(6).optional(),
    studentMobile: vine.string().optional(),
    departmentId: vine.number().optional(),
    instituteId: vine.number().optional(),
    roleId: vine.number().optional(),
    studentDob: dateRule.optional(),
    studentAddmissionDate: dateRule.optional(),
    studentAddress: vine.string().optional(),
    studentStd: vine.string().optional(),
    studentPincode: vine.string().optional(),
    studentGrNo: vine.number().optional(),
    studentGender: vine.string().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const studentIdParamValidator = vine.compile(
    vine.object({
        id: vine.number(),
    })
)
