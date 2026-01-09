import vine from "@vinejs/vine";

export const createGovtEventValidator = vine.compile(
    vine.object({
        eventTitle: vine.string().trim().minLength(2).maxLength(100),
        eventDescription: vine.string().trim().minLength(2).maxLength(1000).optional(),
        eventSlug: vine.string().trim().minLength(2).maxLength(100),
        eventDuration: vine.string().trim().minLength(2).maxLength(100),
        eventDate: vine.string().trim().minLength(2).maxLength(100),
        eventTime: vine.string().trim().minLength(2).maxLength(100),
        eventLocation: vine.string().trim().minLength(2).maxLength(100),
        eventBanner: vine.string().url(),
        eventLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        registrationLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventOrganizer: vine.string().trim().minLength(2).maxLength(100),
        organizerLogo: vine.string().url().optional(),
        eventContact: vine.string().trim().minLength(2).maxLength(100),
        eventEmail: vine.string().trim().minLength(2).maxLength(30),
        eventPhone: vine.string().trim().minLength(2).maxLength(30),
        eventCategory: vine.string().trim().minLength(2).maxLength(30),
        eventSubCategory: vine.string().trim().minLength(2).maxLength(30),
        tags: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventVenue: vine.string().trim().minLength(2).maxLength(100),
        latitude: vine.string().trim().minLength(2).maxLength(100).optional(),
        longitude: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventFee: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventStatus: vine.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        priority: vine.number().positive().optional(),
        viewCount:vine.number().positive().optional(),
        isFeatured: vine.boolean().optional(),
        isDeleted: vine.boolean().optional(),
        createdBy: vine.number().positive().optional(),
        updatedBy: vine.number().positive().optional(),
        isFree: vine.boolean().optional(),
        isOnline: vine.boolean().optional(),
        isActive: vine.boolean().optional(),
    })
);

export const updateGovtEventValidator = vine.compile(
    vine.object({
        eventTitle: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventDescription: vine.string().trim().minLength(2).maxLength(1000).optional(),
        eventSlug: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventDuration: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventDate: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventTime: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventLocation: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventBanner: vine.string().url().optional(),
        eventLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        registrationLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventOrganizer: vine.string().trim().minLength(2).maxLength(100).optional(),
        organizerLogo:vine.string().url().optional(),
        eventContact: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventEmail: vine.string().trim().minLength(2).maxLength(30).optional(),
        eventPhone: vine.string().trim().minLength(2).maxLength(30).optional(),
        eventCategory: vine.string().trim().minLength(2).maxLength(30).optional(),
        eventSubCategory: vine.string().trim().minLength(2).maxLength(30).optional(),
        tags: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventVenue: vine.string().trim().minLength(2).maxLength(100).optional(),
        latitude: vine.string().trim().minLength(2).maxLength(100).optional(),
        longitude: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventFee: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventStatus: vine.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        priority: vine.number().positive().optional(),
        viewCount:vine.number().positive().optional(),
        isFeatured: vine.boolean().optional(),
        isDeleted: vine.boolean().optional(),
        updatedBy: vine.number().positive().optional(),
        isFree: vine.boolean().optional(),
        isOnline: vine.boolean().optional(),
        isActive: vine.boolean().optional(),
}))

export const govtEventIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
);