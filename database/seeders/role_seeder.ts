import Permission from '#models/permission'
import Role from '#models/role'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PermissionKeys } from '#database/constants/permission'

export default class extends BaseSeeder {
  async run() {
    await Role.updateOrCreateMany('roleKey', [
      {
        roleName: 'SUPER_ADMIN',
        roleKey: 'super_admin',
        roleDescription: 'Full system access',
        isDefault: false,
      },
      {
        roleName: 'INSTITUTE',
        roleKey: 'institute',
        roleDescription: 'Institute level access',
        isDefault: false,
      },
      {
        roleName: 'FACULTY',
        roleKey: 'faculty',
        roleDescription: 'Faculty level access',
        isDefault: false,
      },
      {
        roleName: 'STUDENT',
        roleKey: 'student',
        roleDescription: 'Student level access',
        isDefault: false,
      },
    ])

    const roles = await Role.query().whereIn('roleKey', ['super_admin', 'institute', 'faculty', 'student'])
    const allPermissions = await Permission.query().select(['id', 'permissionKey'])
    const permissionMap = new Map(allPermissions.map((permission) => [permission.permissionKey, permission.id]))

    const rolePermissions: Record<string, string[]> = {
      super_admin: allPermissions.map((permission) => permission.permissionKey),
      institute: [
        PermissionKeys.INSTITUTE_MANAGEMENT_ACCESS,
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,
        PermissionKeys.DASHBOARD_PROGRESS_VIEW,
        PermissionKeys.DASHBOARD_EVENTS_VIEW,
        PermissionKeys.DASHBOARD_QUIZ_VIEW,
        PermissionKeys.INSTITUTE_VIEW,
        PermissionKeys.INSTITUTE_LIST,
        PermissionKeys.INSTITUTE_SURVEY_CREATE,
        PermissionKeys.INSTITUTE_SURVEY_VIEW,
        PermissionKeys.INSTITUTE_SURVEY_LIST,
        PermissionKeys.INSTITUTE_SURVEY_DELETE,
        PermissionKeys.INSTITUTE_SURVEY_UPDATE,
        PermissionKeys.GOVT_SURVEY_VIEW,
        PermissionKeys.GOVT_SURVEY_LIST,
        PermissionKeys.FACULTY_MANAGEMENT_ACCESS,
        PermissionKeys.FACULTY_VIEW,
        PermissionKeys.FACULTY_CREATE,
        PermissionKeys.FACULTY_UPDATE,
        PermissionKeys.FACULTY_DELETE,
        PermissionKeys.FACULTY_LIST,
        PermissionKeys.STUDENT_VIEW,
        PermissionKeys.STUDENT_CREATE,
        PermissionKeys.STUDENT_UPDATE,
        PermissionKeys.STUDENT_DELETE,
        PermissionKeys.STUDENT_LIST,
        PermissionKeys.DEPARTMENT_VIEW,
        PermissionKeys.DEPARTMENT_CREATE,
        PermissionKeys.DEPARTMENT_UPDATE,
        PermissionKeys.DEPARTMENT_DELETE,
        PermissionKeys.DEPARTMENT_LIST,
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.LEAVE_VIEW,
        PermissionKeys.LEAVE_MANAGEMENT_ACCESS,
        PermissionKeys.LEAVE_APPROVE_VIEW,
        PermissionKeys.LEAVE_REJECT_VIEW,
        PermissionKeys.LECTURE_VIEW,
        PermissionKeys.LECTURE_LIST,
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,
        PermissionKeys.REPORTS_VIEW,
        PermissionKeys.REPORTS_GENERATE,
        PermissionKeys.SETTINGS_VIEW,
        PermissionKeys.SETTINGS_UPDATE,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.STUDENT_QUERY_ACCESS,
      ],
      faculty: [
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,
        PermissionKeys.DASHBOARD_PROGRESS_VIEW,
        PermissionKeys.DASHBOARD_EVENTS_VIEW,
        PermissionKeys.DASHBOARD_QUIZ_VIEW,
        PermissionKeys.FACULTY_VIEW,
        PermissionKeys.FACULTY_LIST,
        PermissionKeys.STUDENT_VIEW,
        PermissionKeys.STUDENT_LIST,
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.ASSIGNMENT_CREATE,
        PermissionKeys.ASSIGNMENT_UPDATE,
        PermissionKeys.ASSIGNMENT_DELETE,
        PermissionKeys.ASSIGNMENT_LIST,
        PermissionKeys.GOVT_SURVEY_VIEW,
        PermissionKeys.GOVT_SURVEY_LIST,
        PermissionKeys.INSTITUTE_SURVEY_VIEW,
        PermissionKeys.INSTITUTE_SURVEY_LIST,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_CREATE,
        PermissionKeys.QUIZ_UPDATE,
        PermissionKeys.QUIZ_DELETE,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,
        PermissionKeys.PROGRESS_VIEW,
        PermissionKeys.PROGRESS_REPORT,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.CHATBOT_ACCESS,
        PermissionKeys.REPORTS_VIEW,
      ],
      student: [
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,
        PermissionKeys.DASHBOARD_PROGRESS_VIEW,
        PermissionKeys.DASHBOARD_EVENTS_VIEW,
        PermissionKeys.DASHBOARD_QUIZ_VIEW,
        PermissionKeys.GOVT_SURVEY_VIEW,
        PermissionKeys.GOVT_SURVEY_LIST,
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.ASSIGNMENT_LIST,
        PermissionKeys.ASSIGNMENT_SUBMIT,
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_CREATE,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,
        PermissionKeys.PROGRESS_VIEW,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.LIBRARY_ACCESS,
        PermissionKeys.LIBRARY_DOWNLOAD,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.LEAVE_VIEW,
        PermissionKeys.LEAVE_CREATE,
        PermissionKeys.LEAVE_LIST,
      ],
    }

    for (const role of roles) {
      const permissionIds = (rolePermissions[role.roleKey] || [])
        .map((key) => permissionMap.get(key))
        .filter((id): id is number => id !== undefined)

      await role.related('permissions').sync(permissionIds)
    }
  }
}
