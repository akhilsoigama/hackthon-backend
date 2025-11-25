// Define and export all the permission keys with global and user-specific access
export enum PermissionKeys {
  // ========== CORE MODULES ==========
  CORE_MANAGEMENT_ACCESS = 'core_management_access',
  // Role & Permission Management
  ROLES_VIEW = 'roles_view',
  ROLES_CREATE = 'roles_create',
  ROLES_UPDATE = 'roles_update',
  ROLES_DELETE = 'roles_delete',
  ROLES_LIST = 'roles_list',
  ROLES_ACCESS = 'roles_access',

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

  // ========== NABHA MANAGEMENT MODULE ==========
  NABHA_MANAGEMENT_ACCESS = 'nabha_management_access',

  // Institute
  INSTITUTE_VIEW = 'institute_view',
  INSTITUTE_CREATE = 'institute_create',
  INSTITUTE_UPDATE = 'institute_update',
  INSTITUTE_DELETE = 'institute_delete',
  INSTITUTE_LIST = 'institute_list',

  GOVT_SURVEY_VIEW = 'govt_survey_view',
  GOVT_SURVEY_CREATE = 'govt_survey_create',
  GOVT_SURVEY_UPDATE = 'govt_survey_update',
  GOVT_SURVEY_DELETE = 'govt_survey_delete',
  GOVT_SURVEY_LIST = 'govt_survey_list',
  GOVT_SURVEY_SUBMIT = 'govt_survey_submit',
  GOVT_SURVEY_APPROVE = 'govt_survey_approve',

  // ========== INSTITUTE MANAGEMENT MODULE ==========
  INSTITUTE_MANAGEMENT_ACCESS = 'institute_management_access',

  // Faculty
  FACULTY_VIEW = 'faculty_view',
  FACULTY_CREATE = 'faculty_create',
  FACULTY_UPDATE = 'faculty_update',
  FACULTY_DELETE = 'faculty_delete',
  FACULTY_LIST = 'faculty_list',

  // Student
  STUDENT_VIEW = 'student_view',
  STUDENT_CREATE = 'student_create',
  STUDENT_UPDATE = 'student_update',
  STUDENT_DELETE = 'student_delete',
  STUDENT_LIST = 'student_list',

  // Department
  DEPARTMENT_VIEW = 'department_view',
  DEPARTMENT_CREATE = 'department_create',
  DEPARTMENT_UPDATE = 'department_update',
  DEPARTMENT_DELETE = 'department_delete',
  DEPARTMENT_LIST = 'department_list',

  // Institute Survey
  INSTITUTE_SURVEY_VIEW = 'institute_survey_view',
  INSTITUTE_SURVEY_CREATE = 'institute_survey_create',
  INSTITUTE_SURVEY_UPDATE = 'institute_survey_update',
  INSTITUTE_SURVEY_DELETE = 'institute_survey_delete',
  INSTITUTE_SURVEY_LIST = 'institute_survey_list',

  // ========== STUDENT MANAGEMENT MODULE ==========

  // Assignment
  ASSIGNMENT_VIEW = 'assignment_view',
  ASSIGNMENT_CREATE = 'assignment_create',
  ASSIGNMENT_UPDATE = 'assignment_update',
  ASSIGNMENT_DELETE = 'assignment_delete',
  ASSIGNMENT_LIST = 'assignment_list',
  ASSIGNMENT_SUBMIT = 'assignment_submit',
  ASSIGNMENT_GRADE = 'assignment_grade',

  // Lesson
  LESSON_VIEW = 'lesson_view',
  LESSON_CREATE = 'lesson_create',
  LESSON_UPDATE = 'lesson_update',
  LESSON_DELETE = 'lesson_delete',
  LESSON_LIST = 'lesson_list',

  // Lecture Upload 
  LECTURE_CREATE = 'lecture_create',
  LECTURE_LIST = 'lecture_list',
  LECTURE_UPDATE = 'lecture_update',
  LECTURE_VIEW = 'lecture_view',
  LECTURE_DELETE = 'lecture_delete',

  // Quiz
  QUIZ_VIEW = 'quiz_view',
  QUIZ_CREATE = 'quiz_create',
  QUIZ_UPDATE = 'quiz_update',
  QUIZ_DELETE = 'quiz_delete',
  QUIZ_LIST = 'quiz_list',
  QUIZ_TAKE = 'quiz_take',
  QUIZ_EVALUATE = 'quiz_evaluate',

  // Progress
  PROGRESS_VIEW = 'progress_view',
  PROGRESS_TRACK = 'progress_track',
  PROGRESS_REPORT = 'progress_report',

