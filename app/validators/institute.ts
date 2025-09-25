import vine from "@vinejs/vine";

export const createInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim(),
    instituteAddress: vine.string().trim(),
    institutePhone: vine.string().trim(),
    instituteEmail: vine.string().trim(),
    instituteWebsite: vine.string().trim().optional(),
    instituteCode: vine.string().trim().optional(),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.number().optional(),
    principalName: vine.string().trim(),
    principalEmail: vine.string().trim(),
    principalPhone: vine.string().trim(),
    instituteCity: vine.string().trim().optional(),
    instituteState: vine.string().trim().optional(),
    instituteCountry: vine.string().trim().optional(),
    institutePinCode: vine.string().trim().optional(),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.number().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const updateInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim().optional(),
    instituteAddress: vine.string().trim().optional(),
    institutePhone: vine.string().trim().optional(),
    instituteEmail: vine.string().trim().optional(),
    instituteWebsite: vine.string().trim().optional(),
    instituteCode: vine.string().trim().optional(),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.number().optional(),
    principalName: vine.string().trim().optional(),
    principalEmail: vine.string().trim().optional(),
    principalPhone: vine.string().trim().optional(),
    instituteCity: vine.string().trim().optional(),
    instituteState: vine.string().trim().optional(),
    instituteCountry: vine.string().trim().optional(),
    institutePinCode: vine.string().trim().optional(),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.number().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const instituteIdParamValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)

