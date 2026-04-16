import Assignment from '#models/assignment'

type AssignmentListFilters = {
  facultyId?: number
  instituteId?: number
  search?: string
  onlyActive?: boolean
  withDeleted?: boolean
}

export default class AssignmentRepository {
  async list(filters: AssignmentListFilters, page: number, limit: number) {
    page = Math.max(page || 1, 1)
    limit = Math.min(Math.max(limit || 10, 1), 20)

    const query = Assignment.query()
      .select([
        'id',
        'assignment_title',
        'assignment_description',
        'subject',
        'assignment_file',
        'std',
        'institute_id',
        'faculty_id',
        'department_id',
        'due_date',
        'marks',
        'is_active',
        'created_at',
        'updated_at',
      ])
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('faculty', (q) => q.select(['id', 'facultyName']))
      .orderBy('created_at', 'desc')

    if (!filters.withDeleted) {
      query.whereNull('deleted_at')
    }

    if (filters.facultyId) {
      query.where('faculty_id', filters.facultyId)
    }

    if (filters.instituteId) {
      query.where('institute_id', filters.instituteId)
    }

    if (filters.onlyActive) {
      query.where('is_active', true)
    }

    if (filters.search) {
      const search = `${filters.search}%`
      query.where((sub) => {
        sub
          .whereILike('assignment_title', search)
          .orWhereILike('subject', search)
          .orWhereILike('std', search)
      })
    }

    return query.paginate(page, limit)
  }

  findById(id: number, facultyId?: number, instituteId?: number) {
    const query = Assignment.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('faculty', (q) => q.select(['id', 'facultyName']))

    if (facultyId) {
      query.where('faculty_id', facultyId)
    }

    if (instituteId) {
      query.where('institute_id', instituteId)
    }

    return query.first()
  }
}

