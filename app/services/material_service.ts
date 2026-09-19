import messages from '#database/constants/messages'
import Material from '#models/material'
import Student from '#models/student'
import Faculty from '#models/faculty'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { errorHandler } from '../helper/error_handler.js'
import { createMaterialValidator, updateMaterialValidator, syncMaterialsValidator } from '#validators/material'
import MaterialRepository from '../repositories/material_repository.js'
import { parseListQuery } from '../helper/list_query.js'
import apiCacheService from './api_cache_service.js'
import { DateTime } from 'luxon'

@inject()
export default class MaterialService {
  private readonly materialRepository = new MaterialRepository()
  constructor(protected ctx: HttpContext) {}

  public async getAuthenticatedUser() {
    const contextUser =
      (this.ctx as any).user ||
      (this.ctx as any).authUser ||
      (this.ctx.request as any)?.user ||
      this.ctx.auth?.user

    if (contextUser) {
      return contextUser
    }

    try {
      const apiAuth = this.ctx.auth.use('api')
      const isApiAuth = await apiAuth.check()
      if (isApiAuth && apiAuth.user) {
        return apiAuth.user
      }
    } catch {}

    try {
      const adminAuth = this.ctx.auth.use('adminapi')
      const isAdminAuth = await adminAuth.check()
      if (isAdminAuth && adminAuth.user) {
        return adminAuth.user
      }
    } catch {}

    try {
      return await this.ctx.auth.authenticate()
    } catch {
      return null
    }
  }

