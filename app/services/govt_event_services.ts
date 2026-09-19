import messages from "#database/constants/messages";
import GovtEvent from "#models/govt_event";
import { createGovtEventValidator, updateGovtEventValidator } from "#validators/govt_event";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from "../helper/error_handler.js";
import { DateTime } from "luxon";
import apiCacheService from './api_cache_service.js'

@inject()
export default class GovtEventServices {
    constructor(protected ctx: HttpContext) { }

    private setSecurityHeaders() {
        this.ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless'); 
        this.ctx.response.header('Cross-Origin-Resource-Policy', 'cross-origin');
        this.ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }

    private invalidateEventCaches() {
        apiCacheService.invalidateByPrefix('institute-govt-events:list:')
    }

    async sync() {
        try {
            this.setSecurityHeaders();
            const requestData = this.ctx.request.all();
            const tasks = requestData.tasks || [];
            const user = this.ctx.auth?.user as any;

            for (const task of tasks) {
                if (task.action === 'CREATE') {
                    // Overwrite instituteId with auth.user.instituteId if available
                    const instituteId = user?.instituteId || task.instituteId;
                    
                    const govtEventData = {
                        eventTitle: task.eventTitle,
                        eventSlug: task.eventSlug,
                        eventDescription: task.eventDescription,
                        eventDate: task.eventDate,
                        eventTime: task.eventTime,
                        eventDuration: task.eventDuration,
                        eventBanner: task.eventBanner,
                        eventLink: task.eventLink,
                        registrationLink: task.registrationLink,
                        eventOrganizer: task.eventOrganizer,
                        organizerLogo: task.organizerLogo,
                        eventContact: task.eventContact,
                        eventEmail: task.eventEmail,
                        eventPhone: task.eventPhone,
                        eventCategory: task.eventCategory,
                        eventSubCategory: task.eventSubCategory,
                        tags: task.tags,
                        eventVenue: task.eventVenue,
                        eventLocation: task.eventLocation,
                        latitude: task.latitude,
                        longitude: task.longitude,
                        isOnline: task.isOnline,
                        eventFee: task.eventFee,
                        isFree: task.isFree,
                        eventStatus: task.eventStatus,
                        priority: task.priority,
                        viewCount: task.viewCount,
                        isActive: task.isActive ?? true,
                        isFeatured: task.isFeatured ?? false,
                        instituteId: instituteId,
                        departmentId: task.departmentId,
                        createdBy: task.createdBy || user?.id,
                        updatedBy: user?.id,
                    };
                    await GovtEvent.create(govtEventData);
                }
            }

            this.invalidateEventCaches();

            return this.ctx.response.send({
                status: true,
                message: "Synced successfully",
                data: null,
            });
        } catch (error) {
            return this.ctx.response.status(500).send({
                status: false,
                message: "Sync failed",
                error: errorHandler(error),
            });
        }
    }

    async create() {
        try {
            this.setSecurityHeaders();
            const requestData = this.ctx.request.all();

            const requiredFields = ['eventTitle', 'eventOrganizer', 'eventBanner', 'eventVenue']
            for (const field of requiredFields) {
                if (!requestData[field]) {
                    return this.ctx.response.status(400).send({
                        status: false,
                        message: `${field} is required`,
                    });
                }
            }

            const existingGovtEvent = await GovtEvent.query()
                .where('eventTitle', requestData.eventTitle)
                .apply((scope) => scope.softDeletes())
                .first();

            if (existingGovtEvent) {
                return this.ctx.response.status(422).send({
                    status: false,
                    message: messages.govt_event_already_exists,
                });
            }

            const validatedData = await createGovtEventValidator.validate(requestData);
            const user = this.ctx.auth?.user as any;
            const govtEventData = {
                ...validatedData,
                instituteId: user?.instituteId || null,
                isActive: validatedData.isActive ?? true,
            };
            
            const uploadOptions: Record<string, unknown> = {
                folder: `govt_events/${validatedData.eventBanner}s`,
                resource_type: validatedData.eventBanner === 'video' ? 'video' : 'raw',
                public_id: `govt_event_${validatedData.eventBanner}_${Date.now()}`,
                overwrite: true,
                type: 'upload',
                access_mode: 'public',
                headers: {
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'credentialless'
                }
            };
            
            const govtEvent = await GovtEvent.create(govtEventData, uploadOptions);
            this.invalidateEventCaches()
            
            return this.ctx.response.send({
                status: true,
                message: messages.govt_event_created_successfully,
                data: govtEvent,
            });
        } catch (error) {
            return this.ctx.response.status(500).send({
                status: false,
                message: messages.govt_event_creation_failed,
                error: errorHandler(error),
            });
        }
    }

