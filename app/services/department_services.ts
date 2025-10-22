// app/services/department_services.ts
import messages from "#database/constants/messages"
import Department from "#models/department"
import { createDepartmentValidator, updateDepartmentValidator } from "#validators/department"
import { errorHandler } from "../helper/error_handler.js"

export default class DepartmentServices {
  
  static async findAll({ searchFor }: { searchFor?: string | null }) {
    try {
      let query = Department.query().apply((scopes) => scopes.softDeletes())
      if (searchFor === 'create') {
        query = query.where('isActive', true)
      }
      const departments = await query
      
      return {
        status: true,
        message: departments.length > 0 
          ? messages.department_fetched_successfully 
          : messages.department_not_found,
        data: departments
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }

  // ✅ SIMPLIFIED: Accept plain request data
  static async create(requestData: any) {
    try {
      console.log('🟢 Department create service called')
      console.log('📦 Request data:', requestData)

      // Validate request data
      const validatedData = await createDepartmentValidator.validate(requestData)

      // Check for existing department
      const existingDepartment = await Department
        .query()
        .where('departmentName', validatedData.departmentName)
        .apply((scope) => scope.softDeletes())
        .first()

      if (existingDepartment) {
        return {
          status: false,
          message: messages.department_already_exists,
        }
      }

      const department = await Department.create(validatedData)

      return {
        status: true,
        message: messages.department_created_successfully,
        data: department,
      }

    } catch (error) {
      console.error('❌ Department create error:', error)
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  // ✅ SIMPLIFIED: Accept ID directly
  static async findOne(id: number) {
    try {
      const department = await Department
        .query().where('id', id)
        .apply((scope) => scope.softDeletes())
        .firstOrFail()

      return {
        status: true,
        message: messages.department_fetched_successfully,
        data: department
      }
    } catch (error) {
      return {
        status: false,
        message: messages.department_not_found,
        data: null,
        error: errorHandler(error)
      }
    }
  }

  // ✅ SIMPLIFIED: Accept ID and request data
  static async updateOne(id: number, requestData: any) {
    try {
      const validatedData = await updateDepartmentValidator.validate(requestData)
      
      const department = await Department.query()
        .whereRaw('LOWER(department_name) = ?', [validatedData.departmentName!.trim().toLowerCase()])
        .whereNot('id', id)
        .apply((scope) => scope.softDeletes())
        .first()
        
      if (department) {
        return {
          status: false,
          message: messages.department_already_exists,
          data: null
        }
      }
      
      const departmentData = await Department.findOrFail(id)
      departmentData.merge(validatedData)
      await departmentData.save()
      
      return {
        status: true,
        message: messages.department_updated_successfully,
        data: departmentData
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }

  // ✅ SIMPLIFIED: Accept ID directly
  static async deleteOne(id: number) {
    try {
      const department = await Department.findOrFail(id)
      await department.delete()
      
      return {
        status: true,
        message: messages.common_messages_record_deleted,
        data: null
      }
    } catch (error) {
      return {
        status: false,
        message: messages.common_messages_error,
        error: errorHandler(error)
      }
    }
  }
}