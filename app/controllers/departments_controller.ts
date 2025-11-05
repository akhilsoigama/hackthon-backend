// app/controllers/departments_controller.ts
import DepartmentServices from '#services/department_services'
import { HttpContext } from '@adonisjs/core/http'

export default class DepartmentsController {
  async store({ request, response}: HttpContext) {
    try {
      
      // ✅ Get request data directly
      const requestData = request.all();
      
      // ✅ Call service with simple parameters
      const result = await DepartmentServices.create(requestData);
      
      // ✅ Return response based on service result
      if (result.status) {
        return response.status(201).json(result);
      } else {
        return response.status(400).json(result);
      }

    } catch (error) {
      return response.status(500).json({
        status: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  async index({ request, response }: HttpContext) {
    try {
      const { searchFor } = request.qs();
      const result = await DepartmentServices.findAll({ searchFor });
      
      if (result.status) {
        return response.json(result);
      } else {
        return response.status(404).json(result);
      }
    } catch (error) {
      return response.status(500).json({
        status: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const id = Number(params.id);
      const result = await DepartmentServices.findOne(id);
      
      if (result.status) {
        return response.json(result);
      } else {
        return response.status(404).json(result);
      }
    } catch (error) {
      return response.status(500).json({
        status: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  async update({ request, response, params }: HttpContext) {
    try {
      const id = Number(params.id);
      const requestData = request.all();
      
      const result = await DepartmentServices.updateOne(id, requestData);
      
      if (result.status) {
        return response.json(result);
      } else {
        return response.status(400).json(result);
      }
    } catch (error) {
      return response.status(500).json({
        status: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  async destroy({ response, params }: HttpContext) {
    try {
      const id = Number(params.id);
      const result = await DepartmentServices.deleteOne(id);
      
      if (result.status) {
        return response.json(result);
      } else {
        return response.status(400).json(result);
      }
    } catch (error) {
      return response.status(500).json({
        status: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
}