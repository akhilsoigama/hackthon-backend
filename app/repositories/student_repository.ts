import Student from '#models/student'

type AuthUserScope = {
  id: number
  userType?: string | null
  instituteId?: number | null
}

type StudentListFilters = {
  instituteId?: number
  studentId?: number
  search?: string
  onlyActive?: boolean
  withDeleted?: boolean
}

export default class StudentRepository {
  async list(filters: StudentListFilters, page: number, limit: number, authUser?: AuthUserScope | null) {
    page = Math.max(page || 1, 1)
    limit = Math.min(Math.max(limit || 10, 1), 20)

    const query = Student.query()
      .select([
        'id',
        'student_name',
        'student_std',
        'student_gr_no',
        'student_gender',
        'student_email', 
        'student_mobile',
        'student_dob',
        'institute_id',
        'department_id',
        'role_id',
        'student_addmission_date',
        'student_id',
        'is_active',
        'created_at',
        'updated_at',
      ])
      .preload('role', (q) => q.select(['id', 'roleName']))
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .orderBy('created_at', 'desc')

    if (authUser?.userType === 'institute') {
      const scopedInstituteId = authUser.instituteId || filters.instituteId

      if (scopedInstituteId) {
        query.where('institute_id', scopedInstituteId)
      } else {
        query.where('id', 0)
      }
    } else if (filters.instituteId) {
      query.where('institute_id', filters.instituteId)
    }

    if (!filters.withDeleted) {
      query.whereNull('deleted_at')
    }

    if (filters.instituteId) {
      query.where('institute_id', filters.instituteId)
    }

    if (filters.studentId) {
      query.where('id', filters.studentId)
    }

    if (filters.onlyActive) {
      query.where('is_active', true)
    }

    if (filters.search) {
      const search = `${filters.search}%`
      query.where((sub) => {
        sub
          .whereILike('student_name', search)
          .orWhereILike('student_email', search)
          .orWhereILike('student_id', search)
      })
    }

    return query.paginate(page, limit)
  }

  findById(id: number, instituteId?: number, authUser?: AuthUserScope | null) {
    const query = Student.query()
      .where('id', id)
      .whereNull('deleted_at')
      .preload('department', (q) => q.select(['id', 'departmentName']))
      .preload('institute', (q) => q.select(['id', 'instituteName']))
      .preload('role', (q) => q.select(['id', 'roleName']))

    if (authUser?.userType === 'institute') {
      const scopedInstituteId = authUser.instituteId || instituteId

      if (scopedInstituteId) {
        query.where('institute_id', scopedInstituteId)
      } else {
        query.where('id', 0)
      }
    } else if (instituteId) {
      query.where('institute_id', instituteId)
    }

    if (instituteId) {
      query.where('institute_id', instituteId)
    }

    return query.first()
  }
}

