import QuizAttempt from '#models/quiz_attempt'

type QuizAttemptListFilters = {
  quizId?: number
  studentId?: number
  instituteId?: number
  search?: string
  withDeleted?: boolean
}

export default class QuizAttemptRepository {
  async list(filters: QuizAttemptListFilters, page: number, limit: number) {
    page = Math.max(page || 1, 1)
    limit = Math.min(Math.max(limit || 10, 1), 20)

    const query = QuizAttempt.query()
      .select([
        'id',
        'quiz_id',
        'student_id',
        'institute_id',
        'score',
        'attempted_at',
        'status',
        'created_at',
        'updated_at',
      ])
      .preload('quiz', (quizQuery) => {
        quizQuery.select('id', 'quiz_title', 'quiz_description')
      })
      .preload('student', (studentQuery) => {
        studentQuery.select('id', 'student_name')
      })
      .orderBy('created_at', 'desc')

    if (!filters.withDeleted) {
      query.whereNull('deleted_at')
    }

    if (filters.quizId) {
      query.where('quiz_id', filters.quizId)
    }

    if (filters.studentId) {
      query.where('student_id', filters.studentId)
    }

    if (filters.instituteId) {
      query.where('institute_id', filters.instituteId)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase().trim()
      query.where((subQuery) => {
        subQuery
          .where('status', search)
          .orWhereRaw('CAST(score AS TEXT) LIKE ?', [`${search}%`])
      })
    }

    return query.paginate(page, limit)
  }

  findById(id: number, instituteId?: number, studentId?: number) {
    const query = QuizAttempt.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('quiz', (quizQuery) => {
        quizQuery.select('id', 'quiz_title', 'quiz_description')
      })
      .preload('student', (studentQuery) => {
        studentQuery.select('id', 'student_name')
      })

    if (instituteId) {
      query.where('institute_id', instituteId)
    }

    if (studentId) {
      query.where('student_id', studentId)
    }

    return query.first()
  }
}

