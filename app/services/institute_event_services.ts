import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
import { errorHandler } from "../helper/error_handler.js";
import messages from "#database/constants/messages";
import InstituteEvent from "#models/institute_event";
import { createInstituteEventValidator, updateInstituteEventValidator } from "#validators/institute_event";
import { DateTime } from "luxon";
@inject()
export default class InstituteEventService {
    constructor(protected ctx: HttpContext) { }

    async create() {
        try {
            const requestData = this.ctx.request.all();
            const requiredFields = ['eventTitle', 'eventOrganizer', 'eventBanner', 'eventVenue']
            for (const field of requiredFields) {
                if (!requestData[field]) {
                    return this.ctx.response.status(400).send({
                        status: false,
                        message: `${field} is required`
                    });
                }
            }
            const existingInstituteEvent = await InstituteEvent.query()
                .where('eventTitle', requestData.eventTitle)
                .apply((scope) => scope.softDeletes())
                .first();
            if (existingInstituteEvent) {
                return this.ctx.response.status(422).send({
                    status: false,
                    message: messages.institute_event_already_exists,
                });
            }
            const validate = await createInstituteEventValidator.validate(requestData);
            const instituteEventData = {
                ...validate,
                isActive: validate?.isActive ?? true
            }
            const instituteEvent = await InstituteEvent.create(instituteEventData);
            return {
                status: true,
                message: messages.institute_event_created_successfully,
                data: instituteEvent
            }
        } catch (error) {
            return {
                status: false,
                message: messages.institute_event_creation_failed,
                error: errorHandler(error)
            };
        }
    }

    async update() {
        try {
            const id = this.ctx.request.param('id');
            const requestData = this.ctx.request.all();

            const instituteEvent = await InstituteEvent.query()
                .where('id', id)
                .apply((scope) => scope.softDeletes())
                .first();

            if (!instituteEvent) {
                return this.ctx.response.status(404).send({
                    status: false,
                    message: messages.institute_event_not_found,
                });
            }
            const validatedData = await updateInstituteEventValidator.validate(requestData);
            instituteEvent.merge(validatedData);
            await instituteEvent.save();
            return {
                status: true,
                message: messages.institute_event_updated_successfully,
                data: instituteEvent
            }

        } catch (error) {
            return {
                status: false,
                message: messages.institute_event_update_failed,
                error: errorHandler(error)
            }
        }

    }

    async findAll({ search, filters, searchFor }: { search?: string, filters?: any, searchFor?: string | null }) {
        try {
            let query = InstituteEvent.query()
                .apply((scope) => scope.softDeletes())
                .apply((scope) => scope.search(search))
                .apply((scope) => scope.filters(filters))
                .preload('institute');

            if (searchFor === 'create') {
                query.where('is_active', true)
            }
            const instituteEvent = await query
                .orderBy('priority', 'desc')
                .orderBy('event_date', 'asc')

            return {
                status: instituteEvent.length > 0,
                message: instituteEvent.length
                    ? messages.institute_event_fetched_successfully
                    : messages.institute_event_not_found,
                data: instituteEvent,
            }

        } catch (error) {
            return {
                status: false,
                message: messages.institute_event_not_found,
                error: errorHandler(error)
            }
        }
    }

    async findOne() {
        try {
            const id = this.ctx.request.param('id');

            if (!id || isNaN(Number(id))) {
                return this.ctx.response.status(400).send({
                    status: false,
                    message: 'Invalid govt event ID',
                });
            }
            const instituteEvent = await InstituteEvent.query()
                .where('id', id)
                .preload('institute')
                .apply((scope) => scope.softDeletes())
                .first();


            if (!instituteEvent) {
                return this.ctx.response.status(404).send({
                    status: false,
                    message: messages.institute_event_not_found,
                });
            } else {
                return {
                    status: true,
                    message: messages.institute_event_fetched_successfully,
                    data: instituteEvent,
                };
            }
        } catch (error) {
            return {
                status: false,
                message: messages.institute_event_not_found,
                error: errorHandler(error)
            };
        }
    }

    async delete() {
        const id = this.ctx.request.param('id')

        const instituteEvent = await InstituteEvent
            .query()
            .where('id', id)
            .whereNull('deleted_at')
            .first()

        if (!instituteEvent) {
            return {
                status: false,
                message: messages.govt_event_not_found,
                data: null
            }
        }

        instituteEvent.deletedAt = DateTime.now()
        await instituteEvent.save()

        return {
            status: true,
            message: messages.common_messages_record_deleted,
            data: null
        }
    }

}