import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export type RagMatch = {
  title: string
  content: string
  sourceType: string
  sourceId: number | null
  distance: number
}

export interface CourseSubModuleVideo {
  title: string
  videoType: 'youtube' | 'uploaded'
  videoUrl: string
  duration?: string
}

export interface CourseSubModule {
  title: string
  description?: string
  videos: CourseSubModuleVideo[]
}

export interface CourseData {
  id?: number | string
  title: string
  category: string
  subCategory?: string
  description: string
  tags?: string[]
  videoType?: 'youtube' | 'uploaded'
  videoUrl: string
  subModules?: CourseSubModule[]
  instituteId?: number | null
  createdBy?: number | null
}

export interface CourseResult {
  id: string
  title: string
  category: string
  subCategory?: string
  description: string
  tags: string[]
  videoType?: 'youtube' | 'uploaded'
  videoUrl?: string
  subModules?: CourseSubModule[]
  relevanceScore?: number
}

export default class RagService {
  private readonly embeddingDimensions = 1536
  private readonly databaseTimeoutMs = 15_000
  private readonly embeddingCache = new Map<string, number[]>()
  private readonly maxCacheSize = 500

  /**
   * Generic document ingestion for any source (module, course, material, lecture)
   */
  public async ingest(input: {
    title: string
    content: string
    sourceType?: string
    sourceId?: number | null
    instituteId?: number | null
    metadata?: Record<string, unknown>
  }) {
    const chunks = this.chunk(input.content)
    if (!chunks.length) throw new Error('Content must contain at least one non-empty chunk')

    const embeddings = await Promise.all(chunks.map((chunk) => this.embed(chunk)))
    const trx = await this.withTimeout(
      db.transaction(),
      this.databaseTimeoutMs,
      'RAG database connection timed out after 15 seconds'
    )

    try {
      await trx.rawQuery(`SET LOCAL statement_timeout = '${this.databaseTimeoutMs}ms'`)

      const deleteQuery = trx
        .from('rag_documents')
        .where('source_type', input.sourceType ?? 'module')
      if (input.sourceId !== undefined && input.sourceId !== null) {
        deleteQuery.where('source_id', input.sourceId)
      }
      await deleteQuery.delete()

      for (const [index, chunk] of chunks.entries()) {
        await trx.table('rag_documents').insert({
          source_type: input.sourceType ?? 'module',
          source_id: input.sourceId ?? null,
          institute_id: input.instituteId ?? null,
          title: input.title,
          content: chunk,
          chunk_index: index,
          embedding: this.toVector(embeddings[index]),
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        })
      }

      await trx.commit()
      return { chunks: chunks.length }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Ingest a full course entity into rag_courses and index chunks into rag_documents
   */
  public async ingestCourse(
    course: CourseData,
    user?: { id?: number | null; instituteId?: number | null }
  ): Promise<CourseResult> {
    const title = course.title?.trim()
    if (!title) throw new Error('Course title is required')
    const category = course.category?.trim()
    if (!category) throw new Error('Course category is required')
    const videoUrl = this.cleanVideoUrl(course.videoUrl)
    if (!videoUrl) throw new Error('Course videoUrl is required')

    const tags = Array.isArray(course.tags) ? course.tags.map((t) => String(t).trim()).filter(Boolean) : []
    const rawSubModules = Array.isArray(course.subModules) ? course.subModules : []
    const subModules = rawSubModules.map((sm) => ({
      ...sm,
      videos: Array.isArray(sm.videos)
        ? sm.videos.map((v) => ({
          ...v,
          videoUrl: this.cleanVideoUrl(v.videoUrl),
        }))
        : [],
    }))
    const instituteId = course.instituteId ?? user?.instituteId ?? null
    const createdBy = course.createdBy ?? user?.id ?? null

    const trx = await this.withTimeout(
      db.transaction(),
      this.databaseTimeoutMs,
      'RAG database connection timed out after 15 seconds'
    )

    let courseId: number
    try {
      await trx.rawQuery(`SET LOCAL statement_timeout = '${this.databaseTimeoutMs}ms'`)

      // Insert course record into rag_courses
      const inserted = await trx
        .table('rag_courses')
        .insert({
          title,
          category,
          sub_category: course.subCategory?.trim() || null,
          description: course.description?.trim() || '',
          tags: JSON.stringify(tags),
          video_type: course.videoType ?? 'youtube',
          video_url: videoUrl,
          sub_modules: JSON.stringify(subModules),
          institute_id: instituteId,
          created_by: createdBy,
        })
        .returning('id')

      courseId = inserted[0]?.id ?? inserted[0]

      // Build hierarchical chunks for vector indexing
      const chunksToIndex: Array<{ title: string; content: string; metadata: Record<string, unknown> }> = []

      // 1. Course overview chunk
      const overviewContent = [
        `Course: ${title}`,
        `Category: ${category}${course.subCategory ? ` / ${course.subCategory}` : ''}`,
        `Description: ${course.description || ''}`,
        tags.length ? `Tags: ${tags.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      chunksToIndex.push({
        title,
        content: overviewContent,
        metadata: { courseId, title, category, subCategory: course.subCategory, tags },
      })

      // 2. Submodule & video chunks
      for (const [modIdx, sm] of subModules.entries()) {
        const videoTitles = sm.videos?.map((v) => v.title).filter(Boolean) || []
        const modContent = [
          `Course: ${title} - Module ${modIdx + 1}: ${sm.title}`,
          sm.description ? `Module Description: ${sm.description}` : '',
          videoTitles.length ? `Lessons: ${videoTitles.join('; ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')

        chunksToIndex.push({
          title: `${title} - ${sm.title}`,
          content: modContent,
          metadata: { courseId, moduleIndex: modIdx, moduleTitle: sm.title },
        })
      }

      // Generate embeddings
      const embeddings = await Promise.all(chunksToIndex.map((c) => this.embed(c.content)))

      // Clean old chunks if any exist for this course
      await trx
        .from('rag_documents')
        .where('source_type', 'course')
        .where('source_id', courseId)
        .delete()

      for (const [index, chunkItem] of chunksToIndex.entries()) {
        await trx.table('rag_documents').insert({
          source_type: 'course',
          source_id: courseId,
          institute_id: instituteId,
          title: chunkItem.title,
          content: chunkItem.content,
          chunk_index: index,
          embedding: this.toVector(embeddings[index]),
          metadata: JSON.stringify(chunkItem.metadata),
        })
      }

      await trx.commit()

      return {
        id: String(courseId),
        title,
        category,
        subCategory: course.subCategory?.trim() || undefined,
        description: course.description?.trim() || '',
        tags,
        videoType: course.videoType ?? 'youtube',
        videoUrl,
        subModules,
        relevanceScore: 1.0,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Update an existing course and re-index its vector chunks
   */
  public async updateCourse(
    courseIdParam: number | string,
    course: Partial<CourseData>,
    user?: { id?: number; instituteId?: number | null }
  ): Promise<CourseResult> {
    const courseId = Number(courseIdParam)
    if (Number.isNaN(courseId)) throw new Error('Invalid course ID')

    const trx = await this.withTimeout(
      db.transaction(),
      this.databaseTimeoutMs,
      'RAG database connection timed out after 15 seconds'
    )

    try {
      await trx.rawQuery(`SET LOCAL statement_timeout = '${this.databaseTimeoutMs}ms'`)

      let selectQuery = trx.from('rag_courses').where('id', courseId)
      if (user?.instituteId !== undefined && user?.instituteId !== null) {
        selectQuery = selectQuery.where('institute_id', user.instituteId)
      }
      const existing = await selectQuery.first()
      if (!existing) {
        throw new Error('Course not found or access denied')
      }

      const title = course.title !== undefined ? course.title.trim() : existing.title
      const category = course.category !== undefined ? course.category.trim() : existing.category
      const subCategory = course.subCategory !== undefined ? course.subCategory?.trim() : existing.sub_category
      const description = course.description !== undefined ? course.description.trim() : existing.description
      const tags = course.tags !== undefined ? (Array.isArray(course.tags) ? course.tags : []) : (existing.tags || [])
      const videoType = course.videoType !== undefined ? course.videoType : existing.video_type
      const videoUrl = course.videoUrl !== undefined ? this.cleanVideoUrl(course.videoUrl) : existing.video_url
      const subModules = course.subModules !== undefined ? (Array.isArray(course.subModules) ? course.subModules : []) : (existing.sub_modules || [])

      await trx
        .from('rag_courses')
        .where('id', courseId)
        .update({
          title,
          category,
          sub_category: subCategory || null,
          description,
          tags: JSON.stringify(tags),
          video_type: videoType,
          video_url: videoUrl,
          sub_modules: JSON.stringify(subModules),
          updated_at: new Date(),
        })

      // Re-index vector chunks
      const chunksToIndex: Array<{
        title: string
        content: string
        metadata: Record<string, unknown>
      }> = []

      // 1. Overview chunk
      const overviewContent = [
        `Course Title: ${title}`,
        `Category: ${category}`,
        subCategory ? `Sub-Category: ${subCategory}` : '',
        description ? `Description: ${description}` : '',
        tags.length ? `Tags: ${tags.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      chunksToIndex.push({
        title,
        content: overviewContent,
        metadata: { courseId, title, category, subCategory, tags },
      })

      // 2. Submodule & video chunks
      for (const [modIdx, sm] of subModules.entries()) {
        const videoTitles = sm.videos?.map((v: { title: string }) => v.title).filter(Boolean) || []
        const modContent = [
          `Course: ${title} - Module ${modIdx + 1}: ${sm.title}`,
          sm.description ? `Module Description: ${sm.description}` : '',
          videoTitles.length ? `Lessons: ${videoTitles.join('; ')}` : '',
        ]
          .filter(Boolean)
          .join('\n')

        chunksToIndex.push({
          title: `${title} - ${sm.title}`,
          content: modContent,
          metadata: { courseId, moduleIndex: modIdx, moduleTitle: sm.title },
        })
      }

      // Generate embeddings
      const embeddings = await Promise.all(chunksToIndex.map((c) => this.embed(c.content)))

      // Clean old chunks
      await trx
        .from('rag_documents')
        .where('source_type', 'course')
        .where('source_id', courseId)
        .delete()

      for (const [index, chunkItem] of chunksToIndex.entries()) {
        await trx.table('rag_documents').insert({
          source_type: 'course',
          source_id: courseId,
          institute_id: existing.institute_id,
          title: chunkItem.title,
          content: chunkItem.content,
          chunk_index: index,
          embedding: this.toVector(embeddings[index]),
          metadata: JSON.stringify(chunkItem.metadata),
        })
      }

      await trx.commit()

      return {
        id: String(courseId),
        title,
        category,
        subCategory: subCategory || undefined,
        description,
        tags,
        videoType,
        videoUrl,
        subModules,
        relevanceScore: 1.0,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Search courses using hybrid semantic + lexical search
   */
  public async queryCourses(params: {
    query?: string
    category?: string
    subCategory?: string
    instituteId?: number | null
    top_k?: number
    page?: number
  }): Promise<CourseResult[]> {
    const query = (params.query ?? '').trim()
    const limit = Math.max(1, Math.min(params.top_k ?? 10, 50))
    const offset = Math.max(0, (params.page ?? 0) * limit)
    const category = (params.category ?? '').trim()
    const subCategory = (params.subCategory ?? '').trim()
    const instituteId = params.instituteId ?? null

    // If query is empty, return recent courses ordered by creation date
    if (!query) {
      let qb = db.from('rag_courses').select('*')
      if (category) {
        qb = qb.whereILike('category', category)
      }
      if (subCategory) {
        qb = qb.whereILike('sub_category', subCategory)
      }
      if (instituteId !== null) {
        qb = qb.where((builder) => {
          builder.where('institute_id', instituteId).orWhereNull('institute_id')
        })
      }
      const rows = await qb.orderBy('created_at', 'desc').limit(limit).offset(offset)
      return rows.map((row) => this.mapCourseRowToResult(row, 1.0))
    }

    // When query is non-empty: perform Hybrid Search (Vector + Lexical)
    const embedding = await this.embed(query)
    const vector = this.toVector(embedding)

    // 1. Vector Search on course document chunks
    const vectorSql = `
      SELECT source_id AS course_id,
             MIN(embedding <=> ?::vector) AS min_dist,
             MAX(1 - (embedding <=> ?::vector)) AS vector_score
      FROM rag_documents
      WHERE source_type = 'course'
        AND (?::int IS NULL OR institute_id = ?::int OR institute_id IS NULL)
      GROUP BY source_id
      ORDER BY min_dist ASC
      LIMIT ?
    `
    const vectorResult = await db.rawQuery(vectorSql, [
      vector,
      vector,
      instituteId,
      instituteId,
      limit * 2,
    ])

    const vectorScores = new Map<number, number>()
    for (const r of vectorResult.rows || []) {
      const courseId = Number(r.course_id)
      const score = Math.max(0, Math.min(Number(r.vector_score || 0), 1))
      vectorScores.set(courseId, score)
    }

    // 2. Lexical keyword matching on rag_courses
    let lexicalQb = db
      .from('rag_courses')
      .select('id')
      .where((builder) => {
        builder
          .whereILike('title', `%${query}%`)
          .orWhereILike('description', `%${query}%`)
          .orWhereILike('category', `%${query}%`)
          .orWhereILike('sub_category', `%${query}%`)
          .orWhereRaw(`tags::text ILIKE ?`, [`%${query}%`])
      })

    if (category) {
      lexicalQb = lexicalQb.whereILike('category', category)
    }
    if (instituteId !== null) {
      lexicalQb = lexicalQb.where((builder) => {
        builder.where('institute_id', instituteId).orWhereNull('institute_id')
      })
    }
    const lexicalMatches = await lexicalQb.limit(limit * 2)
    const lexicalCourseIds = new Set(lexicalMatches.map((m: { id: number }) => Number(m.id)))

    // 3. Combine unique candidate course IDs and compute weighted relevance scores
    const candidateIds = new Set<number>([
      ...Array.from(vectorScores.keys()),
      ...Array.from(lexicalCourseIds.values()),
    ])

    if (candidateIds.size === 0) {
      return []
    }

    // Fetch full course details for candidates
    const courses = await db
      .from('rag_courses')
      .whereIn('id', Array.from(candidateIds))
      .select('*')

    const scoredCourses: Array<{ row: Record<string, unknown>; score: number }> = []

    for (const courseRow of courses) {
      const cId = Number(courseRow.id)

      // Category filter verification
      if (category && String(courseRow.category).toLowerCase() !== category.toLowerCase()) {
        continue
      }
      // Sub-category filter verification
      if (
        subCategory &&
        String(courseRow.sub_category || '').toLowerCase() !== subCategory.toLowerCase()
      ) {
        continue
      }
      // Institute filter verification
      if (
        instituteId !== null &&
        courseRow.institute_id !== null &&
        Number(courseRow.institute_id) !== instituteId
      ) {
        continue
      }

      const vecScore = vectorScores.get(cId) ?? 0.0
      const hasLexical = lexicalCourseIds.has(cId)
      const lexScore = hasLexical ? 0.9 : 0.0

      // Exact title match bonus
      const titleBonus =
        String(courseRow.title).toLowerCase().includes(query.toLowerCase()) ? 0.15 : 0.0

      // Weighted score
      const combinedScore = Math.min(1.0, Math.max(0.1, 0.65 * vecScore + 0.35 * lexScore + titleBonus))

      scoredCourses.push({
        row: courseRow,
        score: Math.round(combinedScore * 100) / 100,
      })
    }

    // Sort by combined score descending
    scoredCourses.sort((a, b) => b.score - a.score)

    // Slice for pagination
    const paged = scoredCourses.slice(offset, offset + limit)
    return paged.map((item) => this.mapCourseRowToResult(item.row, item.score))
  }

  /**
   * List courses with optional filters and pagination
   */
  public async listCourses(params: {
    category?: string
    subCategory?: string
    query?: string
    instituteId?: number | null
    limit?: number
    page?: number
  }) {
    const limit = Math.max(1, Math.min(params.limit ?? 50, 100))
    const offset = Math.max(0, (params.page ?? 0) * limit)

    let qb = db.from('rag_courses').select('*')
    if (params.category) {
      const cat = params.category.trim()
      const catHyphen = cat.replace(/\s+/g, '-')
      const catSpace = cat.replace(/-/g, ' ')
      qb = qb.where((builder) => {
        builder
          .whereILike('category', cat)
          .orWhereILike('category', catHyphen)
          .orWhereILike('category', catSpace)
      })
    }
    if (params.subCategory) {
      const sub = params.subCategory.trim()
      const subHyphen = sub.replace(/\s+/g, '-')
      const subSpace = sub.replace(/-/g, ' ')
      qb = qb.where((builder) => {
        builder
          .whereILike('sub_category', sub)
          .orWhereILike('sub_category', subHyphen)
          .orWhereILike('sub_category', subSpace)
      })
    }
    if (params.query && params.query.trim()) {
      const q = `%${params.query.trim()}%`
      qb = qb.where((builder) => {
        builder.whereILike('title', q).orWhereILike('description', q)
      })
    }
    if (params.instituteId !== undefined && params.instituteId !== null) {
      const targetInstituteId = params.instituteId
      qb = qb.where((builder) => {
        builder.where('institute_id', targetInstituteId).orWhereNull('institute_id')
      })
    }

    const rows = await qb.orderBy('created_at', 'desc').limit(limit).offset(offset)
    return rows.map((r) => this.mapCourseRowToResult(r))
  }

  /**
   * Get course by ID
   */
  public async getCourse(id: number | string): Promise<CourseResult | null> {
    const courseId = Number(id)
    if (Number.isNaN(courseId)) return null

    const row = await db.from('rag_courses').where('id', courseId).first()
    if (!row) return null
    return this.mapCourseRowToResult(row)
  }

  /**
   * Delete course and its indexed document chunks
   */
  public async deleteCourse(
    id: number | string,
    instituteId?: number | null
  ): Promise<{ success: boolean; id: number }> {
    const courseId = Number(id)
    if (Number.isNaN(courseId)) throw new Error('Invalid course ID')

    const trx = await this.withTimeout(
      db.transaction(),
      this.databaseTimeoutMs,
      'RAG database connection timed out after 15 seconds'
    )

    try {
      await trx.rawQuery(`SET LOCAL statement_timeout = '${this.databaseTimeoutMs}ms'`)

      let courseQuery = trx.from('rag_courses').where('id', courseId)
      if (instituteId !== undefined && instituteId !== null) {
        courseQuery = courseQuery.where('institute_id', instituteId)
      }
      const deletedCount = await courseQuery.delete()
      if (!deletedCount) {
        throw new Error('Course not found or access denied')
      }

      await trx
        .from('rag_documents')
        .where('source_type', 'course')
        .where('source_id', courseId)
        .delete()

      await trx.commit()
      return { success: true, id: courseId }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Backward compatible retrieval for chatbot context
   */
  public async retrieve(query: string, instituteId?: number | null, limit = 5): Promise<RagMatch[]> {
    if (!query.trim()) return []

    try {
      const embedding = await this.embed(query)
      const vector = this.toVector(embedding)
      const result = await db.rawQuery(
        `SELECT title, content, source_type AS "sourceType", source_id AS "sourceId",
          embedding <=> ?::vector AS distance
         FROM rag_documents
         WHERE (?::int IS NULL OR institute_id = ?::int OR institute_id IS NULL)
         ORDER BY embedding <=> ?::vector
         LIMIT ?`,
        [vector, instituteId ?? null, instituteId ?? null, vector, limit]
      )

      return result.rows as RagMatch[]
    } catch {
      return []
    }
  }

  /**
   * Sync LMS study materials into RAG documents index
   */
  public async syncMaterials(instituteId?: number | null): Promise<{ indexed: number }> {
    let qb = db
      .from('materials')
      .select('id', 'title', 'description', 'subject', 'text_content', 'institute_id')
      .where('is_active', true)
      .whereNull('deleted_at')

    if (instituteId !== undefined && instituteId !== null) {
      qb = qb.where('institute_id', instituteId)
    }

    const materials = await qb.limit(500)
    let count = 0

    for (const mat of materials) {
      const fullText = [
        `Study Material: ${mat.title}`,
        mat.subject ? `Subject: ${mat.subject}` : '',
        mat.description ? `Description: ${mat.description}` : '',
        mat.text_content ? `Content: ${mat.text_content}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      if (!fullText.trim()) continue

      await this.ingest({
        title: mat.title,
        content: fullText,
        sourceType: 'material',
        sourceId: mat.id,
        instituteId: mat.institute_id,
        metadata: { materialId: mat.id, subject: mat.subject },
      })
      count++
    }

    return { indexed: count }
  }

  /**
   * Sync LMS lectures into RAG documents index
   */
  public async syncLectures(instituteId?: number | null): Promise<{ indexed: number }> {
    let qb = db
      .from('lacture_uploads')
      .select(
        'id',
        'title',
        'description',
        'subject',
        'text_content',
        'chapter_topic',
        'learning_objectives'
      )
      .whereNull('deleted_at')

    const lectures = await qb.limit(500)
    let count = 0

    for (const lec of lectures) {
      const fullText = [
        `Lecture: ${lec.title}`,
        lec.subject ? `Subject: ${lec.subject}` : '',
        lec.chapter_topic ? `Topic: ${lec.chapter_topic}` : '',
        lec.learning_objectives ? `Objectives: ${lec.learning_objectives}` : '',
        lec.description ? `Description: ${lec.description}` : '',
        lec.text_content ? `Content: ${lec.text_content}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      if (!fullText.trim()) continue

      await this.ingest({
        title: lec.title,
        content: fullText,
        sourceType: 'lecture',
        sourceId: lec.id,
        instituteId,
        metadata: { lectureId: lec.id, subject: lec.subject, topic: lec.chapter_topic },
      })
      count++
    }

    return { indexed: count }
  }

  /**
   * Return index statistics
   */
  public async getStats() {
    const courseCountResult = await db.from('rag_courses').count('* as total')
    const totalCourses = Number(courseCountResult[0]?.total ?? 0)

    const docCounts = await db
      .from('rag_documents')
      .groupBy('source_type')
      .select('source_type')
      .count('* as count')

    const documentsByType: Record<string, number> = {}
    let totalDocuments = 0
    for (const row of docCounts) {
      const count = Number(row.count)
      documentsByType[String(row.source_type)] = count
      totalDocuments += count
    }

    return {
      totalCourses,
      totalDocuments,
      documentsByType,
      embeddingDimensions: this.embeddingDimensions,
      hasExternalApiKey: Boolean(env.get('EMBEDDING_API_KEY', '')),
    }
  }

  /**
   * Multi-provider embedding generator with robust local fallback
   */
  public async embed(text: string): Promise<number[]> {
    const cacheKey = text.trim()
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!
    }

    const apiKey = env.get('EMBEDDING_API_KEY', '')
    if (apiKey) {
      try {
        const externalEmbedding = await this.embedExternal(text, apiKey)
        if (externalEmbedding && externalEmbedding.length === this.embeddingDimensions) {
          this.setCache(cacheKey, externalEmbedding)
          return externalEmbedding
        }
      } catch {
        // External provider failed or returned invalid dimensions; fall back gracefully
      }
    }

    // Deterministic unit-vector fallback embedder
    const fallback = this.generateFallbackEmbedding(text)
    this.setCache(cacheKey, fallback)
    return fallback
  }

  private async embedExternal(text: string, apiKey: string): Promise<number[]> {
    const model = env.get('EMBEDDING_MODEL', 'text-embedding-3-small')
    const isGemini = model.startsWith('gemini') || model.includes('text-embedding-004')
    const defaultUrl = isGemini
      ? 'https://generativelanguage.googleapis.com/v1beta/models'
      : 'https://api.openai.com/v1/embeddings'
    const endpoint = isGemini
      ? `${env.get('EMBEDDING_API_URL', defaultUrl)}/${model}:embedContent?key=${encodeURIComponent(apiKey)}`
      : env.get('EMBEDDING_API_URL', defaultUrl)

    const requestBody = isGemini
      ? {
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: this.embeddingDimensions,
      }
      : {
        model,
        input: text,
      }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isGemini ? {} : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`Embedding API responded with status ${response.status}`)
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>
      embedding?: { values?: number[] }
    }

    const embedding = isGemini ? payload.embedding?.values : payload.data?.[0]?.embedding
    if (!embedding || embedding.length !== this.embeddingDimensions) {
      throw new Error(`Unexpected embedding dimension: ${embedding?.length}`)
    }
    return embedding
  }

  /**
   * Deterministic, normalized 1536-dimensional feature hashing embedder.
   * Produces smooth cosine similarities for matching tokens and subwords.
   */
  public generateFallbackEmbedding(text: string): number[] {
    const vector = new Float64Array(this.embeddingDimensions)
    const normalized = text.toLowerCase().trim()
    if (!normalized) {
      vector[0] = 1.0
      return Array.from(vector)
    }

    // Extract word tokens and character 3-grams
    const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)
    const features: string[] = [...tokens]

    for (let i = 0; i <= normalized.length - 3; i++) {
      features.push(normalized.substring(i, i + 3))
    }

    // Feature hashing (signed FNV-1a)
    for (const feature of features) {
      let hash = 0x811c9dc5
      for (let i = 0; i < feature.length; i++) {
        hash ^= feature.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
      }
      const positiveHash = hash >>> 0
      const index = positiveHash % this.embeddingDimensions
      const sign = (positiveHash & 0x80000000) === 0 ? 1 : -1
      vector[index] += sign
    }

    // Compute Euclidean L2 norm and normalize
    let norm = 0
    for (let i = 0; i < this.embeddingDimensions; i++) {
      norm += vector[i] * vector[i]
    }
    norm = Math.sqrt(norm)

    if (norm > 0) {
      for (let i = 0; i < this.embeddingDimensions; i++) {
        vector[i] = Number((vector[i] / norm).toFixed(7))
      }
    } else {
      vector[0] = 1.0
    }

    return Array.from(vector)
  }

  private setCache(key: string, vector: number[]) {
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value
      if (firstKey) this.embeddingCache.delete(firstKey)
    }
    this.embeddingCache.set(key, vector)
  }

  private mapCourseRowToResult(row: Record<string, unknown>, relevanceScore?: number): CourseResult {
    let tags: string[] = []
    if (typeof row.tags === 'string') {
      try {
        tags = JSON.parse(row.tags)
      } catch {
        tags = []
      }
    } else if (Array.isArray(row.tags)) {
      tags = row.tags
    }

    let subModules: CourseSubModule[] = []
    if (typeof row.sub_modules === 'string') {
      try {
        subModules = JSON.parse(row.sub_modules)
      } catch {
        subModules = []
      }
    } else if (Array.isArray(row.sub_modules)) {
      subModules = row.sub_modules as CourseSubModule[]
    }

    return {
      id: String(row.id),
      title: String(row.title || ''),
      category: String(row.category || ''),
      subCategory: row.sub_category ? String(row.sub_category) : undefined,
      description: String(row.description || ''),
      tags,
      videoType: (row.video_type as 'youtube' | 'uploaded') || 'youtube',
      videoUrl: String(row.video_url || ''),
      subModules,
      relevanceScore,
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
        }),
      ])
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }

  private chunk(content: string): string[] {
    const words = content.trim().split(/\s+/)
    const chunks: string[] = []
    const chunkSize = 220
    const overlap = 40

    for (let start = 0; start < words.length; start += chunkSize - overlap) {
      const chunk = words.slice(start, start + chunkSize).join(' ').trim()
      if (chunk) chunks.push(chunk)
    }
    return chunks
  }

  public cleanVideoUrl(rawUrl?: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return ''
    let trimmed = rawUrl.trim()
    const iframeMatch = trimmed.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)
    if (iframeMatch) {
      trimmed = iframeMatch[1].trim()
    }
    trimmed = trimmed.replace(/^[<"']+|[>"']+$/g, '')

    const idMatch =
      trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i)?.[1] ||
      trimmed.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed|v)\/)([a-zA-Z0-9_-]{11})/i)?.[1] ||
      trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i)?.[1] ||
      trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i)?.[1] ||
      trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i)?.[1]

    if (idMatch) {
      return `https://www.youtube.com/watch?v=${idMatch}`
    }

    return trimmed
  }

  /**
   * Fetch YouTube metadata (via oEmbed) and generate AI Quiz using RAG context + LLM
   */
  public async generateQuizFromYoutubeAndRag(params: {
    videoUrl?: string
    courseId?: number | string
    title?: string
    description?: string
    category?: string
    subModules?: any[]
    numQuestions?: number
  }): Promise<{
    success: boolean
    videoMetadata: {
      title: string
      author: string
      thumbnailUrl: string
    } | null
    quiz: {
      title: string
      totalQuestions: number
      questions: Array<{
        id: number
        question: string
        options: string[]
        correctAnswer: string
        explanation: string
      }>
    }
  }> {
    let videoMetadata: { title: string; author: string; thumbnailUrl: string } | null = null
    const rawVideoUrl = params.videoUrl?.trim()

    if (rawVideoUrl) {
      try {
        const cleanUrl = this.cleanVideoUrl(rawVideoUrl)
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`)
        if (oembedRes.ok) {
          const data = (await oembedRes.json()) as any
          videoMetadata = {
            title: data.title || '',
            author: data.author_name || '',
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${this.cleanVideoUrl(rawVideoUrl).split('v=')[1]}/hqdefault.jpg`,
          }
        }
      } catch {
        // oembed fallback ignore
      }
    }

    let courseTitle = params.title || ''
    let courseDesc = params.description || ''
    let courseCategory = params.category || ''
    let subModules: any[] = params.subModules || []

    if (params.courseId) {
      const courseRow = await db.from('rag_courses').where('id', Number(params.courseId)).first()
      if (courseRow) {
        courseTitle = courseTitle || courseRow.title
        courseDesc = courseDesc || courseRow.description
        courseCategory = courseCategory || courseRow.category
        if (!subModules.length && courseRow.sub_modules) {
          subModules = typeof courseRow.sub_modules === 'string' ? JSON.parse(courseRow.sub_modules) : courseRow.sub_modules
        }
      }
    }

    let ragChunksText = ''
    if (params.courseId) {
      try {
        const docs = await db.from('rag_documents').where('source_type', 'course').where('source_id', Number(params.courseId)).limit(5)
        ragChunksText = docs.map((d) => d.content).join('\n')
      } catch {
        // ignore
      }
    }

    const targetTitle = courseTitle || videoMetadata?.title || 'Skill Learning'
    const apiKey = env.get('CHATBOT_API_KEY', '')
    let questions: Array<{
      id: number
      question: string
      options: string[]
      correctAnswer: string
      explanation: string
    }> = []

    if (apiKey) {
      try {
        const { default: Groq } = await import('groq-sdk')
        const groq = new Groq({ apiKey })
        const systemPrompt = `You are an expert subject-matter quiz generator for an e-learning platform.
Your task is to generate a real, knowledge-based multiple-choice quiz on the SUBJECT indicated by the course/module title, description, category, and lesson topics.

Rules:
1. Treat the Title as the SUBJECT to test. If the title is "JavaScript" or "JavaScript for Beginners", generate genuine JavaScript programming questions (syntax, behavior, output-prediction, core concepts) — not questions about the course itself.
2. NEVER reference a video's channel name, uploader, platform, or any "course/video/lesson/module" framing inside a question or its options. The learner should not be able to tell this came from a course.
3. DO NOT generate meta questions like "What is the objective of this course?" or "What does this video cover?"
4. Use the Description, Modules, and RAG Context to sharpen specificity when they're useful — but if they're thin, rely on your own expert knowledge of the SUBJECT to write accurate, real questions.
5. Options must be plausible but only one unambiguously correct.
6. Output MUST be a valid JSON object with this exact schema:
{
  "questions": [
    {
      "id": 1,
      "question": "Real subject-matter question...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Why this is correct, in terms of the subject."
    }
  ]
}
Do NOT include markdown backticks or any extra prose. Return ONLY the raw valid JSON object.`

        const userPrompt = `Subject / Title: ${targetTitle}
Category: ${courseCategory}
Description: ${courseDesc}
Modules & Lessons: ${JSON.stringify(subModules)}
RAG Context: ${ragChunksText}

Generate exactly ${params.numQuestions || 10} distinct, real subject-matter multiple-choice questions that test understanding of "${targetTitle}". If Modules/RAG Context are limited, use your own knowledge of the subject named in the Title/Category to write accurate questions — do not ask about the course, video, or platform.`

        const completion = await groq.chat.completions.create({
          model: env.get('CHATBOT_MODEL', 'openai/gpt-oss-120b'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })

        const rawContent = completion.choices[0]?.message?.content || ''
        try {
          // Find the first { and last } to extract JSON in case of extra prose
          const startIndex = rawContent.indexOf('{');
          const endIndex = rawContent.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = rawContent.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonStr);
            if (parsed.questions && Array.isArray(parsed.questions)) {
              questions = parsed.questions;
            }
          }
        } catch (parseError) {
          console.error('Failed to parse LLM JSON:', rawContent, parseError);
        }
      } catch (e) {
        console.error('LLM Quiz generation failed, fallback to contextual RAG quiz generator:', e)
      }
    }

    // Contextual RAG Fallback Quiz Generator (10 Automated Questions)
    if (!questions || questions.length === 0) {
      const topicName = targetTitle
      const lessonTitles = subModules
        .flatMap((sm) => sm.videos?.map((v: any) => v.title) || [sm.title])
        .filter(Boolean)

      questions = [
        {
          id: 1,
          question: `What is the primary objective covered in "${topicName}"?`,
          options: [
            `A) Understanding core principles and practical workflows of ${topicName}`,
            `B) Deprecating previous legacy versions`,
            `C) Setting up non-relational database indexes`,
            `D) Configuring hardware firewall routers`,
          ],
          correctAnswer: 'A',
          explanation: `The primary objective of "${topicName}" is mastering its core concepts and practical workflows.`,
        },
        {
          id: 2,
          question: `Which key concept is essential when working with ${courseCategory || topicName}?`,
          options: [
            'A) Unstructured memory allocation',
            `B) Structured workflow execution and best practices in ${courseCategory || topicName}`,
            'C) Manual byte code assembly',
            'D) Direct kernel modification',
          ],
          correctAnswer: 'B',
          explanation: `Structured workflows and best practices form the foundation of ${courseCategory || topicName}.`,
        },
        {
          id: 3,
          question: lessonTitles[0]
            ? `In the lesson "${lessonTitles[0]}", what key outcome is highlighted?`
            : `How does "${topicName}" improve learner skill outcomes?`,
          options: [
            `A) Provides hands-on mastery of ${lessonTitles[0] || topicName}`,
            'B) Increases network bandwidth latency',
            'C) Replaces standard operating system kernels',
            'D) Requires offline magnetic tape drives',
          ],
          correctAnswer: 'A',
          explanation: `The lesson focuses on providing hands-on practical mastery.`,
        },
        {
          id: 4,
          question: `What benefit does using YouTube video metadata provide in this RAG course?`,
          options: [
            'A) Rich visual context, thumbnail preview, and automated question generation',
            'B) Audio-only static frequency broadcast',
            'C) Printed textbook pagination',
            'D) Synchronous dial-up connection requirement',
          ],
          correctAnswer: 'A',
          explanation: `YouTube video metadata enhances RAG indexing and enables automated visual quiz synthesis.`,
        },
        {
          id: 5,
          question: `How can learners verify their understanding of ${topicName}?`,
          options: [
            'A) By taking RAG AI-generated quizzes and interactive assessments',
            'B) By skipping practical exercises',
            'C) By deleting course metadata',
            'D) By closing the application without review',
          ],
          correctAnswer: 'A',
          explanation: `Interactive RAG quizzes help validate learning outcomes and reinforce key concepts.`,
        },
        {
          id: 6,
          question: `What role does RAG (Retrieval-Augmented Generation) play in this course?`,
          options: [
            'A) It retrieves vector embeddings of course content to generate accurate context-aware questions',
            'B) It formats raw audio into MP3 files',
            'C) It deletes outdated database tables automatically',
            'D) It limits user access based on location',
          ],
          correctAnswer: 'A',
          explanation: `RAG retrieves indexed vector chunks to ensure generated quiz questions closely align with course materials.`,
        },
        {
          id: 7,
          question: lessonTitles[1]
            ? `What topic is covered in "${lessonTitles[1]}"?`
            : `What is a recommended practice when studying ${topicName}?`,
          options: [
            `A) ${lessonTitles[1] ? `Deep-dive into ${lessonTitles[1]}` : `Reviewing video lectures and completing AI quizzes`}`,
            'B) Ignoring practical exercises',
            'C) Disabling vector embeddings',
            'D) Modifying database configuration files',
          ],
          correctAnswer: 'A',
          explanation: `Active engagement with video content and quizzes maximizes retention.`,
        },
        {
          id: 8,
          question: `How does real-time YouTube metadata extraction improve course organization?`,
          options: [
            'A) It automatically pulls official titles, author channels, and thumbnails without manual data entry',
            'B) It converts videos into static PDF documents',
            'C) It locks video access behind payment gateways',
            'D) It slows down video stream loading times',
          ],
          correctAnswer: 'A',
          explanation: `Automated oEmbed metadata extraction keeps course content accurate and visually rich without manual effort.`,
        },
        {
          id: 9,
          question: `What approach should be taken when answering multiple-choice questions in ${topicName}?`,
          options: [
            'A) Carefully analyze each option against core concepts learned from RAG course materials',
            'B) Select options randomly without reading',
            'C) Choose the longest option every time',
            'D) Skip all questions',
          ],
          correctAnswer: 'A',
          explanation: `Analyzing choices against RAG course context ensures higher accuracy and deeper understanding.`,
        },
        {
          id: 10,
          question: `What is the ultimate goal of completing all 10 RAG AI quiz questions for ${topicName}?`,
          options: [
            `A) Achieving full skill mastery and empirical retention of ${topicName} concepts`,
            'B) Bypassing course registration',
            'C) Deleting user progress logs',
            'D) Resetting database schemas',
          ],
          correctAnswer: 'A',
          explanation: `Completing the assessment solidifies knowledge and validates overall learning achievement.`,
        },
      ]
    }

    return {
      success: true,
      videoMetadata,
      quiz: {
        title: `${targetTitle} — RAG AI Knowledge Check`,
        totalQuestions: questions.length,
        questions,
      },
    }
  }

  private toVector(values: number[]): string {
    return `[${values.join(',')}]`
  }
}