import Material from '#models/material'
import { DateTime } from 'luxon'

export type MaterialListFilters = {
  instituteId?: number
  departmentId?: number
  createdBy?: number
  facultyId?: number
  contentType?: string
  search?: string
  onlyActive?: boolean
  withDeleted?: boolean
}

export default class MaterialRepository {
  async list(filters: MaterialListFilters, page = 1, limit = 20) {
    page = Math.max(page || 1, 1)
    limit = Math.min(Math.max(limit || 10, 1), 100)

    const query = Material.query()
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('faculty', (q) => q.select(['id', 'facultyName']))
      .preload('creator', (q) => q.select(['id', 'name', 'email']))
      .orderBy('createdAt', 'desc')

    if (!filters.withDeleted) {
      query.whereNull('deleted_at')
    }

    if (filters.instituteId !== undefined && filters.instituteId !== null) {
      query.where('institute_id', filters.instituteId)
    }

    if (filters.departmentId !== undefined && filters.departmentId !== null) {
      query.where('department_id', filters.departmentId)
    }

    if (filters.createdBy !== undefined && filters.createdBy !== null) {
      query.where('created_by', filters.createdBy)
    }

    if (filters.facultyId !== undefined && filters.facultyId !== null) {
      query.where('faculty_id', filters.facultyId)
    }

    if (filters.contentType) {
      query.where('content_type', filters.contentType)
    }

    if (filters.onlyActive) {
      query.where('is_active', true)
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`
      query.where((sub) => {
        sub
          .whereILike('title', searchPattern)
          .orWhereILike('subject', searchPattern)
          .orWhereILike('std', searchPattern)
          .orWhereILike('description', searchPattern)
      })
    }

    return query.paginate(page, limit)
  }

  async findById(id: number) {
    return Material.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('faculty', (q) => q.select(['id', 'facultyName']))
      .preload('creator', (q) => q.select(['id', 'name', 'email']))
      .first()
  }

  async findByUuid(uuid: string) {
    return Material.query()
      .where('uuid', uuid)
      .whereNull('deleted_at')
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('faculty', (q) => q.select(['id', 'facultyName']))
      .preload('creator', (q) => q.select(['id', 'name', 'email']))
      .first()
  }

  async create(data: Partial<Material>) {
    return Material.create(data)
  }

  async softDelete(id: number, updatedBy?: number | null) {
    const material = await Material.query().where('id', id).whereNull('deleted_at').first()
    if (!material) return null

    material.deletedAt = DateTime.now()
    if (updatedBy) {
      material.updatedBy = updatedBy
    }
    await material.save()
    return material
  }
}
