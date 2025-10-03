import vine from "@vinejs/vine";


export const createInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim().minLength(3),
    instituteEmail: vine.string().email(),
    institutePassword: vine.string().minLength(6).optional(),
    instituteAddress: vine.string().trim().minLength(5),
    institutePhone: vine.string().trim().minLength(10),
    instituteWebsite: vine.string().url().optional(),
    instituteCode: vine.string().trim().minLength(2),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.number().min(1900).max(new Date().getFullYear()),
    principalName: vine.string().trim().minLength(2),
    principalEmail: vine.string().email().optional(),
    principalPhone: vine.string().trim().minLength(10).optional(),
    instituteCity: vine.string().trim().minLength(2),
    instituteState: vine.string().trim().minLength(2),
    instituteCountry: vine.string().trim().minLength(2),
    institutePinCode: vine.string().trim().minLength(4),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.number().min(0).optional(),
    isActive: vine.boolean().optional(),
    createdBy: vine.number().optional(),
  })
)

export const updateInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim().minLength(3).optional(),
    institutePassword: vine.string().minLength(6).optional(),
    instituteAddress: vine.string().trim().minLength(5).optional(),
    institutePhone: vine.string().trim().minLength(10).optional(),
    instituteEmail: vine.string().email().optional(),
    instituteWebsite: vine.string().url().optional(),
    instituteCode: vine.string().trim().minLength(2).optional(),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.number().min(1900).max(new Date().getFullYear()).optional(),
    principalName: vine.string().trim().minLength(2).optional(),
    principalEmail: vine.string().email().optional(),
    principalPhone: vine.string().trim().minLength(10).optional(),
    instituteCity: vine.string().trim().minLength(2).optional(),
    instituteState: vine.string().trim().minLength(2).optional(),
    instituteCountry: vine.string().trim().minLength(2).optional(),
    institutePinCode: vine.string().trim().minLength(4).optional(),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.number().min(0).optional(),
    roles: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const instituteIdParamValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)

