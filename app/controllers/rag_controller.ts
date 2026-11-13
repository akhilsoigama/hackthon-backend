import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RagService, { CourseData } from '#services/rag_service'
import { PermissionKeys } from '#database/constants/permission'
import User from '#models/user'

@inject()
export default class RagController {
  constructor(private ragService: RagService) {}

  private async resolveUser(ctx: HttpContext) {
    const anyCtx = ctx as any
    if (anyCtx.authUser) return anyCtx.authUser as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }
    if (anyCtx.user) return anyCtx.user as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }
    if (ctx.request && (ctx.request as any).user) return (ctx.request as any).user as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }
    if (ctx.auth?.user) return ctx.auth.user as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }

    try {
      const adminAuth = ctx.auth.use('adminapi')
      if (await adminAuth.check()) {
        return adminAuth.user as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }
      }
    } catch {}

    try {
      const apiAuth = ctx.auth.use('api')
      if (await apiAuth.check()) {
        return apiAuth.user as { id?: number; instituteId?: number | null; userType?: string; isAdmin?: boolean; authType?: string; roles?: string[] }
      }
    } catch {}

    return undefined
  }

  private isSuperAdminUser(user: any): boolean {
    if (!user) return false
    const uType = user.userType || user.user_type
    const aType = user.authType || user.auth_type
    const isAdmin = Boolean(user.isAdmin || user.is_admin)

    return (
      isAdmin ||
      uType === 'super_admin' ||
      uType === 'admin' ||
      uType === 'system_admin' ||
      aType === 'admin' ||
      aType === 'super_admin' ||
      (Array.isArray(user.roles) && user.roles.some((r: string) => ['super_admin', 'admin', 'system_admin'].includes(r)))
    )
  }

  /**
   * Generic document chunk ingestion (backward compatible)
   */
  public async ingest(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = request.only(['title', 'content', 'sourceType', 'sourceId', 'metadata'])

    if (typeof payload.title !== 'string' || !payload.title.trim()) {
      return response.badRequest({ success: false, message: 'title is required' })
    }
    if (typeof payload.content !== 'string' || !payload.content.trim()) {
      return response.badRequest({ success: false, message: 'content is required' })
    }

    const user = await this.resolveUser(ctx)
    try {
      const result = await this.ragService.ingest({
        title: payload.title.trim(),
        content: payload.content,
        sourceType: typeof payload.sourceType === 'string' ? payload.sourceType : 'module',
        sourceId: typeof payload.sourceId === 'number' ? payload.sourceId : null,
        instituteId: user?.instituteId ?? null,
        metadata:
          typeof payload.metadata === 'object' && payload.metadata !== null
            ? (payload.metadata as Record<string, unknown>)
            : undefined,
      })

      return response.created({ success: true, ...result })
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'RAG ingestion failed',
      })
    }
  }

  /**
   * Create course and vectorize its contents
   * POST /api/rag/course or POST /rag/course
   */
  public async createCourse(ctx: HttpContext) {
    const { request, response } = ctx
    const body = request.body() as Partial<CourseData>

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return response.badRequest({ success: false, message: 'Course title is required' })
    }
    if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
      return response.badRequest({ success: false, message: 'Course category is required' })
    }
    if (!body.videoUrl || typeof body.videoUrl !== 'string' || !body.videoUrl.trim()) {
      return response.badRequest({ success: false, message: 'Course videoUrl is required' })
    }

    const user = await this.resolveUser(ctx)
    if (!this.isSuperAdminUser(user)) {
      return response.forbidden({
        success: false,
        message: 'Access denied: Only Super Admin is authorized to add RAG courses',
      })
    }

    try {
      const course = await this.ragService.ingestCourse(
        {
          title: body.title.trim(),
          category: body.category.trim(),
          subCategory: body.subCategory?.trim(),
          description: body.description?.trim() || '',
          tags: Array.isArray(body.tags) ? body.tags : [],
          videoType: body.videoType === 'uploaded' ? 'uploaded' : 'youtube',
          videoUrl: body.videoUrl.trim(),
          subModules: Array.isArray(body.subModules) ? body.subModules : [],
        },
        user
      )

      return response.created(course)
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create and index course',
      })
    }
  }

  /**
   * Search courses (Semantic & Lexical)
   * POST /api/rag/query or POST /rag/query
   */
  public async queryCourses(ctx: HttpContext) {
    const { request, response } = ctx
    const { query, category, subCategory, top_k, page } = request.only([
      'query',
      'category',
      'subCategory',
      'top_k',
      'page',
    ])
    const user = await this.resolveUser(ctx)

    try {
      const courses = await this.ragService.queryCourses({
        query: typeof query === 'string' ? query : '',
        category: typeof category === 'string' ? category : undefined,
        subCategory: typeof subCategory === 'string' ? subCategory : undefined,
        instituteId: user?.instituteId ?? null,
        top_k: typeof top_k === 'number' ? top_k : 10,
        page: typeof page === 'number' ? page : 0,
      })

      return response.json(courses)
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute course search',
      })
    }
  }

  /**
   * List courses with optional filters
   * GET /api/rag/courses or GET /rag/courses
   */
  public async listCourses(ctx: HttpContext) {
    const { request, response } = ctx
    const { category, subCategory, limit, page, query } = request.qs()
    const user = await this.resolveUser(ctx)

    try {
      const courses = await this.ragService.listCourses({
        category: typeof category === 'string' ? category : undefined,
        subCategory: typeof subCategory === 'string' ? subCategory : undefined,
        query: typeof query === 'string' ? query : undefined,
        instituteId: user?.instituteId ?? null,
        limit: limit ? Number(limit) : 50,
        page: page ? Number(page) : 0,
      })

      return response.json(courses)
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list courses',
      })
    }
  }

  /**
   * Get single course by ID
   * GET /api/rag/courses/:id or GET /rag/courses/:id
   */
  public async showCourse({ params, response }: HttpContext) {
    try {
      const course = await this.ragService.getCourse(params.id)
      if (!course) {
        return response.notFound({ success: false, message: 'Course not found' })
      }
      return response.json(course)
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch course',
      })
    }
  }

  /**
   * Update course by ID
   * PUT /api/rag/courses/:id or PUT /rag/courses/:id
   */
  public async updateCourse(ctx: HttpContext) {
    const { params, request, response } = ctx
    const user = await this.resolveUser(ctx)
    if (!this.isSuperAdminUser(user)) {
      return response.forbidden({
        success: false,
        message: 'Access denied: Only Super Admin is authorized to edit RAG courses',
      })
    }
    const body = request.body() as Partial<CourseData>

    try {
      const updated = await this.ragService.updateCourse(params.id, body, user)
      return response.json({ success: true, data: updated })
    } catch (error: unknown) {
      return response.badRequest({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update course',
      })
    }
  }

  /**
   * Delete course by ID
   * DELETE /api/rag/courses/:id or DELETE /rag/courses/:id
   */
  public async deleteCourse(ctx: HttpContext) {
    const { params, response } = ctx
    const user = await this.resolveUser(ctx)
    if (!this.isSuperAdminUser(user)) {
      return response.forbidden({
        success: false,
        message: 'Access denied: Only Super Admin is authorized to delete RAG courses',
      })
    }

    try {
      const result = await this.ragService.deleteCourse(params.id)
      return response.json(result)
    } catch (error: unknown) {
      return response.badRequest({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete course',
      })
    }
  }

  /**
   * Sync LMS resources (study materials & lectures) into RAG vector index
   * POST /api/rag/sync or POST /rag/sync
   */
  public async syncLms(ctx: HttpContext) {
    const { request, response } = ctx
    const user = await this.resolveUser(ctx)
    if (!this.isSuperAdminUser(user)) {
      return response.forbidden({
        success: false,
        message: 'Access denied: Only Super Admin is authorized to sync LMS RAG index',
      })
    }
    const { target } = request.only(['target']) // 'materials' | 'lectures' | 'all'

    try {
      let materialsCount = 0
      let lecturesCount = 0

      if (!target || target === 'materials' || target === 'all') {
        const matRes = await this.ragService.syncMaterials(user?.instituteId)
        materialsCount = matRes.indexed
      }
      if (!target || target === 'lectures' || target === 'all') {
        const lecRes = await this.ragService.syncLectures(user?.instituteId)
        lecturesCount = lecRes.indexed
      }

      return response.json({
        success: true,
        indexedMaterials: materialsCount,
        indexedLectures: lecturesCount,
      })
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync LMS resources',
      })
    }
  }

  /**
   * Get RAG stats
   * GET /api/rag/stats or GET /rag/stats
   */
  public async stats({ response }: HttpContext) {
    try {
      const stats = await this.ragService.getStats()
      return response.json({ success: true, ...stats })
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch RAG stats',
      })
    }
  }

  /**
   * Generate interactive quiz using YouTube metadata and RAG context
   * POST /api/rag/generate-quiz or POST /rag/generate-quiz
   */
  public async generateQuiz(ctx: HttpContext) {
    const { auth, request, response } = ctx

    // Support all ways user is injected by AuthMiddleware or Adonis auth guards
    const user =
      ((ctx as unknown & { user?: User; authUser?: User }).user ||
      (ctx as unknown & { user?: User; authUser?: User }).authUser ||
      (ctx.request as unknown & { user?: User }).user ||
      auth.user ||
      (await this.resolveUser(ctx))) as (User & { id?: number; userType?: string }) | undefined

    if (!user?.id) {
      return response.unauthorized({ success: false, message: 'User not authenticated' })
    }

    const isAdmin =
      user.userType && ['super_admin', 'admin', 'system_admin'].includes(user.userType)
    const allowed =
      isAdmin ||
      (await User.hasPermission(user.id, PermissionKeys.SKILL_RAG_ACCESS).catch(() => false))

    if (!allowed) {
      return response.forbidden({
        success: false,
        message: 'You do not have permission to access this resource',
      })
    }

    const body = request.only([
      'videoUrl',
      'courseId',
      'title',
      'description',
      'category',
      'subModules',
      'numQuestions',
    ])

    try {
      const result = await this.ragService.generateQuizFromYoutubeAndRag(body)
      return response.json(result)
    } catch (error: unknown) {
      return response.internalServerError({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate quiz',
      })
    }
  }
}