  public async verifyMaterialAccess(
    material: Material,
    action: 'view' | 'update' | 'delete'
  ): Promise<{ authorized: boolean; statusCode: number; message: string }> {
    const authUser = await this.getAuthenticatedUser()

    if (!authUser) {
      return {
        authorized: false,
        statusCode: 401,
        message: messages.user_not_authenticated || 'User not authenticated',
      }
    }

    const userId = Number(authUser.id)
    const rawRole = (
      authUser.userType ||
      (authUser as any).role ||
      (authUser as any).roleName ||
      ''
    )
      .toString()
      .toLowerCase()

    const isSuperAdmin =
      rawRole === 'super_admin' ||
      rawRole === 'admin' ||
      (typeof (authUser as any).isSuperAdmin === 'function' && (authUser as any).isSuperAdmin()) ||
      (Array.isArray((authUser as any).userRoles) &&
        (authUser as any).userRoles.some(
          (r: any) => (r.roleKey || r.roleName || '').toString().toLowerCase() === 'super_admin'
        ))

    const isStudent =
      rawRole === 'student' ||
      (typeof (authUser as any).isStudent === 'function' && (authUser as any).isStudent()) ||
      (Array.isArray((authUser as any).userRoles) &&
        (authUser as any).userRoles.some(
          (r: any) => (r.roleKey || r.roleName || '').toString().toLowerCase() === 'student'
        ))

    const isFaculty =
      rawRole === 'faculty' ||
      (typeof (authUser as any).isFacultyUser === 'function' && (authUser as any).isFacultyUser()) ||
      (Array.isArray((authUser as any).userRoles) &&
        (authUser as any).userRoles.some(
          (r: any) => (r.roleKey || r.roleName || '').toString().toLowerCase() === 'faculty'
        ))

    const isInstitute =
      rawRole === 'institute' ||
      (typeof (authUser as any).isInstitute === 'function' && (authUser as any).isInstitute()) ||
      (Array.isArray((authUser as any).userRoles) &&
        (authUser as any).userRoles.some(
          (r: any) => (r.roleKey || r.roleName || '').toString().toLowerCase() === 'institute'
        ))

    // Preload student/faculty relations if needed
    if (typeof (authUser as any).load === 'function') {
      if (isStudent && authUser.studentId && !authUser.student) {
        try {
          await authUser.load('student')
        } catch {}
      }
      if (isFaculty && authUser.facultyId && !authUser.faculty) {
        try {
          await authUser.load('faculty')
        } catch {}
      }
    }

    // Resolve user instituteId
    let userInstituteId: number | null = null
    const rawUserInstituteId =
      (authUser as any).institute_id ??
      authUser.instituteId ??
      authUser.student?.instituteId ??
      (authUser.student as any)?.institute_id ??
      authUser.faculty?.instituteId ??
      (authUser.faculty as any)?.institute_id

    if (rawUserInstituteId !== undefined && rawUserInstituteId !== null) {
      userInstituteId = Number(rawUserInstituteId)
    }

    if (userInstituteId === null && isStudent && authUser.studentId) {
      try {
        const student = await Student.find(authUser.studentId)
        const instId = student?.instituteId ?? (student as any)?.institute_id
        if (instId !== undefined && instId !== null) userInstituteId = Number(instId)
      } catch {}
    }

    if (userInstituteId === null && isFaculty && authUser.facultyId) {
      try {
        const faculty = await Faculty.find(authUser.facultyId)
        const instId = faculty?.instituteId ?? (faculty as any)?.institute_id
        if (instId !== undefined && instId !== null) userInstituteId = Number(instId)
      } catch {}
    }

    // Resolve user departmentId
    let userDepartmentId: number | null = null
    const rawUserDeptId =
      (authUser as any).department_id ??
      (authUser as any).departmentId ??
      authUser.student?.departmentId ??
      (authUser.student as any)?.department_id ??
      authUser.faculty?.departmentId ??
      (authUser.faculty as any)?.department_id

    if (rawUserDeptId !== undefined && rawUserDeptId !== null) {
      userDepartmentId = Number(rawUserDeptId)
    }

    if (userDepartmentId === null && isStudent && authUser.studentId) {
      try {
        const student = await Student.find(authUser.studentId)
        const deptId = student?.departmentId ?? (student as any)?.department_id
        if (deptId !== undefined && deptId !== null) userDepartmentId = Number(deptId)
      } catch {}
    }

    const materialInstituteId = Number(
      (material as any).institute_id ?? material.instituteId
    )
    const materialDepartmentId =
      (material as any).department_id ?? material.departmentId !== null
        ? Number((material as any).department_id ?? material.departmentId)
        : null
    const rawCreatedBy = (material as any).created_by ?? material.createdBy
    const materialCreatedBy =
      rawCreatedBy !== null && rawCreatedBy !== undefined ? Number(rawCreatedBy) : null
    const materialFacultyId =
      (material as any).faculty_id ?? material.facultyId !== null
        ? Number((material as any).faculty_id ?? material.facultyId)
        : null

    // 1. Institute Boundary Check
    if (userInstituteId !== null) {
      if (materialInstituteId !== userInstituteId) {
        return {
          authorized: false,
          statusCode: 403,
          message: 'Forbidden: Access outside institute boundary is not permitted.',
        }
      }
    } else if (!isSuperAdmin) {
      return {
        authorized: false,
        statusCode: 403,
        message: 'Forbidden: User is not associated with an institute.',
      }
    }

    // 2. Student Scope Check
    if (isStudent) {
      if (action !== 'view') {
        return {
          authorized: false,
          statusCode: 403,
          message: 'Forbidden: Students are not permitted to modify or delete study materials.',
        }
      }

      if (
        userDepartmentId === null ||
        materialDepartmentId === null ||
        materialDepartmentId !== userDepartmentId
      ) {
        return {
          authorized: false,
          statusCode: 403,
          message: 'Forbidden: Student cannot access materials belonging to another department.',
        }
      }

      return { authorized: true, statusCode: 200, message: 'Authorized' }
    }

    // 3. Faculty Scope & Ownership Check
    if (isFaculty) {
      const userFacultyId = authUser.facultyId ? Number(authUser.facultyId) : null
      if (action === 'update' || action === 'delete') {
        if (materialCreatedBy !== null && materialCreatedBy !== userId) {
          if (!userFacultyId || materialFacultyId !== userFacultyId) {
            return {
              authorized: false,
              statusCode: 403,
              message: 'Forbidden: You do not own this material.',
            }
          }
        }
      }
      return { authorized: true, statusCode: 200, message: 'Authorized' }
    }

    // 4. Update / Delete Ownership Check
    if (action === 'update' || action === 'delete') {
      if (isInstitute || isSuperAdmin) {
        return { authorized: true, statusCode: 200, message: 'Authorized' }
      }

      if (materialCreatedBy !== null && materialCreatedBy !== userId) {
        return {
          authorized: false,
          statusCode: 403,
          message: 'Forbidden: You do not have permission to modify this material.',
        }
      }
    }

    return { authorized: true, statusCode: 200, message: 'Authorized' }
  }

