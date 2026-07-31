// app/modules/users/routes/users.routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { PermissionKeys } from '#database/constants/permission'

const UsersController = () => import('../controllers/UsersController.js')

export default function registerUsersRoutes() {
  router
    .group(() => {
      // List users
      router
        .get('/', [UsersController, 'index'])
        .use(middleware.permission([PermissionKeys.USERS_VIEW]))

      // Get single user
      router
        .get('/:id', [UsersController, 'show'])
        .use(middleware.permission([PermissionKeys.USERS_VIEW]))

      // Create user
      router
        .post('/', [UsersController, 'store'])
        .use(middleware.permission([PermissionKeys.USERS_CREATE]))

      // Update user
      router
        .put('/:id', [UsersController, 'update'])
        .use(middleware.permission([PermissionKeys.USERS_UPDATE]))

      // Delete user
      router
        .delete('/:id', [UsersController, 'destroy'])
        .use(middleware.permission([PermissionKeys.USERS_DELETE]))

      // Role management
      router
        .get('/:id/roles', [UsersController, 'getUserRoles'])
        .use(middleware.permission([PermissionKeys.USER_ROLES_VIEW]))

      router
        .post('/:id/roles', [UsersController, 'assignRoles'])
        .use(middleware.permission([PermissionKeys.USER_ROLES_ASSIGN]))

      router
        .delete('/:id/roles/:roleId', [UsersController, 'removeRole'])
        .use(middleware.permission([PermissionKeys.USER_ROLES_REMOVE]))
    })
    .prefix('/users')
    .use(middleware.auth({ guards: ['adminapi', 'api'] }))
}
