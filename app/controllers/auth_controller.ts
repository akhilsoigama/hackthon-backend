import AdminUser from '#models/admin_user'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
    async login({ request, response }: HttpContext) {
        const { email, password } = request.only(['email', 'password'])
        try {
            let user
            let token

            user = await AdminUser.findBy('email', email)
            if (user) {
                user = await AdminUser.verifyCredentials(email, password)
                token = await AdminUser.adminAccessTokens.create(user)
            } else {
                user = await User.verifyCredentials(email, password)
                token = await User.accessTokens.create(user)

                await user.load('userRoles', (rolesQuery) => {
                    rolesQuery.preload('permissions')
                })
            }
            return response.ok({
                message: 'Login successful',
                token: token.value!.release(),
                user: user,
            })
        } catch (err) {
            return response.unauthorized({ error: 'Invalid credentials' })

        }
    }
    async getProfile({ response, auth }: HttpContext) {
        try {
            let user

            if (await auth.use('adminapi').check()) {
                user = await auth.use('adminapi').authenticate()
            }
            // If not an admin, try the user guard
            else if (await auth.use('api').check()) {
                user = await auth.use('api').authenticate()
                await user.load('userRoles', (rolesQuery) => {
                    rolesQuery.preload('permissions')
                })
            }
            else {
                return response.unauthorized({ error: 'Invalid token' })
            }

            return response.ok({
                message: 'Profile fetched successfully',
                user,
            })
        } catch (error) {
            console.error('Get Profile Error: ', error)
            return response.unauthorized({ error: 'Invalid token or error fetching profile' })
        }
    }

}