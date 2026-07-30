/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller')
const RolesController = () => import('#controllers/roles_controller')
import { PermissionKeys } from '#database/constants/permission'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const PermissionsController = () => import('#controllers/permissions_controller')
const UsersController = () => import('#controllers/users_controller')
const InstitutesController = () => import('#controllers/institutes_controller')
const DepartmentsController = () => import('#controllers/departments_controller')
const FacultyController = () => import('#controllers/faculties_controller')
const ChatBotController = () => import('#controllers/chatBotController')
const LectureUploadsController = () => import('#controllers/lacture_uploads_controller')
const PingController = () => import('#controllers/ping_controller')
const StudentController = () => import('#controllers/student_controller')
const GovtEventsController = () => import('#controllers/govt_events_controller')
const InstituteEventsController = () => import('#controllers/institute_events_controller')
const AssignmentsController = () => import('#controllers/assignments_controller')
const QuizzesControllersController = () => import('#controllers/quizzes_controllers_controller')
const QuizAttemptController = () => import('#controllers/quiz_attempt_controller')
const AssignmentUploadsController = () => import('#controllers/assignment_uploads_controller')
import { RateLimitConfigs } from '../app/helper/rate_limiter.js'
const FacultyLeaveController = () => import('#controllers/faculty_leave_controller')
const StudentQueriesController = () => import('#controllers/student_queries_controller')
const InstituteEventWithGovtEventsController = () => import('#controllers/institute_event_with_govt_events_controller')
const OnlineLibrariesController = () => import('#controllers/online_libraries_controller')
const ContactController = () => import('#controllers/contactuses_controller')

router
  .post('/login', [AuthController, 'login'])
  .use(middleware.rateLimit({ config: RateLimitConfigs.auth }))
router.get('/test-db', [AuthController, 'testDB'])
router.post('/api/contact', [ContactController, 'store'])
router.post('/sync/institutes', [AuthController, 'syncAllInstitutes'])
router.post('/sync/faculties', [AuthController, 'syncAllFaculties'])
router.post('/sync/institute', [AuthController, 'syncInstitute'])
router.post('/sync/faculty', [AuthController, 'syncFaculty'])

