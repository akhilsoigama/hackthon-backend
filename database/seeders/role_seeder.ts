// database/seeders/RoleSeeder.ts
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

    const roles = await Role.query().whereIn('roleKey', [
      'super_admin',
      'institute',
      'faculty',
      'student',
    ])
    const allPermissions = await Permission.query().select(['id', 'permissionKey'])
    const permissionMap = new Map(
      allPermissions.map((permission) => [permission.permissionKey, permission.id])
    )

    const rolePermissions: Record<string, string[]> = {
      super_admin: allPermissions.map((permission) => permission.permissionKey),

      institute: [
        // Module level
        PermissionKeys.ADMIN_MANAGEMENT_ACCESS,
        PermissionKeys.CORE_MANAGEMENT_ACCESS,
        PermissionKeys.INSTITUTE_MANAGEMENT_ACCESS,
        PermissionKeys.FACULTY_MANAGEMENT_ACCESS,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.LEAVE_MANAGEMENT_ACCESS,
        PermissionKeys.STUDENT_UPLOAD_ACCESS,
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.GAMIFICATION_ACCESS,
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,
        PermissionKeys.SETTINGS_ACCESS,
        PermissionKeys.EVENTS_ACCESS,

        // Dashboard
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,

        // Institute
        PermissionKeys.INSTITUTE_VIEW,
        PermissionKeys.INSTITUTE_LIST,

        // Institute Survey
        PermissionKeys.INSTITUTE_SURVEY_CREATE,
        PermissionKeys.INSTITUTE_SURVEY_VIEW,
        PermissionKeys.INSTITUTE_SURVEY_LIST,
        PermissionKeys.INSTITUTE_SURVEY_DELETE,
        PermissionKeys.INSTITUTE_SURVEY_UPDATE,

        // Govt Survey
        PermissionKeys.GOVT_SURVEY_VIEW,
        PermissionKeys.GOVT_SURVEY_LIST,

        // Faculty
        PermissionKeys.FACULTY_VIEW,
        PermissionKeys.FACULTY_CREATE,
        PermissionKeys.FACULTY_UPDATE,
        PermissionKeys.FACULTY_DELETE,
        PermissionKeys.FACULTY_LIST,

        // Student
        PermissionKeys.STUDENT_VIEW,
        PermissionKeys.STUDENT_CREATE,
        PermissionKeys.STUDENT_UPDATE,
        PermissionKeys.STUDENT_DELETE,
        PermissionKeys.STUDENT_LIST,

        // Department
        PermissionKeys.DEPARTMENT_VIEW,
        PermissionKeys.DEPARTMENT_CREATE,
        PermissionKeys.DEPARTMENT_UPDATE,
        PermissionKeys.DEPARTMENT_DELETE,

        // Assignment
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.ASSIGNMENT_LIST,

        // Lecture
        PermissionKeys.LECTURE_VIEW,
        PermissionKeys.LECTURE_LIST,
        PermissionKeys.LECTURE_CREATE,
        PermissionKeys.LECTURE_UPDATE,
        PermissionKeys.LECTURE_DELETE,

        // Quiz
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,
        PermissionKeys.QUIZ_ATTEMPT_CREATE,

        // Student Query
        PermissionKeys.STUDENT_QUERY_ACCESS,

        // Chatbot
        PermissionKeys.CHATBOT_ACCESS,

        // Assignment Upload
        PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
        PermissionKeys.ASSIGNMENT_UPLOAD_LIST,
        PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,
        PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE,
        PermissionKeys.ASSIGNMENT_UPLOAD_DELETE,

        // Offline Library
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,

        // Q&A
        // Settings
        PermissionKeys.SETTINGS_ACCESS,

        // Events
        PermissionKeys.EVENTS_ACCESS,
      ],

      faculty: [
        // Module level
        PermissionKeys.FACULTY_MANAGEMENT_ACCESS,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.LEAVE_MANAGEMENT_ACCESS,
        PermissionKeys.STUDENT_UPLOAD_ACCESS,
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.GAMIFICATION_ACCESS,
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,
        PermissionKeys.FACULTY_ANSWER_QNA_ACCESS,
        PermissionKeys.SETTINGS_ACCESS,
        PermissionKeys.EVENTS_ACCESS,

        // Dashboard
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,

        // Student
        PermissionKeys.STUDENT_VIEW,
        PermissionKeys.STUDENT_LIST,

        // Department
        PermissionKeys.DEPARTMENT_VIEW,
        PermissionKeys.DEPARTMENT_CREATE,
        PermissionKeys.DEPARTMENT_UPDATE,
        PermissionKeys.DEPARTMENT_DELETE,

        // Assignment
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.ASSIGNMENT_CREATE,
        PermissionKeys.ASSIGNMENT_UPDATE,
        PermissionKeys.ASSIGNMENT_DELETE,
        PermissionKeys.ASSIGNMENT_LIST,

        // Assignment Upload
        PermissionKeys.ASSIGNMENT_UPLOAD_LIST,
        PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
        PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,
        PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE,
        PermissionKeys.ASSIGNMENT_UPLOAD_DELETE,


        // Institute Survey
        PermissionKeys.INSTITUTE_SURVEY_VIEW,
        PermissionKeys.INSTITUTE_SURVEY_LIST,

        // Student Query
        PermissionKeys.STUDENT_QUERY_ACCESS,

        // Quiz
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_CREATE,
        PermissionKeys.QUIZ_UPDATE,
        PermissionKeys.QUIZ_DELETE,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,
        PermissionKeys.QUIZ_ATTEMPT_CREATE,

        // Lecture
        PermissionKeys.LECTURE_VIEW,
        PermissionKeys.LECTURE_LIST,
        PermissionKeys.LECTURE_CREATE,
        PermissionKeys.LECTURE_UPDATE,
        PermissionKeys.LECTURE_DELETE,

        // Faculty Progress
        PermissionKeys.FACULTY_STUDENT_PROGRESS_VIEW,

        // Chatbot
        PermissionKeys.CHATBOT_ACCESS,

        // Institute
        PermissionKeys.INSTITUTE_VIEW,
        PermissionKeys.INSTITUTE_LIST,

        // Offline Library
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,

        // Q&A
        PermissionKeys.FACULTY_ANSWER_QNA_ACCESS,

        // Settings
        PermissionKeys.SETTINGS_ACCESS,

        // Events
        PermissionKeys.EVENTS_ACCESS,

        PermissionKeys.FACULTY_ALL_QUESTIONS_QNA_VIEW,
        PermissionKeys.FACULTY_ANSWER_QNA_ACCESS,
        PermissionKeys.FACULTY_VIEW_QNA_ACCESS,
        PermissionKeys.FACULTY_UNANSWERED_QUESTIONS_QNA_VIEW,
      ],

      student: [
        // Module level
        PermissionKeys.DASHBOARD_ACCESS,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.STUDENT_UPLOAD_ACCESS,
        PermissionKeys.COMMUNICATION_ACCESS,
        PermissionKeys.GAMIFICATION_ACCESS,
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,
        PermissionKeys.STUDENT_QNA_ACCESS,
        PermissionKeys.SETTINGS_ACCESS,
        PermissionKeys.EVENTS_ACCESS,

        // Dashboard
        PermissionKeys.DASHBOARD_OVERVIEW_VIEW,

        // Govt Survey
        PermissionKeys.GOVT_SURVEY_VIEW,
        PermissionKeys.GOVT_SURVEY_LIST,

        // Assignment
        PermissionKeys.ASSIGNMENT_VIEW,
        PermissionKeys.ASSIGNMENT_LIST,

        // Quiz
        PermissionKeys.QUIZ_VIEW,
        PermissionKeys.QUIZ_LIST,
        PermissionKeys.QUIZ_ATTEMPT_CREATE,
        PermissionKeys.QUIZ_ATTEMPT_VIEW,
        PermissionKeys.QUIZ_ATTEMPT_LIST,

        // Student Query
        PermissionKeys.STUDENT_QUERY_ACCESS,

        // Assignment Upload
        PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
        PermissionKeys.ASSIGNMENT_UPLOAD_LIST,
        PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,

        // Lecture
        PermissionKeys.LECTURE_VIEW,
        PermissionKeys.LECTURE_LIST,

        // Chatbot
        PermissionKeys.CHATBOT_ACCESS,

        // Student Progress
        PermissionKeys.STUDENT_PROGRESS_VIEW,

        // Institute with Govt Events
        PermissionKeys.INSTITUTEWITHGOVT_EVENT_VIEW,
        PermissionKeys.INSTITUTE_SURVEY_VIEW,

        // Gamification
        PermissionKeys.GAMIFICATION_ACCESS,

        // Offline Library
        PermissionKeys.OFFLINE_LIBRARY_ACCESS,

        // Q&A
        PermissionKeys.STUDENT_QNA_ACCESS,
        PermissionKeys.STUDENT_QUERY_ACCESS,
        PermissionKeys.STUDENT_ALL_QUESTIONS_QNA_VIEW,
        PermissionKeys.STUDENT_ASK_QNA_CREATE,
        PermissionKeys.STUDENT_ASK_QNA_UPDATE,
        PermissionKeys.STUDENT_ASK_QNA_DELETE,

        // Settings
        PermissionKeys.SETTINGS_ACCESS,

        // Events
        PermissionKeys.EVENTS_ACCESS,
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
