import messages from "#database/constants/messages";
import GovtEvent from "#models/govt_event";
import { createGovtEventValidator, updateGovtEventValidator } from "#validators/govt_event";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from "../helper/error_handler.js";
import { DateTime } from "luxon";

@inject()
export default class GovtEventServices {
    constructor(protected ctx: HttpContext) { }

    // Helper method to set security headers
    private setSecurityHeaders() {
        this.ctx.response.header('Access-Control-Allow-Origin', '*');
        this.ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        this.ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Fix for COEP/CORP issues
        this.ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless'); // or 'require-corp'
        this.ctx.response.header('Cross-Origin-Resource-Policy', 'cross-origin');
        this.ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
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
            const govtEventData = {
                ...validatedData,
                isActive: validatedData.isActive ?? true,
            };
            
            const uploadOptions: any = {
                folder: `govt_events/${validatedData.eventBanner}s`,
                resource_type: validatedData.eventBanner === 'video' ? 'video' : 'raw',
                public_id: `govt_event_${validatedData.eventBanner}_${Date.now()}`,
                overwrite: true,
                type: 'upload',
                access_mode: 'public',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'credentialless'
                }
            };
            
            const govtEvent = await GovtEvent.create(govtEventData, uploadOptions);
            
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

            existingGovtEvent.merge(validatedData);
            await existingGovtEvent.save();

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
        filters?: any
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

            govtEvent.deletedAt = DateTime.now()
            await govtEvent.save()

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