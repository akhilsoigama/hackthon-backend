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

router
  .group(() => {
    router.get('/profile', [AuthController, 'me'])
    router.post('logout', [AuthController, 'logout'])

    // Roles routes
    router
      .group(() => {
        router
          .get('/:id', [RolesController, 'getRoleWithPermissions'])
          .use(middleware.permission([PermissionKeys.ROLES_VIEW]))

        router
          .post('/', [RolesController, 'createRoleWithPermissions'])
          .use(middleware.permission([PermissionKeys.ROLES_CREATE]))

        router
          .put('/:id', [RolesController, 'updateRole'])
          .use(middleware.permission([PermissionKeys.ROLES_UPDATE]))

        router
          .get('/', [RolesController, 'getAllRoleWithPermissions'])
          .use(middleware.permission([PermissionKeys.ROLES_LIST]))

        router
          .delete('/:id', [RolesController, 'deleteRole'])
          .use(middleware.permission([PermissionKeys.ROLES_DELETE]))
      })
      .prefix('/roles')

    // Permissions route
    router
      .get('/permissions', [PermissionsController, 'getAllPermissions'])
      .use(middleware.permission([PermissionKeys.PERMISSIONS_LIST]))

    // Users routes
    router
      .resource('users', UsersController)
      .apiOnly()
      .middleware('store', middleware.permission([PermissionKeys.USERS_CREATE]))
      .middleware('update', middleware.permission([PermissionKeys.USERS_UPDATE]))
      .middleware('show', middleware.permission([PermissionKeys.USERS_VIEW]))
      .middleware('index', middleware.permission([PermissionKeys.USERS_LIST]))
      .middleware('destroy', middleware.permission([PermissionKeys.USERS_DELETE]))

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
      .group(() => {
        router
          .get('/', [InstitutesController, 'index'])
          .use(middleware.permission([PermissionKeys.INSTITUTE_LIST]))

        router
          .post('/', [InstitutesController, 'store'])
          .use(middleware.permission([PermissionKeys.INSTITUTE_CREATE]))

        router
          .get('/:id', [InstitutesController, 'show'])
          .use(middleware.permission([PermissionKeys.INSTITUTE_VIEW]))

        router
          .put('/:id', [InstitutesController, 'update'])
          .use(middleware.permission([PermissionKeys.INSTITUTE_UPDATE]))

        router
          .delete('/:id', [InstitutesController, 'destroy'])
          .use(middleware.permission([PermissionKeys.INSTITUTE_DELETE]))
      })
      .prefix('/institutes')

    // Department Routes
    router
      .group(() => {
        router
          .get('/', [DepartmentsController, 'index'])
          .use(middleware.permission([PermissionKeys.DEPARTMENT_LIST]))

        router
          .post('/', [DepartmentsController, 'store'])
          .use(middleware.permission([PermissionKeys.DEPARTMENT_CREATE]))

        router
          .get('/:id', [DepartmentsController, 'show'])
          .use(middleware.permission([PermissionKeys.DEPARTMENT_VIEW]))

        router
          .put('/:id', [DepartmentsController, 'update'])
          .use(middleware.permission([PermissionKeys.DEPARTMENT_UPDATE]))

        router
          .delete('/:id', [DepartmentsController, 'destroy'])
          .use(middleware.permission([PermissionKeys.DEPARTMENT_DELETE]))
      })
      .prefix('/departments')

    //lecture upload
    router
      .group(() => {
        router
          .get('/', [LectureUploadsController, 'index'])
          .use(middleware.permission([PermissionKeys.LECTURE_LIST]))

        router
          .post('/', [LectureUploadsController, 'store'])
          .use(middleware.permission([PermissionKeys.LECTURE_CREATE]))

        router
          .get('/:id', [LectureUploadsController, 'show'])
          .use(middleware.permission([PermissionKeys.LECTURE_VIEW]))

        router
          .put('/:id', [LectureUploadsController, 'update'])
          .use(middleware.permission([PermissionKeys.LECTURE_UPDATE]))

        router
          .delete('/:id', [LectureUploadsController, 'destroy'])
          .use(middleware.permission([PermissionKeys.LECTURE_DELETE]))
      })
      .prefix('/lectures')
      
      //faculty create
    router
      .group(() => {
        router
          .get('/', [FacultyController, 'index'])
          .use(middleware.permission([PermissionKeys.FACULTY_LIST]))

        router
          .post('/', [FacultyController, 'store'])
          .use(middleware.permission([PermissionKeys.FACULTY_CREATE]))

        router
          .get('/:id', [FacultyController, 'show'])
          .use(middleware.permission([PermissionKeys.FACULTY_VIEW]))

        router
          .put('/:id', [FacultyController, 'update'])
          .use(middleware.permission([PermissionKeys.FACULTY_UPDATE]))

        router
          .delete('/:id', [FacultyController, 'destroy'])
          .use(middleware.permission([PermissionKeys.FACULTY_DELETE]))
      })
      .prefix('/faculty')
  })
  .use(middleware.auth({ guards: ['adminapi', 'api'] }))

router.any('*', ({ response }) => {
  return response.status(404).json({
    success: false,
    message: 'Route not found',
  })
})
