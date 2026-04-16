// app/middlewares/secure_video_middleware.ts
import { HttpContext } from '@adonisjs/core/http'

export default class SecureVideoMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    await next()

    const url = request.url()

    // Keep media specific security headers here and let the CORS middleware
    // own Access-Control-* headers for credentialed requests.
    // Specific headers for video content
    if (url.includes('.mp4') || url.includes('/api/') || url.includes('video')) {
      response.header('Cross-Origin-Resource-Policy', 'cross-origin')
      response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    }
  }
}
