/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import AuthController from '#controllers/auth_controller'
import RolesController from '#controllers/roles_controller'
import { PermissionKeys } from '#database/constants/permission'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import PermissionsController from '#controllers/permissions_controller'
import UsersController from '#controllers/users_controller'
import InstitutesController from '#controllers/institutes_controller'
import DepartmentsController from '#controllers/departments_controller'
import FacultyController from '#controllers/faculties_controller'
import ChatBotController from '#controllers/chatBotController'
import TranslatesController from '#controllers/translates_controller'
import LectureUploadsController from '#controllers/lacture_uploads_controller'
import PingController from '#controllers/ping_controller'
import StudentController from '#controllers/student_controller'
import GovtEventsController from '#controllers/govt_events_controller'
import InstituteEventsController from '#controllers/institute_events_controller'
import AssignmentsController from '#controllers/assignments_controller'
import QuizzesControllersController from '#controllers/quizzes_controllers_controller'
import QuizAttemptController from '#controllers/quiz_attempt_controller'
import AssignmentUploadsController from '#controllers/assignment_uploads_controller'
import { RateLimitConfigs } from '../app/helper/rate_limiter.js'
import FacultyLeaveController from '#controllers/faculty_leave_controller'
import StudentQueriesController from '#controllers/student_queries_controller'

router.post('/login', [AuthController, 'login']).use(middleware.rateLimit({ config: RateLimitConfigs.auth }))
router.post('/translate', [TranslatesController, 'translateMessage'])
router.get('/test-db', [AuthController, 'testDB'])

router.post('/sync/institutes', [AuthController, 'syncAllInstitutes'])
router.post('/sync/faculties', [AuthController, 'syncAllFaculties'])
router.post('/sync/institute', [AuthController, 'syncInstitute'])
router.post('/sync/faculty', [AuthController, 'syncFaculty'])

router.get('/ping', [PingController, 'handle'])

// DEBUG ENDPOINT - TEMPORARY
router.get('/debug/auth-headers', ({ request, response }) => {
  const authHeader = request.header('authorization')
  const cookieHeader = request.header('cookie')
  const allHeaders = request.headers()
  
  return response.json({
    success: true,
    debug: {
      authorizationHeader: authHeader || 'NOT PRESENT',
      cookieHeader: cookieHeader || 'NOT PRESENT',
      allHeaders: allHeaders,
      method: request.method(),
      url: request.url(),
    }
  })
})

router
  .group(() => {
    router
      .post('/chatbot', [ChatBotController, 'chat'])
      .use(middleware.rateLimit({ config: RateLimitConfigs.chatbot }))
      .use(middleware.permission([PermissionKeys.DEPARTMENT_CREATE]))

    // Auth routes
    router.get('/profile', [AuthController, 'me'])
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
  })
  .use(middleware.rateLimit({ config: RateLimitConfigs.api }))
  .use(middleware.auth({ guards: ['adminapi', 'api'] }))

router.any('*', ({ response }) => {
  return response.status(404).json({
    success: false,
    message: 'Route not found',
  })
})
