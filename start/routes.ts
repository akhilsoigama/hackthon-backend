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

// Public Routes (No authentication required)
router.post('/login', [AuthController, 'login'])
router.post('/chatbot', [ChatBotController, 'chat'])
router.post('/translate', [TranslatesController, 'translateMessage'])
router.get('/test-db', [AuthController, 'testDB'])

// Manual sync routes (temporary - no auth required for initial setup)
router.post('/sync/institutes', [AuthController, 'syncAllInstitutes'])
router.post('/sync/faculties', [AuthController, 'syncAllFaculties'])
router.post('/sync/institute', [AuthController, 'syncInstitute'])
router.post('/sync/faculty', [AuthController, 'syncFaculty'])

// Protected Routes (Authentication required)
router
  .group(() => {
    // Auth routes
    router.get('/profile', [AuthController, 'me'])
    router.post('logout', [AuthController, 'logout'])
    router.get('/auth-type', [AuthController, 'getAuthType'])
    router.get('/my-permissions', [AuthController, 'getMyPermissions'])
    router.post('/check-permission', [AuthController, 'checkPermission'])

    // Roles routes - FIXED: Using custom routes instead of resource
    router
      .get('/roles', [RolesController, 'getAllRoleWithPermissions'])
      .use(middleware.permission([PermissionKeys.ROLES_LIST]))

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
      .use(middleware.permission([PermissionKeys.PERMISSIONS_LIST]))

    router
      .get('/permissions/:id', [PermissionsController, 'show'])
      .use(middleware.permission([PermissionKeys.PERMISSIONS_VIEW]))

    // Users routes
    router
      .resource('users', UsersController)
      .apiOnly()
      .middleware('store', middleware.permission([PermissionKeys.USERS_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.USERS_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.USERS_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.USERS_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.USERS_DELETE]))

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
      .middleware('store', middleware.permission([PermissionKeys.INSTITUTE_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.INSTITUTE_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.INSTITUTE_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.INSTITUTE_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.INSTITUTE_DELETE]))

    // Department Routes
    router
      .resource('departments', DepartmentsController)
      .apiOnly()
      .middleware('store', middleware.permission([PermissionKeys.DEPARTMENT_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.DEPARTMENT_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.DEPARTMENT_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.DEPARTMENT_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.DEPARTMENT_DELETE]))


    // Lecture upload routes
    router
      .resource('lectures', LectureUploadsController)
      .apiOnly()
      .middleware('store', middleware.permission([PermissionKeys.LECTURE_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.LECTURE_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.LECTURE_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.LECTURE_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.LECTURE_DELETE]))

    // Faculty routes
    router
      .resource('faculty', FacultyController)
      .apiOnly()
      .middleware('store', middleware.permission([PermissionKeys.FACULTY_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.FACULTY_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.FACULTY_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.FACULTY_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.FACULTY_DELETE]))

  })
  .use(middleware.auth({ guards: ['adminapi', 'api'] }))

// 404 Handler
router.any('*', ({ response }) => {
  return response.status(404).json({
    success: false,
    message: 'Route not found',
  })
})