  // ========== LEAVE MANAGEMENT MODULE ==========
  LEAVE_MANAGEMENT_ACCESS = 'leave_management_access',
  LEAVE_VIEW = 'leave_view',
  LEAVE_CREATE = 'leave_create',
  LEAVE_UPDATE = 'leave_update',
  LEAVE_DELETE = 'leave_delete',
  LEAVE_LIST = 'leave_list',
  LEAVE_APPROVE_VIEW = 'leave_approve',
  LEAVE_REJECT_VIEW = 'leave_reject',
  // ========== STUDENT UPLOAD MODULE ==========
  STUDENT_UPLOAD_ACCESS = 'student_upload_access',

  // Assignment Upload
  ASSIGNMENT_UPLOAD_VIEW = 'assignment_upload_view',
  ASSIGNMENT_UPLOAD_CREATE = 'assignment_upload_create',
  ASSIGNMENT_UPLOAD_UPDATE = 'assignment_upload_update',
  ASSIGNMENT_UPLOAD_DELETE = 'assignment_upload_delete',
  ASSIGNMENT_UPLOAD_LIST = 'assignment_upload_list',

  // Lesson Upload
  LESSON_UPLOAD_VIEW = 'lesson_upload_view',
  LESSON_UPLOAD_CREATE = 'lesson_upload_create',
  LESSON_UPLOAD_UPDATE = 'lesson_upload_update',
  LESSON_UPLOAD_DELETE = 'lesson_upload_delete',
  LESSON_UPLOAD_LIST = 'lesson_upload_list',

  // ========== DASHBOARD MODULE ==========
  DASHBOARD_ACCESS = 'dashboard_access',
  DASHBOARD_OVERVIEW_VIEW = 'dashboard_overview_view',
  DASHBOARD_PROGRESS_VIEW = 'dashboard_progress_view',
  DASHBOARD_EVENTS_VIEW = 'dashboard_events_view',
  DASHBOARD_QUIZ_VIEW = 'dashboard_quiz_view',
  // ========== COMMUNICATION MODULE ==========
  COMMUNICATION_ACCESS = 'communication_access',

  CHATBOT_ACCESS = 'chatbot_access',
  MESSAGING_SEND = 'messaging_send',
  MESSAGING_RECEIVE = 'messaging_receive',
  CHAT_ACCESS = 'chat_access',

  // ========== SETTINGS MODULE ==========
  SETTINGS_ACCESS = 'settings_access',

  SETTINGS_VIEW = 'settings_view',
  SETTINGS_UPDATE = 'settings_update',
  SYSTEM_CONFIG = 'system_config',

  // ========== ADMINISTRATIVE PERMISSIONS ==========
  ADMIN_ACCESS = 'admin_access',
  SUPER_ADMIN = 'super_admin',
  MODERATOR_ACCESS = 'moderator_access',
  INSTITUTE_ACCESS = 'institute_access',

  // ========== DATA MANAGEMENT ==========
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',

  // ========== AUDIT & REPORTS ==========
  AUDIT_LOGS_VIEW = 'audit_logs_view',
  REPORTS_GENERATE = 'reports_generate',
  REPORTS_VIEW = 'reports_view',

  // ========== FACULTY MANAGEMENT MODULE ==========
  FACULTY_MANAGEMENT_ACCESS = 'faculty_management_access',

  // ========== STUDENT QUERY MODULE ==========
  STUDENT_QUERY_ACCESS = 'student_query_access',

  // ========== GAMIFICATION MODULE ==========
  GAMIFICATION_ACCESS = 'gamification_access',

  ACHIEVEMENTS_VIEW = 'achievements_view',
  BADGES_VIEW = 'badges_view',

  // ========== OFFLINE LIBRARY MODULE ==========
  OFFLINE_LIBRARY_ACCESS = 'offline_library_access',

  LIBRARY_ACCESS = 'library_access',
  LIBRARY_DOWNLOAD = 'library_download',

  // ========== ISSUE/DISCUSSION MODULE ==========
  ISSUE_DISCUSSION_ACCESS = 'issue_discussion_access',

  // ========== CONTENT MANAGEMENT ==========
  MATERIAL_VIEW = 'material_view',
  MATERIAL_CREATE = 'material_create',
  MATERIAL_LIST = 'material_list',
  MATERIAL_UPDATE = 'material_update',
  MATERIAL_DELETE = 'material_delete',

  QNA_VIEW = 'qna_view',
  QNA_CREATE = 'qna_create',
  QNA_LIST = 'qna_list',

  QUESTION_VIEW = 'question_view',
  QUESTION_CREATE = 'question_create',
  QUESTION_LIST = 'question_list'
}

