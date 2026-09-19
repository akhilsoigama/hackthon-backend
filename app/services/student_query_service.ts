import type { HttpContext } from '@adonisjs/core/http'
import StudentQuery from '#models/student_query'
import { ApiResponse } from '../helper/api_response.js'
import messages from '#database/constants/messages'
import {
  createStudentQueryValidator,
  updateStudentQueryValidator,
} from '#validators/student_query'
import { DateTime } from 'luxon'

type AuthenticatedActor = {
  id: number
  userType?: string
  studentId?: number | null
  instituteId?: number | null
}

export default class StudentQueryService {
  constructor(protected ctx: HttpContext) {}

  private async findQueryById(id: number) {
    const query = await StudentQuery.query()
      .apply((scopes) => scopes.softDeletes())
      .where('id', id)
      .preload('student')
      .preload('assignedFaculty')
      .first()

    return query
  }

  private canAccessQuery(query: StudentQuery) {
    const user = this.ctx.auth.user as AuthenticatedActor | null

    if (!user) {
      return false
    }

    if (user.userType === 'super_admin') {
      return true
    }

    if (user.studentId) {
      return query.studentId === user.studentId
    }

    if (user.instituteId) {
      return query.instituteId === user.instituteId
    }

    return false
  }

  private unauthorizedResponse() {
    return this.ctx.response.status(401).send(ApiResponse.error('Unauthorized', 401))
  }

  private forbiddenResponse() {
    return this.ctx.response.status(403).send(ApiResponse.error('Forbidden', 403))
  }

  private notFoundResponse() {
    return this.ctx.response
      .status(404)
      .send(ApiResponse.error(messages.student_query_not_found, 404))
  }

  public async create() {
    const { auth, request, response } = this.ctx
    const payload = await request.validateUsing(createStudentQueryValidator)
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    if (!user.studentId || !user.instituteId) {
      return response.status(400).send(ApiResponse.error(messages.student_not_found, 400))
    }

    const query = await StudentQuery.create({
      ...payload,
      studentId: user.studentId,
      instituteId: user.instituteId,
      status: 'open',
      isActive: true,
    })

    return response
      .status(201)
      .send(ApiResponse.success(query, messages.student_query_created_successfully, 201))
  }

