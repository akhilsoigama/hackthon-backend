import InstituteEventService from "#services/institute_event_services";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
@inject()
export default class InstituteEventsController {
    constructor(protected instituteEventServices: InstituteEventService) { }

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
        }
        return this.instituteEventServices.findAll({
            search,
            filters,
            searchFor,
        })
    }

    async store() {
        return this.instituteEventServices.create();
    }

    async show() {
        return this.instituteEventServices.findOne();
    }

    async update() {
        return this.instituteEventServices.update();
    }

    async destroy() {
        return this.instituteEventServices.delete();
    }

}