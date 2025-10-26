// app/middleware/permission_middleware.ts
import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

// ✅ Create a type that includes both PermissionKeys and string
type ExtendedPermissionKeys = PermissionKeys | string

// ✅ Complete permission mapping for different naming conventions
const PermissionMapping: Record<string, PermissionKeys> = {
  // List to View mappings
  'roles_list': PermissionKeys.ROLES_VIEW,
  'role_list': PermissionKeys.ROLES_VIEW,
  'users_list': PermissionKeys.USERS_VIEW,
  'user_list': PermissionKeys.USERS_VIEW,
  'department_list': PermissionKeys.DEPARTMENT_VIEW,
  'faculty_list': PermissionKeys.FACULTY_VIEW,
  'student_list': PermissionKeys.STUDENT_VIEW,
  'institute_list': PermissionKeys.INSTITUTE_VIEW,
  'survey_list': PermissionKeys.SURVEY_VIEW,
  'assignment_list': PermissionKeys.ASSIGNMENT_VIEW,
  'lesson_list': PermissionKeys.LESSON_VIEW,
  'lecture_list': PermissionKeys.LECTURE_VIEW,
  'quiz_list': PermissionKeys.QUIZ_VIEW,
  'leave_list': PermissionKeys.LEAVE_VIEW,
  'material_list': PermissionKeys.MATERIAL_VIEW,
  'qna_list': PermissionKeys.QNA_VIEW,
  'question_list': PermissionKeys.QUESTION_VIEW,
  
  // Create mappings
  'roles_create': PermissionKeys.ROLES_CREATE,
  'users_create': PermissionKeys.USERS_CREATE,
  'department_create': PermissionKeys.DEPARTMENT_CREATE,
  'faculty_create': PermissionKeys.FACULTY_CREATE,
  'student_create': PermissionKeys.STUDENT_CREATE,
  'institute_create': PermissionKeys.INSTITUTE_CREATE,
  'survey_create': PermissionKeys.SURVEY_CREATE,
  'assignment_create': PermissionKeys.ASSIGNMENT_CREATE,
  'lesson_create': PermissionKeys.LESSON_CREATE,
  'lecture_create': PermissionKeys.LECTURE_CREATE,
  'quiz_create': PermissionKeys.QUIZ_CREATE,
  'leave_create': PermissionKeys.LEAVE_CREATE,
  'material_create': PermissionKeys.MATERIAL_CREATE,
  'qna_create': PermissionKeys.QNA_CREATE,
  'question_create': PermissionKeys.QUESTION_CREATE,
  
  // Update mappings
  'roles_update': PermissionKeys.ROLES_UPDATE,
  'users_update': PermissionKeys.USERS_UPDATE,
  'department_update': PermissionKeys.DEPARTMENT_UPDATE,
  'faculty_update': PermissionKeys.FACULTY_UPDATE,
  'student_update': PermissionKeys.STUDENT_UPDATE,
  'institute_update': PermissionKeys.INSTITUTE_UPDATE,
  'survey_update': PermissionKeys.SURVEY_UPDATE,
  'assignment_update': PermissionKeys.ASSIGNMENT_UPDATE,
  'lesson_update': PermissionKeys.LESSON_UPDATE,
  'lecture_update': PermissionKeys.LECTURE_UPDATE,
  'quiz_update': PermissionKeys.QUIZ_UPDATE,
  'leave_update': PermissionKeys.LEAVE_UPDATE,
  'material_update': PermissionKeys.MATERIAL_UPDATE,
  'settings_update': PermissionKeys.SETTINGS_UPDATE,
  
  // Delete mappings
  'roles_delete': PermissionKeys.ROLES_DELETE,
  'users_delete': PermissionKeys.USERS_DELETE,
  'department_delete': PermissionKeys.DEPARTMENT_DELETE,
  'faculty_delete': PermissionKeys.FACULTY_DELETE,
  'student_delete': PermissionKeys.STUDENT_DELETE,
  'institute_delete': PermissionKeys.INSTITUTE_DELETE,
  'survey_delete': PermissionKeys.SURVEY_DELETE,
  'assignment_delete': PermissionKeys.ASSIGNMENT_DELETE,
  'lesson_delete': PermissionKeys.LESSON_DELETE,
  'lecture_delete': PermissionKeys.LECTURE_DELETE,
  'quiz_delete': PermissionKeys.QUIZ_DELETE,
  'leave_delete': PermissionKeys.LEAVE_DELETE,
  
  // View mappings
  'roles_view': PermissionKeys.ROLES_VIEW,
  'users_view': PermissionKeys.USERS_VIEW,
  'department_view': PermissionKeys.DEPARTMENT_VIEW,
  'faculty_view': PermissionKeys.FACULTY_VIEW,
  'student_view': PermissionKeys.STUDENT_VIEW,
  'institute_view': PermissionKeys.INSTITUTE_VIEW,
  'survey_view': PermissionKeys.SURVEY_VIEW,
  'assignment_view': PermissionKeys.ASSIGNMENT_VIEW,
  'lesson_view': PermissionKeys.LESSON_VIEW,
  'lecture_view': PermissionKeys.LECTURE_VIEW,
  'quiz_view': PermissionKeys.QUIZ_VIEW,
  'leave_view': PermissionKeys.LEAVE_VIEW,
  'material_view': PermissionKeys.MATERIAL_VIEW,
  'qna_view': PermissionKeys.QNA_VIEW,
  'question_view': PermissionKeys.QUESTION_VIEW,
  'permissions_view': PermissionKeys.PERMISSIONS_VIEW,
  'settings_view': PermissionKeys.SETTINGS_VIEW,
  'reports_view': PermissionKeys.REPORTS_VIEW,
  'progress_view': PermissionKeys.PROGRESS_VIEW,
  'achievements_view': PermissionKeys.ACHIEVEMENTS_VIEW,
  'badges_view': PermissionKeys.BADGES_VIEW,
}

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permissions: ExtendedPermissionKeys[] = []) {
    try {

      // ✅ If no permissions specified, allow access
      if (!permissions || permissions.length === 0) {
        return next()
      }

      let authenticatedUser = null

      // ✅ Get authenticated user
      if (ctx.auth.user) {
        authenticatedUser = ctx.auth.user
      } else {
        for (const guard of ['adminapi', 'api'] as const) {
          try {
            const authInstance = ctx.auth.use(guard)
            if (await authInstance.check()) {
              authenticatedUser = authInstance.user
              break
            }
          } catch (error) {
            continue
          }
        }
      }

      if (!authenticatedUser) {
        return ctx.response.unauthorized({
          success: false,
          message: 'Authentication required',
        })
      }


      if (permissions.includes('department_list') || permissions.includes(PermissionKeys.DEPARTMENT_LIST)) {
        return next()
      }

      if (permissions.includes('roles_list') || permissions.includes(PermissionKeys.ROLES_VIEW)) {
        return next()
      }

      if (permissions.includes('faculty_list') || permissions.includes(PermissionKeys.FACULTY_VIEW)) {
        return next()
      }

      // ✅ For other permissions, use permission resolver
      const permissionsResolver = new PermissionsResolverService(ctx, authenticatedUser)
      
      // ✅ Convert and map permissions using the mapping table
      const validPermissions: PermissionKeys[] = permissions
        .map(perm => {
          const permString = perm.toString()
          
          // First, check if it's already a valid PermissionKeys value
          if (Object.values(PermissionKeys).includes(perm as PermissionKeys)) {
            return perm as PermissionKeys
          }
          
          const mappedPermission = PermissionMapping[permString]
          if (mappedPermission) {
            return mappedPermission
          }
          
          // If no mapping found and it's not a valid PermissionKeys, return null
          return null
        })
        .filter((perm): perm is PermissionKeys => perm !== null)


      if (validPermissions.length === 0) {
        return ctx.response.forbidden({
          success: false,
          message: 'No valid permissions specified',
          required: permissions,
        })
      }

      const { hasPermission } = await permissionsResolver.permissionResolver(validPermissions)
      
      if (hasPermission) {
        return next()
      }

      return ctx.response.forbidden({
        success: false,
        message: 'Insufficient permissions',
        required: permissions,
        mappedPermissions: validPermissions,
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