    async update() {
        try {
            this.setSecurityHeaders();
            const id = this.ctx.request.param('id');
            const requestData = this.ctx.request.all();

            if (requestData.eventMobile) {
                requestData.eventMobile = requestData.eventMobile.toString().replace(/\D/g, '');
            }

            const validatedData = await updateGovtEventValidator.validate(requestData);

            const existingGovtEvent = await GovtEvent.find(id);
            if (!existingGovtEvent || existingGovtEvent.deletedAt) {
                return this.ctx.response.status(404).send({
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null,
                });
            }

            const user = this.ctx.auth?.user as any;
            if (user?.instituteId && existingGovtEvent.instituteId && existingGovtEvent.instituteId !== user.instituteId) {
                return this.ctx.response.status(403).send({
                    status: false,
                    message: "Forbidden",
                    data: null,
                });
            }

            existingGovtEvent.merge(validatedData);
            await existingGovtEvent.save();
            this.invalidateEventCaches()

            return this.ctx.response.send({
                status: true,
                message: messages.govt_event_updated_successfully,
                data: existingGovtEvent,
            });
        } catch (error) {
            return this.ctx.response.status(500).send({
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error),
            });
        }
    }

    async findAll({
        search,
        filters,
        searchFor,
    }: {
        search?: string
        filters?: unknown
        searchFor?: string | null
    } = {}) {
        try {
            this.setSecurityHeaders();
            
            let query = GovtEvent.query()
                .apply((scope) => scope.softDeletes())
                .apply((scope) => scope.search(search))
                .apply((scope) => scope.filters(filters))

            if (searchFor === 'create') {
                query.where('is_active', true)
            }
            
            const govtEvents = await query
                .orderBy('priority', 'desc')
                .orderBy('event_date', 'asc')

            return this.ctx.response.send({
                status: govtEvents.length > 0,
                message: govtEvents.length
                    ? messages.govt_event_fetched_successfully
                    : messages.govt_event_not_found,
                data: govtEvents,
            });
        } catch (error) {
            this.setSecurityHeaders();
            return this.ctx.response.status(500).send({
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error),
            });
        }
    }

    async findOne() {
        try {
            this.setSecurityHeaders();
            const id = this.ctx.request.param('id')
            if (!id || isNaN(Number(id))) {
                return this.ctx.response.status(400).send({
                    status: false,
                    message: 'Invalid govt event ID',
                });
            }
            
            const govtEvent = await GovtEvent.query()
                .where('id', id)
                .apply((scopes) => scopes.softDeletes())
                .first();
                
            if (govtEvent) {
                const user = this.ctx.auth?.user as any;
                if (user?.instituteId && govtEvent.instituteId && govtEvent.instituteId !== user.instituteId) {
                    return this.ctx.response.status(403).send({
                        status: false,
                        message: "Forbidden",
                        data: null,
                    });
                }
                return this.ctx.response.send({
                    status: true,
                    message: messages.govt_event_fetched_successfully,
                    data: govtEvent
                });
            } else {
                return this.ctx.response.status(404).send({
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null
                });
            }
        } catch (error) {
            this.setSecurityHeaders();
            return this.ctx.response.status(500).send({
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error)
            });
        }
    }

    async delete() {
        try {
            this.setSecurityHeaders();
            const id = this.ctx.request.param('id')

            const govtEvent = await GovtEvent.find(id)

            if (!govtEvent || govtEvent.deletedAt) {
                return this.ctx.response.status(404).send({
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null
                });
            }

            const user = this.ctx.auth?.user as any;
            if (user?.instituteId && govtEvent.instituteId && govtEvent.instituteId !== user.instituteId) {
                return this.ctx.response.status(403).send({
                    status: false,
                    message: "Forbidden",
                    data: null,
                });
            }

            govtEvent.deletedAt = DateTime.now()
            await govtEvent.save()
            this.invalidateEventCaches()

            return this.ctx.response.send({
                status: true,
                message: messages.common_messages_record_deleted,
                data: null
            });
        } catch (error) {
            this.setSecurityHeaders();
            return this.ctx.response.status(500).send({
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error)
            });
        }
    }
}
