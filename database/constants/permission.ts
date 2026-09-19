export enum PermissionKeys {
  ADMIN_MANAGEMENT_ACCESS = "admin_management_access",
  CORE_MANAGEMENT_ACCESS = "core_management_access",
  INSTITUTE_MANAGEMENT_ACCESS = "institute_management_access",
  FACULTY_MANAGEMENT_ACCESS = "faculty_management_access",
  STUDENT_QUERY_ACCESS = "student_query_access",
  LEAVE_MANAGEMENT_ACCESS = "leave_management_access",
  STUDENT_UPLOAD_ACCESS = "student_upload_access",
  DASHBOARD_ACCESS = "dashboard_access",
  COMMUNICATION_ACCESS = "communication_access",
  GAMIFICATION_ACCESS = "gamification_access",
  OFFLINE_LIBRARY_ACCESS = "offline_library_access",
  STUDENT_QNA_ACCESS = "student_qna_access",
  SETTINGS_ACCESS = "settings_access",
  EVENTS_ACCESS = "events_access",
  FACULTY_ANSWER_QNA_ACCESS = "faculty_answer_qna_access",

  FACULTY_ALL_QUESTIONS_QNA_VIEW = "faculty_all_questions_qna_view",
  FACULTY_VIEW_QNA_ACCESS = "faculty_view_qna_access",
  FACULTY_UNANSWERED_QUESTIONS_QNA_VIEW = "faculty_unanswered_questions_qna_view",

  STUDENT_ALL_QUESTIONS_QNA_VIEW = "student_all_questions_qna_view",
  STUDENT_ASK_QNA_CREATE = "student_ask_qna_create",
  STUDENT_ASK_QNA_UPDATE = "student_ask_qna_update",
  STUDENT_ASK_QNA_DELETE = "student_ask_qna_delete",

  // ========== CORE MODULES ==========
  // Role & Permission Management
  ROLES_VIEW = "roles_view",
  ROLES_CREATE = "roles_create",
  ROLES_UPDATE = "roles_update",
  ROLES_DELETE = "roles_delete",
  ROLES_LIST = "roles_list",

  PERMISSIONS_VIEW = "permissions_view",

  // User Management
  USERS_CREATE = "users_create",
  USERS_UPDATE = "users_update",
  USERS_VIEW = "users_view",
  USERS_LIST = "users_list",
  USERS_DELETE = "users_delete",

  USER_ROLES_ASSIGN = "user_roles_assign",
  USER_ROLES_REMOVE = "user_roles_remove",
  USER_ROLES_VIEW = "user_roles_view",

  // ========== NABHA MANAGEMENT MODULE ==========
  // Institute
  INSTITUTE_VIEW = "institute_view",
  INSTITUTE_CREATE = "institute_create",
  INSTITUTE_UPDATE = "institute_update",
  INSTITUTE_DELETE = "institute_delete",
  INSTITUTE_LIST = "institute_list",

  GOVT_SURVEY_VIEW = "govt_survey_view",
  GOVT_SURVEY_CREATE = "govt_survey_create",
  GOVT_SURVEY_UPDATE = "govt_survey_update",
  GOVT_SURVEY_DELETE = "govt_survey_delete",
  GOVT_SURVEY_LIST = "govt_survey_list",

  // ========== INSTITUTE MANAGEMENT MODULE ==========
  // Faculty
  FACULTY_VIEW = "faculty_view",
  FACULTY_CREATE = "faculty_create",
  FACULTY_UPDATE = "faculty_update",
  FACULTY_DELETE = "faculty_delete",
  FACULTY_LIST = "faculty_list",

  // Student
  STUDENT_VIEW = "student_view",
  STUDENT_CREATE = "student_create",
  STUDENT_UPDATE = "student_update",
  STUDENT_DELETE = "student_delete",
  STUDENT_LIST = "student_list",

  // Department
  DEPARTMENT_VIEW = "department_view",
  DEPARTMENT_CREATE = "department_create",
  DEPARTMENT_UPDATE = "department_update",
  DEPARTMENT_DELETE = "department_delete",

  // Institute Survey
  INSTITUTE_SURVEY_VIEW = "institute_survey_view",
  INSTITUTE_SURVEY_CREATE = "institute_survey_create",
  INSTITUTE_SURVEY_UPDATE = "institute_survey_update",
  INSTITUTE_SURVEY_DELETE = "institute_survey_delete",
  INSTITUTE_SURVEY_LIST = "institute_survey_list",

  INSTITUTEWITHGOVT_EVENT_VIEW = "institute_with_govt_event_view",

  // ========== STUDENT MANAGEMENT MODULE ==========
  // Assignment
  ASSIGNMENT_VIEW = "assignment_view",
  ASSIGNMENT_CREATE = "assignment_create",
  ASSIGNMENT_UPDATE = "assignment_update",
  ASSIGNMENT_DELETE = "assignment_delete",
  ASSIGNMENT_LIST = "assignment_list",

  // Lecture Upload
  LECTURE_CREATE = "lecture_create",
  LECTURE_LIST = "lecture_list",
  LECTURE_UPDATE = "lecture_update",
  LECTURE_VIEW = "lecture_view",
  LECTURE_DELETE = "lecture_delete",

  // Quiz
  QUIZ_VIEW = "quiz_view",
  QUIZ_CREATE = "quiz_create",
  QUIZ_UPDATE = "quiz_update",
  QUIZ_DELETE = "quiz_delete",
  QUIZ_LIST = "quiz_list",
  QUIZ_ATTEMPT_CREATE = "quiz_attempt_create",
  QUIZ_ATTEMPT_VIEW = "quiz_attempt_view",
  QUIZ_ATTEMPT_LIST = "quiz_attempt_list",

  // Progress
  STUDENT_PROGRESS_VIEW = "student_progress_view",
  FACULTY_STUDENT_PROGRESS_VIEW = "faculty_student_progress_view",

  // ========== LEAVE MANAGEMENT MODULE ==========
  LEAVE_CREATE = "leave_create",
  LEAVE_UPDATE = "leave_update",
  LEAVE_DELETE = "leave_delete",
  LEAVE_LIST = "leave_list",
  LEAVE_APPROVE_VIEW = "leave_approve",
  LEAVE_REJECT_VIEW = "leave_reject",

  // ========== STUDENT UPLOAD MODULE ==========
  // Assignment Upload
  ASSIGNMENT_UPLOAD_VIEW = "assignment_upload_view",
  ASSIGNMENT_UPLOAD_CREATE = "assignment_upload_create",
  ASSIGNMENT_UPLOAD_UPDATE = "assignment_upload_update",
  ASSIGNMENT_UPLOAD_DELETE = "assignment_upload_delete",
  ASSIGNMENT_UPLOAD_LIST = "assignment_upload_list",

  // ========== DASHBOARD MODULE ==========
  DASHBOARD_OVERVIEW_VIEW = "dashboard_overview_view",

  // ========== COMMUNICATION MODULE ==========
  CHATBOT_ACCESS = "chatbot_access",

  SKILL_LEARNING_ACCESS="skill_learning_access",

  SKILL_SPOKEN_ENGLISH_VIEW="skill_spoken_english_view",
  SKILL_COMPUTER_VIEW="skill_computer_view",
  SKILL_CODING_VIEW="skill_coding_view",
  SKILL_DIGITAL_VIEW="skill_digital_view",
  SKILL_CAREER_VIEW="skill_career_view",
  SKILL_SOFTSKILL_VIEW="skill_softskill_view",
  SKILL_GOVT_EXAM_VIEW="skill_govt_exam_view",
  SKILL_CERTIFICATE_VIEW="skill_certificate_view",

  // ========== RAG SKILL MODULE ==========
  SKILL_RAG_ACCESS = "skill_rag_access",
  SKILL_RAG_COURSE_CREATE = "skill_rag_course_create",
  SKILL_RAG_COURSE_VIEW = "skill_rag_course_view",
}
export const PermissionModules = {
  CORE: {
    name: "Core System",
    permissions: [
      PermissionKeys.ROLES_VIEW,
      PermissionKeys.ROLES_CREATE,
      PermissionKeys.ROLES_UPDATE,
      PermissionKeys.ROLES_DELETE,
      PermissionKeys.PERMISSIONS_VIEW,
      PermissionKeys.USERS_CREATE,
      PermissionKeys.USERS_UPDATE,
      PermissionKeys.USERS_VIEW,
      PermissionKeys.USERS_DELETE,
      PermissionKeys.USER_ROLES_ASSIGN,
      PermissionKeys.USER_ROLES_REMOVE,
      PermissionKeys.USER_ROLES_VIEW,
    ],
  },
  NABHA_MANAGEMENT: {
    name: "Nabha Management",
    permissions: [
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
    ],
  },
  INSTITUTE_MANAGEMENT: {
    name: "Institute Management",
    permissions: [
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
      PermissionKeys.INSTITUTE_SURVEY_VIEW,
      PermissionKeys.INSTITUTE_SURVEY_CREATE,
      PermissionKeys.INSTITUTE_SURVEY_UPDATE,
      PermissionKeys.INSTITUTE_SURVEY_DELETE,
      PermissionKeys.INSTITUTE_SURVEY_LIST,
      PermissionKeys.INSTITUTEWITHGOVT_EVENT_VIEW,
    ],
  },
  STUDENT_MANAGEMENT: {
    name: "Student Management",
    permissions: [
      PermissionKeys.ASSIGNMENT_VIEW,
      PermissionKeys.ASSIGNMENT_CREATE,
      PermissionKeys.ASSIGNMENT_UPDATE,
      PermissionKeys.ASSIGNMENT_DELETE,
      PermissionKeys.ASSIGNMENT_LIST,
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
      PermissionKeys.QUIZ_ATTEMPT_CREATE,
      PermissionKeys.QUIZ_ATTEMPT_VIEW,
      PermissionKeys.QUIZ_ATTEMPT_LIST,
      PermissionKeys.STUDENT_PROGRESS_VIEW,
      PermissionKeys.FACULTY_STUDENT_PROGRESS_VIEW,
    ],
  },
  LEAVE_MANAGEMENT: {
    name: "Leave Management",
    permissions: [
      PermissionKeys.LEAVE_CREATE,
      PermissionKeys.LEAVE_UPDATE,
      PermissionKeys.LEAVE_DELETE,
      PermissionKeys.LEAVE_LIST,
      PermissionKeys.LEAVE_APPROVE_VIEW,
      PermissionKeys.LEAVE_REJECT_VIEW,
    ],
  },
  STUDENT_UPLOAD: {
    name: "Student Upload",
    permissions: [
      PermissionKeys.ASSIGNMENT_UPLOAD_VIEW,
      PermissionKeys.ASSIGNMENT_UPLOAD_CREATE,
      PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE,
      PermissionKeys.ASSIGNMENT_UPLOAD_DELETE,
      PermissionKeys.ASSIGNMENT_UPLOAD_LIST,
    ],
  },
  STUDENT_SKILLS:{
    name: "Student Skills",
    permissions: [
      PermissionKeys.SKILL_LEARNING_ACCESS,
      PermissionKeys.SKILL_SPOKEN_ENGLISH_VIEW,
      PermissionKeys.SKILL_COMPUTER_VIEW,
      PermissionKeys.SKILL_CODING_VIEW,
      PermissionKeys.SKILL_DIGITAL_VIEW,
      PermissionKeys.SKILL_CAREER_VIEW,
      PermissionKeys.SKILL_SOFTSKILL_VIEW,
      PermissionKeys.SKILL_GOVT_EXAM_VIEW,
      PermissionKeys.SKILL_CERTIFICATE_VIEW,
      // RAG
      PermissionKeys.SKILL_RAG_ACCESS,
      PermissionKeys.SKILL_RAG_COURSE_CREATE,
      PermissionKeys.SKILL_RAG_COURSE_VIEW,
    ],
  },
  DASHBOARD: {
    name: "Dashboard",
    permissions: [PermissionKeys.DASHBOARD_OVERVIEW_VIEW],
  },
  COMMUNICATION: {
    name: "Communication",
    permissions: [PermissionKeys.CHATBOT_ACCESS],
  },
  FACULTIES_QNA: {
    name: "Faculties QnA",
    permissions: [
      PermissionKeys.FACULTY_ALL_QUESTIONS_QNA_VIEW,
      PermissionKeys.FACULTY_ANSWER_QNA_ACCESS,
      PermissionKeys.FACULTY_VIEW_QNA_ACCESS,
      PermissionKeys.FACULTY_UNANSWERED_QUESTIONS_QNA_VIEW,
    ],
  },
  STUDENT_QUERY: {
    name: "Student Query",
    permissions: [
      PermissionKeys.STUDENT_QUERY_ACCESS,
      PermissionKeys.STUDENT_ALL_QUESTIONS_QNA_VIEW,
      PermissionKeys.STUDENT_ASK_QNA_CREATE,
      PermissionKeys.STUDENT_ASK_QNA_UPDATE,
      PermissionKeys.STUDENT_ASK_QNA_DELETE,
    ],
  },
} as const;
export const permissions = Object.values(PermissionKeys).map((key) => ({
  permissionName: key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()),
  permissionKey: key,
}));

// Single selection utility
export const getModulePermissions = (
  moduleKey: keyof typeof PermissionModules,
) => {
  return PermissionModules[moduleKey].permissions;
};

export const getAllModuleNames = () => {
  return Object.entries(PermissionModules).map(([key, module]) => ({
    key: key as keyof typeof PermissionModules,
    name: module.name,
    permissionCount: module.permissions.length,
  }));
};
