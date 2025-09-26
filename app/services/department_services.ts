import messages from "#database/constants/messages";
import Department from "#models/department";
import { createDepartmentValidator, updateDepartmentValidator } from "#validators/department";
import { inject } from "@adonisjs/core";
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from "../helper/error_handler.js";

@inject()
export default class DepartmentServices {
    constructor(protected ctx: HttpContext) { }

    async findAll({ searchFor }: { searchFor?: string | null }) {
        try {
            let query = Department.query().apply((scopes) => scopes.softDeletes())
            if (searchFor === 'create') {
                query = query.where('isActive', true)
            }
            const departments = await query
            if (departments && Array.isArray(departments) && departments.length > 0) {
                return {
                    status: true,
                    Message: messages.department_fetched_successfully,
                    Data: departments
                }
            } else {
                return {
                    status: false,
                    Message: messages.department_not_found,
                    Data: []
                }
            }
        } catch (error) {
            return {
                status: false,
                Message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }
    async create() {
        try {
            const requestData = this.ctx.request.all()

            const validatedData = await createDepartmentValidator.validate(requestData)

            const department = await Department.create(validatedData)

            return {
                status: true,
                Message: messages.department_created_successfully,
                Data: department
            }
        } catch (error) {
            console.error('Department creation error:', error)
            return {
                status: false,
                Message: messages.department_creation_failed,
                error: errorHandler(error),
                data: []
            }
        }
    }

    async findOne() {
        try {
            const id = this.ctx.request.param('id')
            const department = await Department
                .query().where('id', id)
                .apply((scope) => scope.softDeletes())
                .firstOrFail()

            if (department) {
                return {
                    status: true,
                    Message: messages.department_fetched_successfully,
                    data: department
                }
            }
            else {
                return {
                    status: false,
                    Message: messages.department_not_found,
                    data: []
                }
            }
        } catch (error) {
            return {
                status: false,
                Message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }
    async updateOne() {
        try {
            const id = this.ctx.request.param('id')
            const requestData = this.ctx.request.all()
            const validatedData = await updateDepartmentValidator.validate(requestData)
            const department = await Department.query()
                .whereRaw('LOWER(department_name) = ?', [validatedData.departmentName!.trim().toLowerCase()])
                .whereNot('id', id)
                .apply((scope) => scope.softDeletes())
                .first()
            if (department) {
                return {
                    status: false,
                    Message: messages.department_already_exists,
                    Data: null
                }
            }
            const departmentData = await Department.findOrFail(id)
            departmentData.merge(validatedData)
            await departmentData.save()
            return {
                status: true,
                Message: messages.department_updated_successfully,
                Data: departmentData
            }
        } catch (error) {
            return {
                status: false,
                Message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }
    async deleteOne() {
        try {
            const id = this.ctx.request.param('id')
            const department = await Department.findOrFail(id)
            await department.delete()
            return {
                status: true,
                Message: messages.common_messages_record_deleted,
                Data: null
            }
        } catch (error) {
            return {
                status: false,
                Message: messages.common_messages_error,
                error: errorHandler(error)
            }
        }
    }
}
