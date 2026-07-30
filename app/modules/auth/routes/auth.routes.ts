// app/modules/auth/routes/auth.routes.ts
// All /api/v1/auth/* routes — delegates to the single legacy AuthController

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { RateLimitConfigs } from '../../../helper/rate_limiter.js'

// Single auth controller — the legacy one with service layer integrated
const AuthController = () => import('#controllers/auth_controller')

export default function registerAuthRoutes() {
  router
    .group(() => {
      // Public — login (rate limited)
      router
        .post('/login', [AuthController, 'login'])
        .use(middleware.rateLimit({ config: RateLimitConfigs.auth }))

      // Authenticated — require either guard
      router
        .get('/me', [AuthController, 'me'])
        .use(middleware.auth({ guards: ['adminapi', 'api'] }))

      router
        .post('/logout', [AuthController, 'logout'])
        .use(middleware.auth({ guards: ['adminapi', 'api'] }))

      router
        .get('/type', [AuthController, 'getAuthType'])
        .use(middleware.auth({ guards: ['adminapi', 'api'] }))

      router
        .get('/permissions', [AuthController, 'getMyPermissions'])
        .use(middleware.auth({ guards: ['adminapi', 'api'] }))

      router
        .post('/check-permission', [AuthController, 'checkPermission'])
        .use(middleware.auth({ guards: ['adminapi', 'api'] }))

      router
        .post('/sync/institutes', [AuthController, 'syncAllInstitutes'])
        .use(middleware.auth({ guards: ['adminapi'] }))

      router
        .post('/sync/faculties', [AuthController, 'syncAllFaculties'])
        .use(middleware.auth({ guards: ['adminapi'] }))
    })
    .prefix('/auth')
    .use(middleware.rateLimit({ config: RateLimitConfigs.api }))
}
