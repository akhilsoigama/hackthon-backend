import GovtEventServices from "#services/govt_event_services";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http';
@inject()
export default class GovtEventsController {
    constructor(protected govtEventServices: GovtEventServices) { }

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
        return this.govtEventServices.findAll({
            search,
            filters,
            searchFor,
        })
    }

    async store() {
        return this.govtEventServices.create();
    }

    async show() {
        return this.govtEventServices.findOne();
    }

    async update() {
        return this.govtEventServices.update();
    }

    async destroy() {
        return this.govtEventServices.delete();
    }

}