  private setSecurityHeaders() {
    this.ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    this.ctx.response.header('Cross-Origin-Resource-Policy', 'cross-origin')
    this.ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  }

  private invalidateMaterialCache() {
    apiCacheService.invalidateByPrefix('materials:list:')
    apiCacheService.invalidateByPrefix('materials:one:')
  }

  public async findAll({ searchFor }: { searchFor?: string | null } = {}) {
    try {
      this.setSecurityHeaders()
      const {
        page,
        limit,
        search,
        withDeleted,
        searchFor: searchForQuery,
      } = parseListQuery(this.ctx)

      const authUser = await this.getAuthenticatedUser()
      const effectiveSearchFor = searchForQuery || searchFor || undefined

      let facultyId: number | undefined = undefined
      let instituteId: number | undefined = undefined
      let departmentId: number | undefined = undefined
      let createdBy: number | undefined = undefined

      const rawRole = (
        authUser?.userType ||
        (authUser as any)?.role ||
        (authUser as any)?.roleName ||
        ''
      ).toString().toLowerCase()

      const isStudent = rawRole === 'student'
      const isFaculty = rawRole === 'faculty'

      if (authUser) {
        const rawUserInst =
          authUser.instituteId ??
          (authUser as any).institute_id ??
          authUser.student?.instituteId ??
          authUser.faculty?.instituteId
        if (rawUserInst !== undefined && rawUserInst !== null) {
          instituteId = Number(rawUserInst)
        }
      }

      if (isStudent && authUser) {
        const studentDept =
          (authUser as any).department_id ??
          (authUser as any).departmentId ??
          authUser.student?.departmentId
        if (studentDept) {
          departmentId = Number(studentDept)
        }
      } else if (isFaculty && authUser) {
        if (authUser.facultyId) {
          facultyId = Number(authUser.facultyId)
        }
        createdBy = Number(authUser.id)
      }

      const contentType = this.ctx.request.input('contentType') || this.ctx.request.input('content_type')

      const cacheKey = `materials:list:${JSON.stringify({
        page,
        limit,
        search,
        withDeleted,
        facultyId,
        instituteId,
        departmentId,
        createdBy: isFaculty ? createdBy : undefined,
        contentType,
        searchFor: effectiveSearchFor,
      })}`

      const paginated = await apiCacheService.getOrSet(
        cacheKey,
        30_000,
        async () => {
          return this.materialRepository.list(
            {
              facultyId,
              instituteId,
              departmentId,
              createdBy: (isFaculty && effectiveSearchFor === 'create') ? createdBy : undefined,
              contentType,
              search,
              withDeleted,
              onlyActive: effectiveSearchFor === 'create',
            },
            page,
            limit
          )
        },
        ['materials']
      )

      const materials = paginated.all()
      return {
        status: true,
        success: true,
        messages: materials.length > 0 ? 'Materials fetched successfully' : 'No materials found',
        data: materials,
        meta: {
          total: paginated.total,
          perPage: paginated.perPage,
          currentPage: paginated.currentPage,
          lastPage: paginated.lastPage,
        },
      }
    } catch (error) {
      console.error('FindAll Materials Error:', error)
      return {
        status: false,
        success: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  public async create() {
    try {
      this.setSecurityHeaders()
      const authUser = await this.getAuthenticatedUser()

      if (!authUser) {
        return this.ctx.response.status(401).send({
          status: false,
          success: false,
          message: messages.user_not_authenticated || 'User not authenticated',
        })
      }

      const rawRole = (
        authUser.userType ||
        (authUser as any).role ||
        (authUser as any).roleName ||
        ''
      ).toString().toLowerCase()

      if (rawRole === 'student') {
        return this.ctx.response.status(403).send({
          status: false,
          success: false,
          message: 'Forbidden: Students are not permitted to create materials.',
        })
      }

      const requestData = this.ctx.request.all()
      const validatedData = await createMaterialValidator.validate(requestData)

      // Strict server-side enforcement of institute_id and created_by
      const userInstituteId =
        authUser.instituteId ??
        (authUser as any).institute_id ??
        authUser.faculty?.instituteId
      if (!userInstituteId && rawRole !== 'super_admin') {
        return this.ctx.response.status(403).send({
          status: false,
          success: false,
          message: 'Forbidden: User is not associated with an institute.',
        })
      }

      // Idempotent creation by UUID
      const uuid = validatedData.uuid || requestData.uuid
      if (uuid) {
        const existingByUuid = await this.materialRepository.findByUuid(uuid)
        if (existingByUuid) {
          return {
            status: true,
            success: true,
            messages: 'Material already synchronized',
            data: existingByUuid,
          }
        }
      }

      const material = await this.materialRepository.create({
        uuid: uuid || null,
        title: validatedData.title,
        description: validatedData.description ?? null,
        subject: validatedData.subject ?? null,
        std: validatedData.std ?? null,
        contentType: (validatedData.contentType || validatedData.content_type || 'pdf') as any,
        thumbnailUrl: validatedData.thumbnailUrl || validatedData.thumbnail_url || null,
        contentUrl: validatedData.contentUrl || validatedData.content_url || null,
        durationInSeconds: validatedData.durationInSeconds || validatedData.duration_in_seconds || null,
        textContent: validatedData.textContent || validatedData.text_content || null,
        instituteId: Number(userInstituteId), // Overwritten from authenticated session
        departmentId: validatedData.departmentId || validatedData.department_id || null,
        facultyId: authUser.facultyId ? Number(authUser.facultyId) : (validatedData.facultyId || validatedData.faculty_id || null),
        createdBy: Number(authUser.id), // Overwritten from authenticated session
        updatedBy: Number(authUser.id),
        isActive: validatedData.isActive ?? validatedData.is_active ?? true,
      })

      this.invalidateMaterialCache()

      return this.ctx.response.status(201).send({
        status: true,
        success: true,
        messages: 'Material created successfully',
        data: material,
      })
    } catch (error) {
      return {
        status: false,
        success: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  public async findOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const material = await this.materialRepository.findById(Number(id))
      if (!material) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const access = await this.verifyMaterialAccess(material, 'view')
      if (!access.authorized) {
        return this.ctx.response.status(access.statusCode).send({
          status: false,
          success: false,
          message: access.message,
          data: null,
        })
      }

      return {
        status: true,
        success: true,
        messages: 'Material fetched successfully',
        data: material,
      }
    } catch (error) {
      return {
        status: false,
        success: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  public async updateOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const existingMaterial = await Material.query().where('id', id).whereNull('deleted_at').first()
      if (!existingMaterial) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const access = await this.verifyMaterialAccess(existingMaterial, 'update')
      if (!access.authorized) {
        return this.ctx.response.status(access.statusCode).send({
          status: false,
          success: false,
          message: access.message,
          data: null,
        })
      }

      const requestData = this.ctx.request.all()
      const validatedData = await updateMaterialValidator.validate(requestData)
      const authUser = await this.getAuthenticatedUser()

      // Block any attempt to change institute boundary
      const inputInstitute = validatedData.instituteId || validatedData.institute_id
      if (inputInstitute !== undefined && Number(inputInstitute) !== Number(existingMaterial.instituteId)) {
        return this.ctx.response.status(403).send({
          status: false,
          success: false,
          message: 'Forbidden: You cannot change material institute.',
          data: null,
        })
      }

      const updatePayload: Partial<Material> = {
        title: validatedData.title ?? existingMaterial.title,
        description: validatedData.description !== undefined ? validatedData.description : existingMaterial.description,
        subject: validatedData.subject !== undefined ? validatedData.subject : existingMaterial.subject,
        std: validatedData.std !== undefined ? validatedData.std : existingMaterial.std,
        contentType: (validatedData.contentType || validatedData.content_type || existingMaterial.contentType) as any,
        thumbnailUrl: validatedData.thumbnailUrl || validatedData.thumbnail_url || existingMaterial.thumbnailUrl,
        contentUrl: validatedData.contentUrl || validatedData.content_url || existingMaterial.contentUrl,
        durationInSeconds: validatedData.durationInSeconds || validatedData.duration_in_seconds || existingMaterial.durationInSeconds,
        textContent: validatedData.textContent || validatedData.text_content || existingMaterial.textContent,
        departmentId: validatedData.departmentId || validatedData.department_id || existingMaterial.departmentId,
        updatedBy: authUser ? Number(authUser.id) : existingMaterial.updatedBy,
        isActive: validatedData.isActive ?? validatedData.is_active ?? existingMaterial.isActive,
      }

      existingMaterial.merge(updatePayload)
      await existingMaterial.save()

      this.invalidateMaterialCache()

      await existingMaterial.load('department')
      await existingMaterial.load('institute')
      await existingMaterial.load('faculty')
      await existingMaterial.load('creator')

      return {
        status: true,
        success: true,
        messages: 'Material updated successfully',
        data: existingMaterial,
      }
    } catch (error) {
      return {
        status: false,
        success: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  public async deleteOne() {
    try {
      this.setSecurityHeaders()
      const id = this.ctx.request.param('id')
      if (!id || Number.isNaN(Number(id))) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const material = await Material.query().where('id', id).whereNull('deleted_at').first()
      if (!material) {
        return this.ctx.response.status(404).send({
          status: false,
          success: false,
          message: 'Material not found',
          data: null,
        })
      }

      const access = await this.verifyMaterialAccess(material, 'delete')
      if (!access.authorized) {
        return this.ctx.response.status(access.statusCode).send({
          status: false,
          success: false,
          message: access.message,
          data: null,
        })
      }

      const authUser = await this.getAuthenticatedUser()
      material.deletedAt = DateTime.now()
      material.updatedBy = authUser ? Number(authUser.id) : material.updatedBy
      await material.save()

      this.invalidateMaterialCache()

      return {
        status: true,
        success: true,
        messages: 'Material deleted successfully',
        data: material,
      }
    } catch (error) {
      return {
        status: false,
        success: false,
        messages: messages.common_messages_error,
        error: errorHandler(error),
      }
    }
  }

  public async sync() {
    try {
      this.setSecurityHeaders()
      const authUser = await this.getAuthenticatedUser()

      if (!authUser) {
        return this.ctx.response.status(401).send({
          status: false,
          success: false,
          message: messages.user_not_authenticated || 'User not authenticated',
        })
      }

      const rawRole = (
        authUser.userType ||
        (authUser as any).role ||
        (authUser as any).roleName ||
        ''
      ).toString().toLowerCase()

      const userInstituteId =
        authUser.instituteId ??
        (authUser as any).institute_id ??
        authUser.faculty?.instituteId
      const userDeptId =
        (authUser as any).department_id ??
        (authUser as any).departmentId ??
        authUser.student?.departmentId

      const requestBody = this.ctx.request.all()
      const validated = await syncMaterialsValidator.validate(requestBody)
      const results: Array<{ uuid: string; status: 'synced' | 'failed' | 'rejected'; id?: number; error?: string }> = []

      for (const item of validated.items) {
        const itemUuid = item.uuid
        const action = item.action || 'CREATE'

        try {
          if (action === 'CREATE') {
            // Check for duplicate UUID (Idempotency)
            const existing = await this.materialRepository.findByUuid(itemUuid)
            if (existing) {
              results.push({
                uuid: itemUuid,
                status: 'synced',
                id: existing.id,
              })
              continue
            }

            // Students cannot create materials
            if (rawRole === 'student') {
              results.push({
                uuid: itemUuid,
                status: 'failed',
                error: 'Forbidden: Students are not permitted to create materials.',
              })
              continue
            }

            // Extract payload
            const p = (item.payload || {}) as Record<string, any>
            const title = item.title || p.title || 'Untitled Material'
            const description = item.description || p.description || null
            const subject = item.subject || p.subject || null
            const std = item.std || p.std || null
            const contentType = item.contentType || item.content_type || p.contentType || p.content_type || 'pdf'
            const thumbnailUrl = item.thumbnailUrl || item.thumbnail_url || p.thumbnailUrl || p.thumbnail_url || null
            const contentUrl = item.contentUrl || item.content_url || p.contentUrl || p.content_url || null
            const durationInSeconds = item.durationInSeconds || item.duration_in_seconds || p.durationInSeconds || p.duration_in_seconds || null
            const textContent = item.textContent || item.text_content || p.textContent || p.text_content || null
            const departmentId = item.departmentId || item.department_id || p.departmentId || p.department_id || (rawRole === 'student' ? userDeptId : null)

            // CRITICAL: Overwrite institute_id and created_by with authenticated user's values
            const newMaterial = await this.materialRepository.create({
              uuid: itemUuid,
              title,
              description,
              subject,
              std,
              contentType: contentType as any,
              thumbnailUrl,
              contentUrl,
              durationInSeconds: durationInSeconds ? Number(durationInSeconds) : null,
              textContent,
              instituteId: Number(userInstituteId), // Enforced from server
              departmentId: departmentId ? Number(departmentId) : null,
              facultyId: authUser.facultyId ? Number(authUser.facultyId) : null,
              createdBy: Number(authUser.id), // Enforced from server
              updatedBy: Number(authUser.id),
              isActive: true,
            })

            results.push({
              uuid: itemUuid,
              status: 'synced',
              id: newMaterial.id,
            })
          } else if (action === 'DELETE') {
            const existing = await this.materialRepository.findByUuid(itemUuid)
            if (existing) {
              const access = await this.verifyMaterialAccess(existing, 'delete')
              if (access.authorized) {
                await this.materialRepository.softDelete(existing.id, Number(authUser.id))
                results.push({ uuid: itemUuid, status: 'synced', id: existing.id })
              } else {
                results.push({ uuid: itemUuid, status: 'failed', error: access.message })
              }
            } else {
              results.push({ uuid: itemUuid, status: 'synced' })
            }
          }
        } catch (itemErr: any) {
          results.push({
            uuid: itemUuid,
            status: 'failed',
            error: itemErr.message || 'Sync error',
          })
        }
      }

      this.invalidateMaterialCache()

      return this.ctx.response.status(200).send({
        status: true,
        success: true,
        message: 'Material bulk sync processed',
        results,
      })
    } catch (error) {
      return this.ctx.response.status(400).send({
        status: false,
        success: false,
        message: 'Sync validation failed',
        error: errorHandler(error),
      })
    }
  }
}
