import { PermissionKeys } from '#database/constants/permission'
import PermissionsResolverService from '#services/permissions_resolver_service'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import auditLogger from '../infrastructure/logging/AuditLogger.js'

type ExtendedPermissionKeys = PermissionKeys | string

const PermissionMapping: Record<string, PermissionKeys> = {
  // Module level permissions
  admin_management_access: PermissionKeys.ADMIN_MANAGEMENT_ACCESS,
  core_management_access: PermissionKeys.CORE_MANAGEMENT_ACCESS,
  institute_management_access: PermissionKeys.INSTITUTE_MANAGEMENT_ACCESS,
  faculty_management_access: PermissionKeys.FACULTY_MANAGEMENT_ACCESS,
  student_query_access: PermissionKeys.STUDENT_QUERY_ACCESS,
  leave_management_access: PermissionKeys.LEAVE_MANAGEMENT_ACCESS,
  student_upload_access: PermissionKeys.STUDENT_UPLOAD_ACCESS,
  dashboard_access: PermissionKeys.DASHBOARD_ACCESS,
  communication_access: PermissionKeys.COMMUNICATION_ACCESS,

  // Chatbot
  chatbot_access: PermissionKeys.CHATBOT_ACCESS,

  // Lecture
  lecture_create: PermissionKeys.LECTURE_CREATE,
  lecture_update: PermissionKeys.LECTURE_UPDATE,
  lecture_view: PermissionKeys.LECTURE_VIEW,
  lecture_list: PermissionKeys.LECTURE_LIST,
  lecture_delete: PermissionKeys.LECTURE_DELETE,

  // Users
  users_create: PermissionKeys.USERS_CREATE,
  users_update: PermissionKeys.USERS_UPDATE,
  users_view: PermissionKeys.USERS_VIEW,
  users_delete: PermissionKeys.USERS_DELETE,

  // Roles
  roles_create: PermissionKeys.ROLES_CREATE,
  roles_update: PermissionKeys.ROLES_UPDATE,
  roles_view: PermissionKeys.ROLES_VIEW,
  roles_delete: PermissionKeys.ROLES_DELETE,

  // Permissions
  permissions_view: PermissionKeys.PERMISSIONS_VIEW,

  // User roles
  user_roles_assign: PermissionKeys.USER_ROLES_ASSIGN,
  user_roles_remove: PermissionKeys.USER_ROLES_REMOVE,
  user_roles_view: PermissionKeys.USER_ROLES_VIEW,

  // Institute
  institute_create: PermissionKeys.INSTITUTE_CREATE,
  institute_update: PermissionKeys.INSTITUTE_UPDATE,
  institute_view: PermissionKeys.INSTITUTE_VIEW,
  institute_list: PermissionKeys.INSTITUTE_LIST,
  institute_delete: PermissionKeys.INSTITUTE_DELETE,

  // Govt Survey
  survey_create: PermissionKeys.GOVT_SURVEY_CREATE,
  survey_update: PermissionKeys.GOVT_SURVEY_UPDATE,
  survey_view: PermissionKeys.GOVT_SURVEY_VIEW,
  survey_delete: PermissionKeys.GOVT_SURVEY_DELETE,
  survey_list: PermissionKeys.GOVT_SURVEY_LIST,

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
  department_delete: PermissionKeys.DEPARTMENT_DELETE,

  // Institute Survey
  institute_survey_create: PermissionKeys.INSTITUTE_SURVEY_CREATE,
  institute_survey_update: PermissionKeys.INSTITUTE_SURVEY_UPDATE,
  institute_survey_view: PermissionKeys.INSTITUTE_SURVEY_VIEW,
  institute_survey_delete: PermissionKeys.INSTITUTE_SURVEY_DELETE,
  institute_survey_list: PermissionKeys.INSTITUTE_SURVEY_LIST,

  // Institute with Govt Events
  institute_with_govt_event_view: PermissionKeys.INSTITUTEWITHGOVT_EVENT_VIEW,

  // Assignment
  assignment_create: PermissionKeys.ASSIGNMENT_CREATE,
  assignment_update: PermissionKeys.ASSIGNMENT_UPDATE,
  assignment_view: PermissionKeys.ASSIGNMENT_VIEW,
  assignment_delete: PermissionKeys.ASSIGNMENT_DELETE,
  assignment_list: PermissionKeys.ASSIGNMENT_LIST,

  // Quiz
  quiz_create: PermissionKeys.QUIZ_CREATE,
  quiz_update: PermissionKeys.QUIZ_UPDATE,
  quiz_view: PermissionKeys.QUIZ_VIEW,
  quiz_delete: PermissionKeys.QUIZ_DELETE,
  quiz_list: PermissionKeys.QUIZ_LIST,
  quiz_attempt_create: PermissionKeys.QUIZ_ATTEMPT_CREATE,
  quiz_attempt_view: PermissionKeys.QUIZ_ATTEMPT_VIEW,
  quiz_attempt_list: PermissionKeys.QUIZ_ATTEMPT_LIST,

  // Student Progress
  student_progress_view: PermissionKeys.STUDENT_PROGRESS_VIEW,

  // Leave
  leave_create: PermissionKeys.LEAVE_CREATE,
  leave_update: PermissionKeys.LEAVE_UPDATE,
  leave_delete: PermissionKeys.LEAVE_DELETE,
  leave_list: PermissionKeys.LEAVE_LIST,
  leave_approve: PermissionKeys.LEAVE_APPROVE_VIEW,
  leave_reject: PermissionKeys.LEAVE_REJECT_VIEW,

  // Assignment Upload
  assignment_upload_create: PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,
  assignment_upload_update: PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE,
  assignment_upload_view: PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
  assignment_upload_delete: PermissionKeys.ASSIGNMENT_UPLOAD_DELETE,
  assignment_upload_list: PermissionKeys.ASSIGNMENT_UPLOAD_LIST,

  // Dashboard
  dashboard_overview_view: PermissionKeys.DASHBOARD_OVERVIEW_VIEW,

  // Student Query
}

function hasEquivalentViewPermission(
  required: PermissionKeys[],
  userPermissions: PermissionKeys[]
): boolean {
  for (const perm of required) {
    const permissionKey = perm.toString().toLowerCase()
    if (permissionKey.endsWith('_list')) {
      const equivalentView = permissionKey.replace(/_list$/, '_view') as PermissionKeys
      if (userPermissions.includes(equivalentView)) {
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

      const user = (ctx as unknown & { user?: unknown }).user || 
                   (ctx as unknown & { authUser?: unknown }).authUser || 
                   (ctx.request as unknown & { user?: unknown }).user || 
                   ctx.auth?.user

      if (!user) {
        return ctx.response.unauthorized({
          success: false,
          message: 'Authentication required - user not found in context.',
        })
      }

      const userRecord =
        typeof user === 'object' && user !== null ? (user as Record<string, unknown>) : null
      const userType = typeof userRecord?.userType === 'string' ? userRecord.userType : undefined

      if (userType && ['super_admin', 'admin', 'system_admin'].includes(userType)) {
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

      // Log the denial for audit trail — but never expose permission details to the client
      const actorId = typeof (user as Record<string, unknown>)?.id === 'number'
        ? (user as Record<string, unknown>).id as number
        : null
      auditLogger.permissionDenied(
        actorId,
        validPermissions[0]?.toString() ?? 'unknown',
        ctx.request.ip()
      )

      return ctx.response.forbidden({
        success: false,
        message: 'Access denied.',
      })
    } catch {
      return ctx.response.internalServerError({
        success: false,
        message: 'Permission check failed.',
      })
    }
  }
}