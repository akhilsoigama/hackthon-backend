import vine from "@vinejs/vine"
export const createInstituteEventValidator = vine.compile(
    vine.object({
        instituteId: vine.number().positive(),
        eventTitle: vine.string().trim().minLength(3),
        eventDescription: vine.string().trim().minLength(10),
        eventSlug: vine.string().trim().minLength(3),
        eventOrganizer: vine.string().trim().minLength(3),
        eventStatus: vine.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        eventVenue: vine.string().trim().minLength(3),
        eventLocation: vine.string().trim().minLength(3).optional(),
        registrationLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventFee: vine.string().trim().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
        eventDuration: vine.number().positive(),
        eventDate: vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD


        eventStartTime: vine.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/), // HH:MM
        eventEndTime: vine.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/), // HH:MM
        eventBanner: vine.string().trim().minLength(3),
        eventCategory: vine.string().trim().minLength(3),
        eventSubCategory: vine.string().trim().minLength(3),
        tags: vine.string().trim().minLength(3).optional(),
        eventContact: vine.string().trim().minLength(3),
        eventEmail: vine.string().email(),
        eventPhone: vine.string().trim().minLength(10),
        priority: vine.number().positive().optional(),
        viewCount: vine.number().positive().optional(),
        isOnline: vine.boolean(),
        isFree: vine.boolean().optional(),
        isFeatured: vine.boolean().optional(),
        isPublished: vine.boolean().optional(),
        createdBy: vine.number().positive().optional(),
        updatedBy: vine.number().positive().optional(),
        isActive: vine.boolean().optional(),
    })
)

export const updateInstituteEventValidator = vine.compile(
    vine.object({
        instituteId: vine.number().positive().optional(),
        eventTitle: vine.string().trim().minLength(3).optional(),
        eventDescription: vine.string().trim().minLength(10).optional(),
        eventSlug: vine.string().trim().minLength(3).optional(),
        eventOrganizer: vine.string().trim().minLength(3).optional(),
        eventStatus: vine.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        eventVenue: vine.string().trim().minLength(3).optional(),
        eventLocation: vine.string().trim().minLength(3).optional(),
        registrationLink: vine.string().trim().minLength(2).maxLength(100).optional(),
        eventFee: vine.string().trim().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
        eventDuration: vine.number().positive(), 
        eventDate: vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),


        eventStartTime: vine.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).optional(),
        eventEndTime: vine.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).optional(),
        eventBanner: vine.string().trim().minLength(3).optional(),
        eventCategory: vine.string().trim().minLength(3).optional(),
        eventSubCategory: vine.string().trim().minLength(3).optional(),
        tags: vine.string().trim().minLength(3).optional(),
        eventContact: vine.string().trim().minLength(3).optional(),
        eventEmail: vine.string().email().optional(),
        eventPhone: vine.string().trim().minLength(10).optional(),
        priority: vine.number().positive().optional(),
        viewCount: vine.number().positive().optional(),
        isOnline: vine.boolean().optional(),
        isFree: vine.boolean().optional(),
        isFeatured: vine.boolean().optional(),
        isPublished: vine.boolean().optional(),
        updatedBy: vine.number().positive().optional(),
        isActive: vine.boolean().optional(),
    })
)
