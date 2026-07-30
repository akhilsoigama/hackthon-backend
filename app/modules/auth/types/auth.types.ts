// app/modules/auth/types/auth.types.ts

export type AuthType = 'admin' | 'institute' | 'faculty' | 'student' | 'user'

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenPayload {
  token: string
  expiresAt?: string
}

export interface UserProfileDto {
  id: number
  email: string
  fullName: string | null
  userType: string
  authType: AuthType
  instituteId: number | null
  facultyId: number | null
  studentId: number | null
  departmentId: number | null
  mobile: string | null
  isActive: boolean
  isEmailVerified: boolean
  isMobileVerified: boolean
  roles: string[]
  permissions: string[]
  roleName: string
}

export interface LoginResponse {
  token: string
  authType: AuthType
  user: UserProfileDto
}

export interface AuthContextUser {
  id: number
  userType: string
  email?: string
  instituteId?: number | null
  facultyId?: number | null
  studentId?: number | null
}
