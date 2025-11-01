// app/middleware/permission_middleware.ts
import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type ExtendedPermissionKeys = PermissionKeys | string

// ✅ Complete permission mapping
const PermissionMapping: Record<string, PermissionKeys> = {
  // Lecture permissions
  'lecture_create': PermissionKeys.LECTURE_CREATE,
  'lecture_update': PermissionKeys.LECTURE_UPDATE,
  'lecture_view': PermissionKeys.LECTURE_VIEW,
  'lecture_list': PermissionKeys.LECTURE_LIST,
  'lecture_delete': PermissionKeys.LECTURE_DELETE,

  // Lesson permissions
  'lesson_create': PermissionKeys.LESSON_CREATE,
  'lesson_update': PermissionKeys.LESSON_UPDATE,
  'lesson_view': PermissionKeys.LESSON_VIEW,
  'lesson_list': PermissionKeys.LESSON_LIST,
  'lesson_delete': PermissionKeys.LESSON_DELETE,

  // User permissions
  'users_create': PermissionKeys.USERS_CREATE,
  'users_update': PermissionKeys.USERS_UPDATE,
  'users_view': PermissionKeys.USERS_VIEW,
  'users_list': PermissionKeys.USERS_LIST,
  'users_delete': PermissionKeys.USERS_DELETE,

  // Role permissions
  'roles_create': PermissionKeys.ROLES_CREATE,
  'roles_update': PermissionKeys.ROLES_UPDATE,
  'roles_view': PermissionKeys.ROLES_VIEW,
  'roles_list': PermissionKeys.ROLES_LIST,
  'roles_delete': PermissionKeys.ROLES_DELETE,

  // Institute permissions
  'institute_create': PermissionKeys.INSTITUTE_CREATE,
  'institute_update': PermissionKeys.INSTITUTE_UPDATE,
  'institute_view': PermissionKeys.INSTITUTE_VIEW,
  'institute_list': PermissionKeys.INSTITUTE_LIST,
  'institute_delete': PermissionKeys.INSTITUTE_DELETE,

  // Faculty permissions
  'faculty_create': PermissionKeys.FACULTY_CREATE,
  'faculty_update': PermissionKeys.FACULTY_UPDATE,
  'faculty_view': PermissionKeys.FACULTY_VIEW,
  'faculty_list': PermissionKeys.FACULTY_LIST,
  'faculty_delete': PermissionKeys.FACULTY_DELETE,

  // Student permissions
  'student_create': PermissionKeys.STUDENT_CREATE,
  'student_update': PermissionKeys.STUDENT_UPDATE,
  'student_view': PermissionKeys.STUDENT_VIEW,
  'student_list': PermissionKeys.STUDENT_LIST,
  'student_delete': PermissionKeys.STUDENT_DELETE,

  // Department permissions
  'department_create': PermissionKeys.DEPARTMENT_CREATE,
  'department_update': PermissionKeys.DEPARTMENT_UPDATE,
  'department_view': PermissionKeys.DEPARTMENT_VIEW,
  'department_list': PermissionKeys.DEPARTMENT_LIST,
  'department_delete': PermissionKeys.DEPARTMENT_DELETE,

  // Permission permissions
  'permissions_view': PermissionKeys.PERMISSIONS_VIEW,
  'permissions_list': PermissionKeys.PERMISSIONS_LIST,

  // User role permissions
  'user_roles_assign': PermissionKeys.USER_ROLES_ASSIGN,
  'user_roles_remove': PermissionKeys.USER_ROLES_REMOVE,
  'user_roles_view': PermissionKeys.USER_ROLES_VIEW,

  // Assignment permissions
  'assignment_create': PermissionKeys.ASSIGNMENT_CREATE,
  'assignment_update': PermissionKeys.ASSIGNMENT_UPDATE,
  'assignment_view': PermissionKeys.ASSIGNMENT_VIEW,
  'assignment_delete': PermissionKeys.ASSIGNMENT_DELETE,

  // Quiz permissions
  'quiz_create': PermissionKeys.QUIZ_CREATE,
  'quiz_update': PermissionKeys.QUIZ_UPDATE,
  'quiz_view': PermissionKeys.QUIZ_VIEW,
  'quiz_delete': PermissionKeys.QUIZ_DELETE,

  // Material permissions
  'material_create': PermissionKeys.MATERIAL_CREATE,
  'material_update': PermissionKeys.MATERIAL_UPDATE,
  'material_view': PermissionKeys.MATERIAL_VIEW,
  'material_delete': PermissionKeys.MATERIAL_DELETE,

  // Survey permissions
  'survey_create': PermissionKeys.SURVEY_CREATE,
  'survey_update': PermissionKeys.SURVEY_UPDATE,
  'survey_view': PermissionKeys.SURVEY_VIEW,
  'survey_delete': PermissionKeys.SURVEY_DELETE,

  // Progress permissions
  'progress_view': PermissionKeys.PROGRESS_VIEW,

  // Leave permissions
  'leave_create': PermissionKeys.LEAVE_CREATE,
  'leave_update': PermissionKeys.LEAVE_UPDATE,
  'leave_view': PermissionKeys.LEAVE_VIEW,
  'leave_delete': PermissionKeys.LEAVE_DELETE,

  // Settings permissions
  'settings_view': PermissionKeys.SETTINGS_VIEW,
  'settings_update': PermissionKeys.SETTINGS_UPDATE,

  // Reports permissions
  'reports_view': PermissionKeys.REPORTS_VIEW,

  // QnA permissions
  'qna_view': PermissionKeys.QNA_VIEW,
  'qna_create': PermissionKeys.QNA_CREATE,

  // Achievements permissions
  'achievements_view': PermissionKeys.ACHIEVEMENTS_VIEW,

  // Badges permissions
  'badges_view': PermissionKeys.BADGES_VIEW,

  // Question permissions
  'question_view': PermissionKeys.QUESTION_VIEW,
  'question_create': PermissionKeys.QUESTION_CREATE,
}

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: ExtendedPermissionKeys[] = []) {
    try {
      if (!permissions || permissions.length === 0) {
        return next()
      }

      const ctxWithUser = ctx as any
      const requestWithUser = ctx.request as any
      
      const user = ctxWithUser.user || ctxWithUser.authUser || requestWithUser.user || ctx.auth.user

      if (!user) {
        return ctx.response.unauthorized({
          success: false,
          message: 'Authentication required - User not found in context',
        })
      }

      if (user.userType === 'super_admin' || user.userType === 'admin' || user.userType === 'system_admin') {
        return next()
      }

      // ✅ Convert and map permissions
      const validPermissions: PermissionKeys[] = permissions
        .map(perm => {
          const permString = perm.toString().toLowerCase()
          
          // If it's already a valid PermissionKey
          if (Object.values(PermissionKeys).includes(perm as PermissionKeys)) {
            return perm as PermissionKeys
          }

          // Map from string to PermissionKey
          const mappedPermission = PermissionMapping[permString]
          if (!mappedPermission) {
          }
          return mappedPermission
        })
        .filter((perm): perm is PermissionKeys => perm !== undefined)

      if (validPermissions.length === 0) {
        return ctx.response.forbidden({
          success: false,
          message: 'No valid permissions specified',
        })
      }


      // ✅ Use permission resolver
      const permissionsResolver = new PermissionsResolverService(ctx, user)
      const { hasPermission } = await permissionsResolver.permissionResolver(validPermissions)

      if (hasPermission) {
        return next()
      }

      return ctx.response.forbidden({
        success: false,
        message: 'Insufficient permissions',
      })

    } catch (error: any) {
      return ctx.response.internalServerError({
        success: false,
        message: 'Permission check failed',
        error: error.message
      })
    }
  }
}