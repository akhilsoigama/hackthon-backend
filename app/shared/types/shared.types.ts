// app/shared/types/shared.types.ts

export type SortOrder = 'asc' | 'desc'

export interface PaginationInput {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  lastPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export type UserType = 'super_admin' | 'admin' | 'system_admin' | 'institute' | 'faculty' | 'student'

export interface AuthUserContext {
  id: number
  userType: UserType
  email: string
  fullName: string | null
  instituteId: number | null
  facultyId: number | null
  studentId: number | null
  isActive: boolean
}

export interface ApiErrorDetail {
  field?: string
  message: string
  rule?: string
}