// Module grouping for better organization
export const PermissionModules = {
  CORE: {
    name: 'Core System',
    permissions: [
      PermissionKeys.ROLES_VIEW,
      PermissionKeys.ROLES_CREATE,
      PermissionKeys.ROLES_UPDATE,
      PermissionKeys.ROLES_DELETE,
      PermissionKeys.ROLES_LIST,
      PermissionKeys.ROLES_ACCESS,
      PermissionKeys.PERMISSIONS_VIEW,
      PermissionKeys.PERMISSIONS_LIST,
      PermissionKeys.PERMISSIONS_ASSIGN,
      PermissionKeys.USERS_CREATE,
      PermissionKeys.USERS_UPDATE,
      PermissionKeys.USERS_VIEW,
      PermissionKeys.USERS_LIST,
      PermissionKeys.USERS_DELETE,
      PermissionKeys.USER_ROLES_ASSIGN,
      PermissionKeys.USER_ROLES_REMOVE,
      PermissionKeys.USER_ROLES_VIEW,
      PermissionKeys.USER_PERMISSIONS_ASSIGN,
      PermissionKeys.USER_PERMISSIONS_REMOVE,
      PermissionKeys.USER_PERMISSIONS_VIEW,
    ]
  },
  NABHA_MANAGEMENT: {
    name: 'Nabha Management',
    permissions: [
      PermissionKeys.NABHA_MANAGEMENT_ACCESS,
      PermissionKeys.INSTITUTE_VIEW,
      PermissionKeys.INSTITUTE_CREATE,
      PermissionKeys.INSTITUTE_UPDATE,
      PermissionKeys.INSTITUTE_DELETE,
      PermissionKeys.INSTITUTE_LIST,
      PermissionKeys.GOVT_SURVEY_VIEW,
      PermissionKeys.GOVT_SURVEY_CREATE,
      PermissionKeys.GOVT_SURVEY_UPDATE,
      PermissionKeys.GOVT_SURVEY_DELETE,
      PermissionKeys.GOVT_SURVEY_LIST,
      PermissionKeys.GOVT_SURVEY_SUBMIT,
      PermissionKeys.GOVT_SURVEY_APPROVE,
    ]
  },
  INSTITUTE_MANAGEMENT: {
    name: 'Institute Management',
    permissions: [
      PermissionKeys.INSTITUTE_MANAGEMENT_ACCESS,
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
      PermissionKeys.INSTITUTE_SURVEY_VIEW,
      PermissionKeys.INSTITUTE_SURVEY_CREATE,
      PermissionKeys.INSTITUTE_SURVEY_UPDATE,
      PermissionKeys.INSTITUTE_SURVEY_DELETE,
      PermissionKeys.INSTITUTE_SURVEY_LIST,
    ]
  },
  STUDENT_MANAGEMENT: {
    name: 'Student Management',
    permissions: [
      PermissionKeys.ASSIGNMENT_VIEW,
      PermissionKeys.ASSIGNMENT_CREATE,
      PermissionKeys.ASSIGNMENT_UPDATE,
      PermissionKeys.ASSIGNMENT_DELETE,
      PermissionKeys.ASSIGNMENT_LIST,
      PermissionKeys.ASSIGNMENT_SUBMIT,
      PermissionKeys.ASSIGNMENT_GRADE,
      PermissionKeys.LESSON_VIEW,
      PermissionKeys.LESSON_CREATE,
      PermissionKeys.LESSON_UPDATE,
      PermissionKeys.LESSON_DELETE,
      PermissionKeys.LESSON_LIST,
      PermissionKeys.LECTURE_CREATE,
      PermissionKeys.LECTURE_LIST,
      PermissionKeys.LECTURE_UPDATE,
      PermissionKeys.LECTURE_VIEW,
      PermissionKeys.LECTURE_DELETE,
      PermissionKeys.QUIZ_VIEW,
      PermissionKeys.QUIZ_CREATE,
      PermissionKeys.QUIZ_UPDATE,
      PermissionKeys.QUIZ_DELETE,
      PermissionKeys.QUIZ_LIST,
      PermissionKeys.QUIZ_TAKE,
      PermissionKeys.QUIZ_EVALUATE,
      PermissionKeys.PROGRESS_VIEW,
      PermissionKeys.PROGRESS_TRACK,
      PermissionKeys.PROGRESS_REPORT,
    ]
  },
  LEAVE_MANAGEMENT: {
    name: 'Leave Management',
    permissions: [
      PermissionKeys.LEAVE_MANAGEMENT_ACCESS,
      PermissionKeys.LEAVE_VIEW,
      PermissionKeys.LEAVE_CREATE,
      PermissionKeys.LEAVE_UPDATE,
      PermissionKeys.LEAVE_DELETE,
      PermissionKeys.LEAVE_LIST,
      PermissionKeys.LEAVE_APPROVE_VIEW,
      PermissionKeys.LEAVE_REJECT_VIEW,
    ]
  },
  STUDENT_UPLOAD: {
    name: 'Student Upload',
    permissions: [
      PermissionKeys.STUDENT_UPLOAD_ACCESS,
      PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
      PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,
      PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE,
      PermissionKeys.ASSIGNMENT_UPLOAD_DELETE,
      PermissionKeys.ASSIGNMENT_UPLOAD_LIST,
      PermissionKeys.LESSON_UPLOAD_VIEW,
      PermissionKeys.LESSON_UPLOAD_CREATE,
      PermissionKeys.LESSON_UPLOAD_UPDATE,
      PermissionKeys.LESSON_UPLOAD_DELETE,
      PermissionKeys.LESSON_UPLOAD_LIST,
    ]
  },
  DASHBOARD: {
    name: 'Dashboard',
    permissions: [
      PermissionKeys.DASHBOARD_ACCESS,
      PermissionKeys.DASHBOARD_OVERVIEW_VIEW,
      PermissionKeys.DASHBOARD_PROGRESS_VIEW,
      PermissionKeys.DASHBOARD_EVENTS_VIEW,
      PermissionKeys.DASHBOARD_QUIZ_VIEW,
    ]
  },
  COMMUNICATION: {
    name: 'Communication',
    permissions: [
      PermissionKeys.COMMUNICATION_ACCESS,
      PermissionKeys.CHATBOT_ACCESS,
      PermissionKeys.MESSAGING_SEND,
      PermissionKeys.MESSAGING_RECEIVE,
      PermissionKeys.CHAT_ACCESS,
    ]
  },
  SETTINGS: {
    name: 'Settings',
    permissions: [
      PermissionKeys.SETTINGS_ACCESS,
      PermissionKeys.SETTINGS_VIEW,
      PermissionKeys.SETTINGS_UPDATE,
      PermissionKeys.SYSTEM_CONFIG,
    ]
  },
  ADMINISTRATIVE: {
    name: 'Administrative',
    permissions: [
      PermissionKeys.ADMIN_ACCESS,
      PermissionKeys.SUPER_ADMIN,
      PermissionKeys.MODERATOR_ACCESS,
      PermissionKeys.INSTITUTE_ACCESS,
    ]
  },
  DATA_MANAGEMENT: {
    name: 'Data Management',
    permissions: [
      PermissionKeys.DATA_EXPORT,
      PermissionKeys.DATA_IMPORT,
    ]
  },
  AUDIT_REPORTS: {
    name: 'Audit & Reports',
    permissions: [
      PermissionKeys.AUDIT_LOGS_VIEW,
      PermissionKeys.REPORTS_GENERATE,
      PermissionKeys.REPORTS_VIEW,
    ]
  },
  FACULTY_MANAGEMENT: {
    name: 'Faculty Management',
    permissions: [
      PermissionKeys.FACULTY_MANAGEMENT_ACCESS,
    ]
  },
  STUDENT_QUERY: {
    name: 'Student Query',
    permissions: [
      PermissionKeys.STUDENT_QUERY_ACCESS,
    ]
  },
  GAMIFICATION: {
    name: 'Gamification',
    permissions: [
      PermissionKeys.GAMIFICATION_ACCESS,
      PermissionKeys.ACHIEVEMENTS_VIEW,
      PermissionKeys.BADGES_VIEW,
    ]
  },
  OFFLINE_LIBRARY: {
    name: 'Offline Library',
    permissions: [
      PermissionKeys.OFFLINE_LIBRARY_ACCESS,
      PermissionKeys.LIBRARY_ACCESS,
      PermissionKeys.LIBRARY_DOWNLOAD,
    ]
  },
  ISSUE_DISCUSSION: {
    name: 'Issue & Discussion',
    permissions: [
      PermissionKeys.ISSUE_DISCUSSION_ACCESS,
    ]
  },
  CONTENT_MANAGEMENT: {
    name: 'Content Management',
    permissions: [
      PermissionKeys.MATERIAL_VIEW,
      PermissionKeys.MATERIAL_CREATE,
      PermissionKeys.MATERIAL_LIST,
      PermissionKeys.MATERIAL_UPDATE,
      PermissionKeys.MATERIAL_DELETE,
      PermissionKeys.QNA_VIEW,
      PermissionKeys.QNA_CREATE,
      PermissionKeys.QNA_LIST,
      PermissionKeys.QUESTION_VIEW,
      PermissionKeys.QUESTION_CREATE,
      PermissionKeys.QUESTION_LIST,
    ]
  }
} as const;

export const permissions = Object.values(PermissionKeys).map((key) => ({
  permissionName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  permissionKey: key,
}));

// Single selection utility
export const getModulePermissions = (moduleKey: keyof typeof PermissionModules) => {
  return PermissionModules[moduleKey].permissions;
};

export const getAllModuleNames = () => {
  return Object.entries(PermissionModules).map(([key, module]) => ({
    key: key as keyof typeof PermissionModules,
    name: module.name,
    permissionCount: module.permissions.length
  }));
};