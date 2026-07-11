import { HttpContext } from "@adonisjs/core/http";
import { contactValidator } from "#validators/contact_us";
import EmailService from "./email_services.js";

export default class ContactService {

    async store(ctx:HttpContext){

        const payload = await ctx.request.validateUsing(contactValidator)

        const emailService = new EmailService()

        await emailService.sendContactEmail(payload)

        return ctx.response.ok({
            status:true,
            message:"Thank you for contacting RuralSpark. We'll get back to you shortly."
        })

    }

}