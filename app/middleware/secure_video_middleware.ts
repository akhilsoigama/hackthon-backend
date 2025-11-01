// app/middlewares/secure_video_middleware.ts
import { HttpContext } from '@adonisjs/core/http'

export default class SecureVideoMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    await next()

    const url = request.url()
    
    // For video files and API endpoints
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
    response.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
    
    // Specific headers for video content
    if (url.includes('.mp4') || url.includes('/api/') || url.includes('video')) {
      response.header('Cross-Origin-Resource-Policy', 'cross-origin')
      response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    }
  }
}