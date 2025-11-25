import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type ExtendedPermissionKeys = PermissionKeys | string

const PermissionMapping: Record<string, PermissionKeys> = {
  // Lecture
  lecture_create: PermissionKeys.LECTURE_CREATE,
  lecture_update: PermissionKeys.LECTURE_UPDATE,
  lecture_view: PermissionKeys.LECTURE_VIEW,
  lecture_list: PermissionKeys.LECTURE_LIST,
  lecture_delete: PermissionKeys.LECTURE_DELETE,

  // Lesson
  lesson_create: PermissionKeys.LESSON_CREATE,
  lesson_update: PermissionKeys.LESSON_UPDATE,
  lesson_view: PermissionKeys.LESSON_VIEW,
  lesson_list: PermissionKeys.LESSON_LIST,
  lesson_delete: PermissionKeys.LESSON_DELETE,

  // Users
  users_create: PermissionKeys.USERS_CREATE,
  users_update: PermissionKeys.USERS_UPDATE,
  users_view: PermissionKeys.USERS_VIEW,
  users_list: PermissionKeys.USERS_LIST,
  users_delete: PermissionKeys.USERS_DELETE,

  // Roles
  roles_create: PermissionKeys.ROLES_CREATE,
  roles_update: PermissionKeys.ROLES_UPDATE,
  roles_view: PermissionKeys.ROLES_VIEW,
  roles_list: PermissionKeys.ROLES_LIST,
  roles_delete: PermissionKeys.ROLES_DELETE,

  // Institute
  institute_create: PermissionKeys.INSTITUTE_CREATE,
  institute_update: PermissionKeys.INSTITUTE_UPDATE,
  institute_view: PermissionKeys.INSTITUTE_VIEW,
  institute_list: PermissionKeys.INSTITUTE_LIST,
  institute_delete: PermissionKeys.INSTITUTE_DELETE,

  // Faculty
  faculty_create: PermissionKeys.FACULTY_CREATE,
  faculty_update: PermissionKeys.FACULTY_UPDATE,
  faculty_view: PermissionKeys.FACULTY_VIEW,
  faculty_list: PermissionKeys.FACULTY_LIST,
  faculty_delete: PermissionKeys.FACULTY_DELETE,

  // Student
  student_create: PermissionKeys.STUDENT_CREATE,
  student_update: PermissionKeys.STUDENT_UPDATE,
  student_view: PermissionKeys.STUDENT_VIEW,
  student_list: PermissionKeys.STUDENT_LIST,
  student_delete: PermissionKeys.STUDENT_DELETE,

  // Department
  department_create: PermissionKeys.DEPARTMENT_CREATE,
  department_update: PermissionKeys.DEPARTMENT_UPDATE,
  department_view: PermissionKeys.DEPARTMENT_VIEW,
  department_list: PermissionKeys.DEPARTMENT_LIST,
  department_delete: PermissionKeys.DEPARTMENT_DELETE,

  // Permissions
  permissions_view: PermissionKeys.PERMISSIONS_VIEW,
  permissions_list: PermissionKeys.PERMISSIONS_LIST,

  // User roles
  user_roles_assign: PermissionKeys.USER_ROLES_ASSIGN,
  user_roles_remove: PermissionKeys.USER_ROLES_REMOVE,
  user_roles_view: PermissionKeys.USER_ROLES_VIEW,

  // Assignment
  assignment_create: PermissionKeys.ASSIGNMENT_CREATE,
  assignment_update: PermissionKeys.ASSIGNMENT_UPDATE,
  assignment_view: PermissionKeys.ASSIGNMENT_VIEW,
  assignment_delete: PermissionKeys.ASSIGNMENT_DELETE,

  // Quiz
  quiz_create: PermissionKeys.QUIZ_CREATE,
  quiz_update: PermissionKeys.QUIZ_UPDATE,
  quiz_view: PermissionKeys.QUIZ_VIEW,
  quiz_delete: PermissionKeys.QUIZ_DELETE,

  // Material
  material_create: PermissionKeys.MATERIAL_CREATE,
  material_update: PermissionKeys.MATERIAL_UPDATE,
  material_view: PermissionKeys.MATERIAL_VIEW,
  material_delete: PermissionKeys.MATERIAL_DELETE,

  // Survey
  survey_create: PermissionKeys.GOVT_SURVEY_CREATE,
  survey_update: PermissionKeys.GOVT_SURVEY_UPDATE,
  survey_view: PermissionKeys.GOVT_SURVEY_VIEW,
  survey_delete: PermissionKeys.GOVT_SURVEY_DELETE,

  // Progress
  progress_view: PermissionKeys.PROGRESS_VIEW,

  leave_create: PermissionKeys.LEAVE_CREATE,
  leave_update: PermissionKeys.LEAVE_UPDATE,
  leave_view: PermissionKeys.LEAVE_VIEW,
  leave_delete: PermissionKeys.LEAVE_DELETE,

  // Settings
  settings_view: PermissionKeys.SETTINGS_VIEW,
  settings_update: PermissionKeys.SETTINGS_UPDATE,

  // Reports
  reports_view: PermissionKeys.REPORTS_VIEW,

  // QnA
  qna_view: PermissionKeys.QNA_VIEW,
  qna_create: PermissionKeys.QNA_CREATE,

  // Achievements
  achievements_view: PermissionKeys.ACHIEVEMENTS_VIEW,

  // Badges
  badges_view: PermissionKeys.BADGES_VIEW,

  // Question
  question_view: PermissionKeys.QUESTION_VIEW,
  question_create: PermissionKeys.QUESTION_CREATE,
}