  public async list() {
    const { auth, request, response } = this.ctx
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 10))
    const status = request.input('status')
    const priority = request.input('priority')

    const queryBuilder = StudentQuery.query().apply((scopes) => scopes.softDeletes())

    if (user.studentId) {
      queryBuilder.where('student_id', user.studentId)
    } else if (user.instituteId) {
      queryBuilder.where('institute_id', user.instituteId)
    }

    if (status) {
      queryBuilder.where('status', status)
    }

    if (priority) {
      queryBuilder.where('priority', priority)
    }

    const paginated = await queryBuilder
      .preload('student')
      .preload('assignedFaculty')
      .orderBy('id', 'desc')
      .paginate(page, limit)

    return response.status(200).send(
      ApiResponse.success(paginated.all(), messages.student_query_fetched_successfully, 200, {
        total: paginated.total,
        perPage: paginated.perPage,
        currentPage: paginated.currentPage,
        lastPage: paginated.lastPage,
      })
    )
  }

  public async show() {
    const { auth, params, response } = this.ctx
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    const query = await this.findQueryById(Number(params.id))

    if (!query) {
      return this.notFoundResponse()
    }

    if (!this.canAccessQuery(query)) {
      return this.forbiddenResponse()
    }

    return response
      .status(200)
      .send(ApiResponse.success(query, messages.student_query_fetched_successfully))
  }

  public async update() {
    const { auth, params, request, response } = this.ctx
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    const payload = await request.validateUsing(updateStudentQueryValidator)
    const query = await this.findQueryById(Number(params.id))

    if (!query) {
      return this.notFoundResponse()
    }

    if (!this.canAccessQuery(query)) {
      return this.forbiddenResponse()
    }

    Object.assign(query, payload)

    if (payload.status === 'resolved' || payload.status === 'closed') {
      query.resolvedAt = DateTime.now()
      query.resolvedByUserId = user.id
    }

    await query.save()

    return response
      .status(200)
      .send(ApiResponse.success(query, messages.student_query_updated_successfully))
  }

  public async delete() {
    const { auth, params, response } = this.ctx
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    const query = await this.findQueryById(Number(params.id))

    if (!query) {
      return this.notFoundResponse()
    }

    if (!this.canAccessQuery(query)) {
      return this.forbiddenResponse()
    }

    query.deletedAt = DateTime.now()
    await query.save()

    return response
      .status(200)
      .send(ApiResponse.success({ id: query.id }, messages.student_query_deleted_successfully))
  }

  public async sync() {
    const { auth, request, response } = this.ctx
    const user = auth.user as AuthenticatedActor | null

    if (!user) {
      return this.unauthorizedResponse()
    }

    const items = request.input('items', [])
    if (!Array.isArray(items)) {
      return response.status(400).send(ApiResponse.error('Invalid sync payload: items must be an array', 400))
    }

    const results: Array<{
      uuid: string
      status: 'synced' | 'failed' | 'rejected'
      id?: number
      error?: string
    }> = []

    for (const item of items) {
      const itemUuid = item.uuid
      const action = item.action || 'CREATE'

      if (!itemUuid) {
        results.push({
          uuid: itemUuid || 'unknown',
          status: 'failed',
          error: 'Missing UUID for sync item',
        })
        continue
      }

      try {
        if (action === 'CREATE') {
          // Check tenant boundary
          if (user.instituteId && item.instituteId && Number(user.instituteId) !== Number(item.instituteId)) {
            results.push({
              uuid: itemUuid,
              status: 'failed',
              error: 'Forbidden: Tenant isolation mismatch',
            })
            continue
          }

          const studentId = user.studentId || item.studentId || (item.payload && item.payload.studentId)
          const instituteId = user.instituteId || item.instituteId || (item.payload && item.payload.instituteId)

          if (!studentId || !instituteId) {
            results.push({
              uuid: itemUuid,
              status: 'failed',
              error: 'Missing required studentId or instituteId',
            })
            continue
          }

          const p = (item.payload || item) as Record<string, any>
          const query = await StudentQuery.create({
            title: p.title || 'Offline Query',
            description: p.description || '',
            subject: p.subject || null,
            category: p.category || null,
            priority: p.priority || 'medium',
            assignedFacultyId: p.assignedFacultyId || null,
            studentId: Number(studentId),
            instituteId: Number(instituteId),
            status: 'open',
            isActive: true,
          })

          results.push({
            uuid: itemUuid,
            status: 'synced',
            id: query.id,
          })
        } else if (action === 'UPDATE') {
          const targetId = item.id || (item.payload && item.payload.id)
          if (!targetId) {
            results.push({
              uuid: itemUuid,
              status: 'failed',
              error: 'Missing query id for update',
            })
            continue
          }

          const query = await this.findQueryById(Number(targetId))
          if (!query) {
            results.push({
              uuid: itemUuid,
              status: 'failed',
              error: 'Query not found',
            })
            continue
          }

          if (!this.canAccessQuery(query)) {
            results.push({
              uuid: itemUuid,
              status: 'failed',
              error: 'Forbidden: Access denied to update query',
            })
            continue
          }

          const p = (item.payload || item) as Record<string, any>
          if (p.title !== undefined) query.title = p.title
          if (p.description !== undefined) query.description = p.description
          if (p.subject !== undefined) query.subject = p.subject
          if (p.category !== undefined) query.category = p.category
          if (p.priority !== undefined) query.priority = p.priority
          if (p.status !== undefined) query.status = p.status
          if (p.response !== undefined) query.response = p.response

          await query.save()

          results.push({
            uuid: itemUuid,
            status: 'synced',
            id: query.id,
          })
        } else if (action === 'DELETE') {
          const targetId = item.id || (item.payload && item.payload.id)
          if (targetId) {
            const query = await this.findQueryById(Number(targetId))
            if (query && this.canAccessQuery(query)) {
              query.deletedAt = DateTime.now()
              await query.save()
            }
          }

          results.push({
            uuid: itemUuid,
            status: 'synced',
          })
        }
      } catch (err: unknown) {
        results.push({
          uuid: itemUuid,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown sync error',
        })
      }
    }

    return response.status(200).send({
      status: true,
      success: true,
      message: 'Sync completed',
      results,
    })
  }
}

