// Define and export all the permission keys with global and user-specific access
export enum PermissionKeys {
  // Role & Permission Management
  ROLES_VIEW = 'roles_view',
  ROLES_CREATE = 'roles_create',
  ROLES_UPDATE = 'roles_update',
  ROLES_DELETE = 'roles_delete',
  ROLES_LIST = 'roles_list',

  PERMISSIONS_VIEW = 'permissions_view',
  PERMISSIONS_LIST = 'permissions_list',
  PERMISSIONS_ASSIGN = 'permissions_assign',

  // User Management
  USERS_CREATE = 'users_create',
  USERS_UPDATE = 'users_update',
  USERS_VIEW = 'users_view',
  USERS_LIST = 'users_list',
  USERS_DELETE = 'users_delete',

  USER_ROLES_ASSIGN = 'user_roles_assign',
  USER_ROLES_REMOVE = 'user_roles_remove',
  USER_ROLES_VIEW = 'user_roles_view',

  USER_PERMISSIONS_ASSIGN = 'user_permissions_assign',
  USER_PERMISSIONS_REMOVE = 'user_permissions_remove',
  USER_PERMISSIONS_VIEW = 'user_permissions_view',

  // Nabha Management - Institute
  INSTITUTE_VIEW = 'institute_view',
  INSTITUTE_CREATE = 'institute_create',
  INSTITUTE_UPDATE = 'institute_update',
  INSTITUTE_DELETE = 'institute_delete',
  INSTITUTE_LIST = 'institute_list',

  // Nabha Management - Govt Survey
  SURVEY_VIEW = 'survey_view',
  SURVEY_CREATE = 'survey_create',
  SURVEY_UPDATE = 'survey_update',
  SURVEY_DELETE = 'survey_delete',
  SURVEY_LIST = 'survey_list',
  SURVEY_SUBMIT = 'survey_submit',
  SURVEY_APPROVE = 'survey_approve',

  // Institute Management - Faculty
  FACULTY_VIEW = 'faculty_view',
  FACULTY_CREATE = 'faculty_create',
  FACULTY_UPDATE = 'faculty_update',
  FACULTY_DELETE = 'faculty_delete',
  FACULTY_LIST = 'faculty_list',

  // Institute Management - Student
  STUDENT_VIEW = 'student_view',
  STUDENT_CREATE = 'student_create',
  STUDENT_UPDATE = 'student_update',
  STUDENT_DELETE = 'student_delete',
  STUDENT_LIST = 'student_list',

  // Institute Management - Department
  DEPARTMENT_VIEW = 'department_view',
  DEPARTMENT_CREATE = 'department_create',
  DEPARTMENT_UPDATE = 'department_update',
  DEPARTMENT_DELETE = 'department_delete',
  DEPARTMENT_LIST = 'department_list',

  // Institute Management - Institute Survey
  INSTITUTE_SURVEY_VIEW = 'institute_survey_view',
  INSTITUTE_SURVEY_CREATE = 'institute_survey_create',
  INSTITUTE_SURVEY_UPDATE = 'institute_survey_update',
  INSTITUTE_SURVEY_DELETE = 'institute_survey_delete',
  INSTITUTE_SURVEY_LIST = 'institute_survey_list',

  // Student Management - Assignment
  ASSIGNMENT_VIEW = 'assignment_view',
  ASSIGNMENT_CREATE = 'assignment_create',
  ASSIGNMENT_UPDATE = 'assignment_update',
  ASSIGNMENT_DELETE = 'assignment_delete',
  ASSIGNMENT_LIST = 'assignment_list',
  ASSIGNMENT_SUBMIT = 'assignment_submit',
  ASSIGNMENT_GRADE = 'assignment_grade',

  // Student Management - Lesson
  LESSON_VIEW = 'lesson_view',
  LESSON_CREATE = 'lesson_create',
  LESSON_UPDATE = 'lesson_update',
  LESSON_DELETE = 'lesson_delete',
  LESSON_LIST = 'lesson_list',

  //Lacture Upload 

  LECTURE_CREATE = 'lecture_create',
  LECTURE_LIST = 'lecture_list',
  LECTURE_UPDATE = 'lecture_update',
  LECTURE_VIEW = 'lecture_view',
  LECTURE_DELETE = 'lecture_delete',

  // Student Management - Quiz
  QUIZ_VIEW = 'quiz_view',
  QUIZ_CREATE = 'quiz_create',
  QUIZ_UPDATE = 'quiz_update',
  QUIZ_DELETE = 'quiz_delete',
  QUIZ_LIST = 'quiz_list',
  QUIZ_TAKE = 'quiz_take',
  QUIZ_EVALUATE = 'quiz_evaluate',

  // Student Management - Progress
  PROGRESS_VIEW = 'progress_view',
  PROGRESS_TRACK = 'progress_track',
  PROGRESS_REPORT = 'progress_report',

  // Leave Management
  LEAVE_VIEW = 'leave_view',
  LEAVE_CREATE = 'leave_create',
  LEAVE_UPDATE = 'leave_update',
  LEAVE_DELETE = 'leave_delete',
  LEAVE_LIST = 'leave_list',
  LEAVE_APPROVE = 'leave_approve',
  LEAVE_REJECT = 'leave_reject',

  // Student Upload - Assignment Upload
  ASSIGNMENT_UPLOAD_VIEW = 'assignment_upload_view',
  ASSIGNMENT_UPLOAD_CREATE = 'assignment_upload_create',
  ASSIGNMENT_UPLOAD_UPDATE = 'assignment_upload_update',
  ASSIGNMENT_UPLOAD_DELETE = 'assignment_upload_delete',
  ASSIGNMENT_UPLOAD_LIST = 'assignment_upload_list',

  // Student Upload - Lesson Upload
  LESSON_UPLOAD_VIEW = 'lesson_upload_view',
  LESSON_UPLOAD_CREATE = 'lesson_upload_create',
  LESSON_UPLOAD_UPDATE = 'lesson_upload_update',
  LESSON_UPLOAD_DELETE = 'lesson_upload_delete',
  LESSON_UPLOAD_LIST = 'lesson_upload_list',

  // Dashboard
  DASHBOARD_OVERVIEW = 'dashboard_overview',
  DASHBOARD_PROGRESS = 'dashboard_progress',
  DASHBOARD_EVENTS = 'dashboard_events',
  DASHBOARD_QUIZ = 'dashboard_quiz',

  // Communication
  CHATBOT_ACCESS = 'chatbot_access',
  MESSAGING_SEND = 'messaging_send',
  MESSAGING_RECEIVE = 'messaging_receive',

  // Settings
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_UPDATE = 'settings_update',
  SYSTEM_CONFIG = 'system_config',

  // Administrative Permissions
  ADMIN_ACCESS = 'admin_access',
  SUPER_ADMIN = 'super_admin',
  MODERATOR_ACCESS = 'moderator_access',

  // Export/Import  
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',

  // Audit & Reports
  AUDIT_LOGS_VIEW = 'audit_logs_view',
  REPORTS_GENERATE = 'reports_generate',
  REPORTS_VIEW = 'reports_view'
}

export const permissions = Object.values(PermissionKeys).map((key) => ({
  permissionName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  permissionKey: key,
}))