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

    async create() {
        try {
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

            const govtEvent = await GovtEvent.create(govtEventData);
            return {
                status: true,
                message: messages.govt_event_created_successfully,
                data: govtEvent,
            }
        } catch (error) {
            return {
                status: false,
                message: messages.govt_event_creation_failed,
                error: errorHandler(error),
            };
        }
    }

    async update() {
        try {
            const id = this.ctx.request.param('id');
            const requestData = this.ctx.request.all();

            if (requestData.eventMobile) {
                requestData.eventMobile = requestData.eventMobile.toString().replace(/\D/g, '');
            }

            const validatedData = await updateGovtEventValidator.validate(requestData);

            const existingGovtEvent = await GovtEvent.find(id);
            if (!existingGovtEvent || existingGovtEvent.deletedAt) {
                return {
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null,
                };
            }

            existingGovtEvent.merge(validatedData);
            await existingGovtEvent.save();

            return {
                status: true,
                message: messages.govt_event_updated_successfully,
                data: existingGovtEvent,
            };
        } catch (error) {
            return {
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error),
            };
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

      return {
        status: govtEvents.length > 0,
        message: govtEvents.length
          ? messages.govt_event_fetched_successfully
          : messages.govt_event_not_found,
        data: govtEvents,
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

    async findOne() {
        try {
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
                return {
                    status: true,
                    message: messages.govt_event_fetched_successfully,
                    data: govtEvent
                }
            }
            else {
                return {
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null
                }
            }
        } catch (error) {
            return {
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }

    async delete(){
        try{
            const id = this.ctx.request.param('id')

            const govtEvent = await GovtEvent.find(id)

            if(!govtEvent || govtEvent.deletedAt){
                return{
                    status: false,
                    message: messages.govt_event_not_found,
                    data: null
                }
            }

            govtEvent.deletedAt = DateTime.now()
            await govtEvent.save()

            return{
                status: true,
                message: messages.common_messages_record_deleted,
                data: null
            }
        }catch(error){
            return{
                status: false,
                message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }
}