router.get('/ping', [PingController, 'handle'])
router.get('/api/online-library/search', [OnlineLibrariesController, 'search'])
router.get('/api/online-library/metadata/:identifier', [OnlineLibrariesController, 'metadata'])
router
  .group(() => {
    router
      .post('/chatbot', [ChatBotController, 'chat'])
      .use(middleware.rateLimit({ config: RateLimitConfigs.chatbot }))
      .use(middleware.permission([PermissionKeys.CHATBOT_ACCESS]))

    // Auth routes
    router
      .get('/profile', [AuthController, 'me'])
      .use(middleware.auth({ guards: ['adminapi', 'api'] }))
    router.post('/logout', [AuthController, 'logout'])
    router.get('/auth-type', [AuthController, 'getAuthType'])
    router.get('/my-permissions', [AuthController, 'getMyPermissions'])
    router.post('/check-permission', [AuthController, 'checkPermission'])

    // Roles routes
    router
      .get('/roles', [RolesController, 'getAllRoleWithPermissions'])
      .use(middleware.permission([PermissionKeys.ROLES_VIEW]))

    router
      .post('/roles', [RolesController, 'createRoleWithPermissions'])
      .use(middleware.permission([PermissionKeys.ROLES_CREATE]))

    router
      .get('/roles/:id', [RolesController, 'getRoleWithPermissions'])
      .use(middleware.permission([PermissionKeys.ROLES_VIEW]))

    router
      .put('/roles/:id', [RolesController, 'updateRole'])
      .use(middleware.permission([PermissionKeys.ROLES_UPDATE]))

    router
      .delete('/roles/:id', [RolesController, 'deleteRole'])
      .use(middleware.permission([PermissionKeys.ROLES_DELETE]))

    // Permissions routes
    router
      .get('/permissions', [PermissionsController, 'getAllPermissions'])
      .use(middleware.permission([PermissionKeys.PERMISSIONS_VIEW]))

    router
      .get('/permissions/:id', [PermissionsController, 'show'])
      .use(middleware.permission([PermissionKeys.PERMISSIONS_VIEW]))

    // Users routes
    router
      .resource('users', UsersController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.USERS_CREATE]))
      .use('update', middleware.permission([PermissionKeys.USERS_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.USERS_VIEW]))
      .use('index', middleware.permission([PermissionKeys.USERS_VIEW]))
      .use('destroy', middleware.permission([PermissionKeys.USERS_DELETE]))

    // User role management routes
    router
      .post('/users/:id/roles', [UsersController, 'assignRoles'])
      .use(middleware.permission([PermissionKeys.USER_ROLES_ASSIGN]))

    router
      .delete('/users/:id/roles/:roleId', [UsersController, 'removeRole'])
      .use(middleware.permission([PermissionKeys.USER_ROLES_REMOVE]))

    router
      .get('/users/:id/roles', [UsersController, 'getUserRoles'])
      .use(middleware.permission([PermissionKeys.USER_ROLES_VIEW]))

    // Institute Routes
    router
      .get('/institutes/overview', [InstitutesController, 'progressReport'])
      .use(middleware.auth({ guards: ['adminapi', 'api'] }))
      .use(middleware.permission([PermissionKeys.DASHBOARD_OVERVIEW_VIEW]))
    router
      .resource('institutes', InstitutesController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.INSTITUTE_CREATE]))
      .use('update', middleware.permission([PermissionKeys.INSTITUTE_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.INSTITUTE_VIEW]))
      .use('index', middleware.permission([PermissionKeys.INSTITUTE_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.INSTITUTE_DELETE]))

    // Department Routes
    router
      .resource('departments', DepartmentsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.DEPARTMENT_CREATE]))
      .use('update', middleware.permission([PermissionKeys.DEPARTMENT_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.DEPARTMENT_VIEW]))
      .use('index', middleware.permission([PermissionKeys.DEPARTMENT_VIEW]))
      .use('destroy', middleware.permission([PermissionKeys.DEPARTMENT_DELETE]))

    // Lecture upload routes - SIMPLIFIED VERSION
    router
      .resource('lectures', LectureUploadsController)
      .apiOnly()
      .use('store', middleware.permission([PermissionKeys.LECTURE_CREATE]))
      .use('update', middleware.permission([PermissionKeys.LECTURE_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.LECTURE_VIEW]))
      .use('index', middleware.permission([PermissionKeys.LECTURE_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.LECTURE_DELETE]))

    // Faculty Routes
    router
      .resource('faculty', FacultyController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.FACULTY_CREATE]))
      .use('update', middleware.permission([PermissionKeys.FACULTY_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.FACULTY_VIEW]))
      .use('index', middleware.permission([PermissionKeys.FACULTY_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.FACULTY_DELETE]))

    // Student Routes
    router
      .resource('student', StudentController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.STUDENT_CREATE]))
      .use('update', middleware.permission([PermissionKeys.STUDENT_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.STUDENT_VIEW]))
      .use('index', middleware.permission([PermissionKeys.STUDENT_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.STUDENT_DELETE]))

    // Student Progress Routes
    router
      .get('/student-queries/progress-report', [StudentQueriesController, 'progressReport'])
      .use(middleware.auth({ guards: ['adminapi', 'api'] }))
      .use(middleware.studentProgressPermission())
    // Student Query Routes
    router
      .resource('student-queries', StudentQueriesController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('*', middleware.permission([PermissionKeys.STUDENT_QUERY_ACCESS]))

    // Govt Routes
    router
      .resource('govtEvent', GovtEventsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.GOVT_SURVEY_CREATE]))
      .use('update', middleware.permission([PermissionKeys.GOVT_SURVEY_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.GOVT_SURVEY_VIEW]))
      .use('index', middleware.permission([PermissionKeys.GOVT_SURVEY_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.GOVT_SURVEY_DELETE]))

    // Institute Routes
    router
      .resource('instituteEvent', InstituteEventsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.INSTITUTE_SURVEY_CREATE]))
      .use('update', middleware.permission([PermissionKeys.INSTITUTE_SURVEY_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.INSTITUTE_SURVEY_VIEW]))
      .use('index', middleware.permission([PermissionKeys.INSTITUTE_SURVEY_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.INSTITUTE_SURVEY_DELETE]))

    // Assignment Routes
    router
      .resource('assignments', AssignmentsController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.ASSIGNMENT_CREATE]))
      .use('update', middleware.permission([PermissionKeys.ASSIGNMENT_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.ASSIGNMENT_VIEW]))
      .use('index', middleware.permission([PermissionKeys.ASSIGNMENT_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.ASSIGNMENT_DELETE]))

    // Quiz Routes
    router
      .resource('quizzes', QuizzesControllersController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.QUIZ_CREATE]))
      .use('update', middleware.permission([PermissionKeys.QUIZ_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.QUIZ_VIEW]))
      .use('index', middleware.permission([PermissionKeys.QUIZ_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.QUIZ_DELETE]))

    // Quiz Attempt Routes
    router
      .resource('quiz-attempts', QuizAttemptController)
      .apiOnly()
      .use('*', middleware.auth({ guards: ['adminapi', 'api'] }))
      .use('store', middleware.permission([PermissionKeys.QUIZ_ATTEMPT_CREATE]))
      .use('show', middleware.permission([PermissionKeys.QUIZ_ATTEMPT_VIEW]))
      .use('index', middleware.permission([PermissionKeys.QUIZ_ATTEMPT_LIST]))

    // Assignment Upload Routes
    router
      .resource('assignment-uploads', AssignmentUploadsController)
      .apiOnly()
      .use('store', middleware.rateLimit({ config: RateLimitConfigs.uploadStore }))
      .use('store', middleware.permission([PermissionKeys.ASSIGNMENT_UPLOAD_CREATE]))
      .use('update', middleware.rateLimit({ config: RateLimitConfigs.uploadUpdate }))
      .use('update', middleware.permission([PermissionKeys.ASSIGNMENT_UPLOAD_UPDATE]))
      .use('show', middleware.permission([PermissionKeys.ASSIGNMENT_UPLOAD_VIEW]))
      .use('index', middleware.permission([PermissionKeys.ASSIGNMENT_UPLOAD_LIST]))
      .use('destroy', middleware.permission([PermissionKeys.ASSIGNMENT_UPLOAD_DELETE]))

    // Faculty Leave Routes
    router
      .post('/faculty-leaves', [FacultyLeaveController, 'store'])
      .use(middleware.permission([PermissionKeys.LEAVE_CREATE]))

    router
      .get('/faculty-leaves', [FacultyLeaveController, 'index'])
      .use(middleware.permission([PermissionKeys.LEAVE_LIST]))

    router
      .patch('/faculty-leaves/:id', [FacultyLeaveController, 'update'])
      .use(middleware.permission([PermissionKeys.LEAVE_UPDATE]))

    router
      .delete('/faculty-leaves/:id', [FacultyLeaveController, 'destroy'])
      .use(middleware.permission([PermissionKeys.LEAVE_DELETE]))

    router
      .patch('/faculty-leaves/:id/approve', [FacultyLeaveController, 'approve'])
      .use(middleware.permission([PermissionKeys.LEAVE_APPROVE_VIEW]))

    router
      .patch('/faculty-leaves/:id/reject', [FacultyLeaveController, 'reject'])
      .use(middleware.permission([PermissionKeys.LEAVE_REJECT_VIEW]))

    router
      .resource('institute-events-with-govt-events', InstituteEventWithGovtEventsController)
      .apiOnly()
      .use('index', middleware.permission([PermissionKeys.INSTITUTEWITHGOVT_EVENT_VIEW]))
  })
  .use(middleware.rateLimit({ config: RateLimitConfigs.api }))
  .use(middleware.auth({ guards: ['adminapi', 'api'] }))

router.any('*', ({ response }) => {
  return response.status(404).json({
    success: false,
    message: 'Route not found',
  })
})
