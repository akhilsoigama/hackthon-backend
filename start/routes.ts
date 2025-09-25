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

router.post('login', [AuthController, 'login'])
// router.post('admin/login', [AuthController, 'adminLogin'])
router.get('profile', [AuthController, 'getProfile'])

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
  })
  .prefix('/roles')
  .use(middleware.auth({ guards: ['adminapi', 'api'] }))

router
.get('/permissions', [PermissionsController, 'getAllPermissions'])
.use(middleware.auth({ guards: ['adminapi', 'api'] }))
.use(middleware.permission([PermissionKeys.PERMISSIONS_LIST]))

router
  .resource('users', UsersController)
  .apiOnly()
  .use('*', middleware.auth({ guards: ['adminapi'] }))
  .middleware('store', middleware.permission([PermissionKeys.USERS_CREATE]))
  .middleware('update', middleware.permission([PermissionKeys.USERS_UPDATE]))
  .middleware('show', middleware.permission([PermissionKeys.USERS_VIEW]))
  .middleware('index', middleware.permission([PermissionKeys.USERS_LIST]))
  .middleware('destroy', middleware.permission([PermissionKeys.USERS_DELETE]))

router
  .post('/users/:id/roles', [UsersController, 'assignRoles'])
  .use(middleware.auth({ guards: ['adminapi'] }))
  .use(middleware.permission([PermissionKeys.USER_ROLES_ASSIGN]))

router
  .delete('/users/:id/roles/:roleId', [UsersController, 'removeRole'])
  .use(middleware.auth({ guards: ['adminapi'] }))
  .use(middleware.permission([PermissionKeys.USER_ROLES_REMOVE]))

router
  .get('/users/:id/roles', [UsersController, 'getUserRoles'])
  .use(middleware.auth({ guards: ['adminapi'] }))
  .use(middleware.permission([PermissionKeys.USER_ROLES_VIEW]))  

  