function hasEquivalentViewPermission(
  required: PermissionKeys[],
  userPermissions: PermissionKeys[]
): boolean {
  for (const perm of required) {
    if (perm.toString().endsWith('_LIST')) {
      const equivalentView = perm.toString().replace('_LIST', '_VIEW') as keyof typeof PermissionKeys
      const viewKey = PermissionKeys[equivalentView]
      if (viewKey && userPermissions.includes(viewKey)) {
        return true
      }
    }
  }
  return false
}

export default class PermissionMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, permissions: ExtendedPermissionKeys[] = []) {
    try {
      if (!permissions || permissions.length === 0) return next()

      const user =
        (ctx as any).user ||
        (ctx as any).authUser ||
        (ctx.request as any).user ||
        ctx.auth?.user

      if (!user) {
        return ctx.response.unauthorized({
          success: false,
          message: 'Authentication required - user not found in context.',
        })
      }

      if (['super_admin', 'admin', 'system_admin'].includes(user.userType)) {
        return next()
      }

      const validPermissions: PermissionKeys[] = permissions
        .map((perm) => {
          const lowerKey = perm.toString().toLowerCase()
          if (Object.values(PermissionKeys).includes(perm as PermissionKeys)) {
            return perm as PermissionKeys
          }
          return PermissionMapping[lowerKey]
        })
        .filter((p): p is PermissionKeys => Boolean(p))

      if (validPermissions.length === 0) {
        return ctx.response.forbidden({
          success: false,
          message: 'No valid permissions specified.',
        })
      }

      const permissionsResolver = new PermissionsResolverService(ctx, user)
      const { hasPermission, userPermissions } =
        await permissionsResolver.permissionResolver(validPermissions)

      if (hasPermission || hasEquivalentViewPermission(validPermissions, userPermissions)) {
        return next()
      }

      return ctx.response.forbidden({
        success: false,
        message: 'Insufficient permissions.',
        required: validPermissions,
        userHas: userPermissions,
      })
    } catch (error: any) {
      return ctx.response.internalServerError({
        success: false,
        message: 'Permission check failed.',
        error: error.message,
      })
    }
  }
}
