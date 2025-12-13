import vine from "@vinejs/vine";

export const createInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim().minLength(3),
    instituteEmail: vine.string().email(),
    institutePassword: vine.string().minLength(6),
    instituteAddress: vine.string().trim().minLength(5),
    institutePhone: vine.string().trim().minLength(10),
    instituteWebsite: vine
      .string()
      .regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w.-]*)*\/?$|^http:\/\/localhost(:\d+)?(\/[\w.-]*)*\/?$/)
      .optional(),
    instituteCode: vine.string().trim().minLength(2),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.string().trim(),
    principalName: vine.string().trim().minLength(2),
    principalEmail: vine.string().email().optional(),
    principalPhone: vine.string().trim().minLength(10).optional(),
    instituteCity: vine.string().trim().minLength(2),
    instituteState: vine.string().trim().minLength(2),
    instituteCountry: vine.string().trim().minLength(2),
    institutePinCode: vine.string().trim().minLength(4),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.string().trim().optional(),
    roleId: vine.number().positive(),
    campusArea: vine.string().optional(),
    instituteType: vine.string().trim(),
    isActive: vine.boolean().optional(),
  })
);

export const updateInstituteValidator = vine.compile(
  vine.object({
    instituteName: vine.string().trim().minLength(3).optional(),
    institutePassword: vine.string().minLength(6).optional(),
    instituteAddress: vine.string().trim().minLength(5).optional(),
    institutePhone: vine.string().trim().minLength(10).optional(),
    instituteEmail: vine.string().email().optional(),
    instituteWebsite: vine
      .string()
      .regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w.-]*)*\/?$|^http:\/\/localhost(:\d+)?(\/[\w.-]*)*\/?$/)
      .optional(),
    instituteCode: vine.string().trim().minLength(2).optional(),
    affiliation: vine.string().trim().optional(),
    establishedYear: vine.string().trim().optional(),
    principalName: vine.string().trim().minLength(2).optional(),
    principalEmail: vine.string().email().optional(),
    principalPhone: vine.string().trim().minLength(10).optional(),
    instituteCity: vine.string().trim().minLength(2).optional(),
    instituteState: vine.string().trim().minLength(2).optional(),
    instituteCountry: vine.string().trim().minLength(2).optional(),
    institutePinCode: vine.string().trim().minLength(4).optional(),
    principalQualification: vine.string().trim().optional(),
    principalExperience: vine.string().trim().optional(),
    roleId: vine.number().positive().optional(),
    campusArea: vine.string().optional(),
    instituteType: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
);

export const instituteIdParamValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
);