import InstituteEventWithGovtEventService from '#services/institute_event_with_govt_event_service';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http'
@inject()
export default class InstituteEventWithGovtEventsController {

    constructor(protected instituteEventWithGovtEventService: InstituteEventWithGovtEventService) {}

    async index({ request }: HttpContext) {
        const search = request.input('search')
        const searchFor = request.input('searchFor')
        const filters = {
            isActive: request.input('isActive'),
            isFeatured: request.input('isFeatured'),
            eventStatus: request.input('eventStatus'),
            eventCategory: request.input('eventCategory'),
            eventSubCategory: request.input('eventSubCategory'),
            isOnline: request.input('isOnline'),
            isFree: request.input('isFree'),
            startDate: request.input('startDate'),
            endDate: request.input('endDate'),
            instituteId: request.input('instituteId'),
        }

        return this.instituteEventWithGovtEventService.findAll({
            search,
            filters,
            searchFor,
        })
    }
}

