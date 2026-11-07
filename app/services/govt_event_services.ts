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

            
            // Strict Fee validation
            if (requestData.isFree === false || requestData.isFree === 'false') {
                if (!requestData.eventFee || String(requestData.eventFee).trim() === '') {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee is required for paid events',
                    });
                }
                const feeStr = String(requestData.eventFee).trim();
                if (feeStr.includes('-')) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee cannot be negative',
                    });
                }
                const feeNum = Number(feeStr.replace(/[^0-9.]/g, ''));
                if (Number.isNaN(feeNum) || feeNum <= 0) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee must be a valid positive amount greater than 0',
                    });
                }
                requestData.eventFee = feeNum.toString();
            } else {
                requestData.eventFee = null;
            }

            // Strict Date & Time validation for upcoming events
            if (requestData.eventDate) {
                const todayStr = new Date().toISOString().split('T')[0];
                const dateStr = String(requestData.eventDate).slice(0, 10);
                if (requestData.eventStatus === 'upcoming' && dateStr < todayStr) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event date cannot be in the past for upcoming events',
                    });
                }
                if (requestData.eventStatus === 'upcoming' && dateStr === todayStr && requestData.eventTime) {
                    const now = new Date();
                    const currentMins = now.getHours() * 60 + now.getMinutes();
                    const [h, m] = String(requestData.eventTime).split(':').map(Number);
                    if (!Number.isNaN(h) && (h * 60 + (m || 0)) < currentMins) {
                        return this.ctx.response.status(422).send({
                            status: false,
                            message: "Event time cannot be in the past for today's event",
                        });
                    }
                }
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

            // Non-blocking notification dispatch for Government Event
            ;(async () => {
                try {
                    const { default: NotificationsService } = await import('#modules/notifications/services/notifications_service')
                    const { default: User } = await import('#models/user')
                    const notificationService = new NotificationsService()

                    // Target all institutes, teachers (faculty), and students across the platform
                    const targetUsers = await User.query()
                        .where('isActive', true)
                        .whereIn('userType', ['institute', 'faculty', 'student'])
                        .select('id')
                        .limit(2000)
                    if (targetUsers.length > 0) {
                        const notifications = targetUsers.map((u) => ({
                            userId: u.id,
                            title: `🏛️ Govt Event: ${govtEvent.eventTitle}`,
                            message: `New event organized by ${govtEvent.eventOrganizer || 'Government'}. Tap to view details.`,
                            type: 'system' as const,
                            link: '/dashboard/events',
                            metadata: { govtEventId: govtEvent.id },
                        }))
                        await notificationService.createBulk(notifications)
                    }
                } catch (err) {
                    console.error('[Notification Trigger] Failed to dispatch govt event notifications:', err)
                }
            })()
            
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

            
            // Strict Fee validation
            if (requestData.isFree === false || requestData.isFree === 'false') {
                if (!requestData.eventFee || String(requestData.eventFee).trim() === '') {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee is required for paid events',
                    });
                }
                const feeStr = String(requestData.eventFee).trim();
                if (feeStr.includes('-')) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee cannot be negative',
                    });
                }
                const feeNum = Number(feeStr.replace(/[^0-9.]/g, ''));
                if (Number.isNaN(feeNum) || feeNum <= 0) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event fee must be a valid positive amount greater than 0',
                    });
                }
                requestData.eventFee = feeNum.toString();
            } else {
                requestData.eventFee = null;
            }

            // Strict Date & Time validation for upcoming events
            if (requestData.eventDate) {
                const todayStr = new Date().toISOString().split('T')[0];
                const dateStr = String(requestData.eventDate).slice(0, 10);
                if (requestData.eventStatus === 'upcoming' && dateStr < todayStr) {
                    return this.ctx.response.status(422).send({
                        status: false,
                        message: 'Event date cannot be in the past for upcoming events',
                    });
                }
                if (requestData.eventStatus === 'upcoming' && dateStr === todayStr && requestData.eventTime) {
                    const now = new Date();
                    const currentMins = now.getHours() * 60 + now.getMinutes();
                    const [h, m] = String(requestData.eventTime).split(':').map(Number);
                    if (!Number.isNaN(h) && (h * 60 + (m || 0)) < currentMins) {
                        return this.ctx.response.status(422).send({
                            status: false,
                            message: "Event time cannot be in the past for today's event",
                        });
                    }
                }
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
