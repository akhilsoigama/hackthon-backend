import { HttpContext } from '@adonisjs/core/http'

export default class TranslatesController {
  public async translateMessage({ request, response }: HttpContext) {
    try {
      const { text, targetLang } = request.only(['text', 'targetLang'])

      if (!text || !targetLang) {
        return response.status(400).json({ message: 'Text and targetLang are required' })
      }

      if (typeof targetLang !== 'string' || targetLang.length !== 2) {
        return response.status(400).json({ message: 'Invalid targetLang code' })
      }

      const translateModule = await import('@vitalets/google-translate-api')
      const translate = (translateModule as any).default?.translate || translateModule.translate

      if (!translate) {
        return response.status(500).json({ message: 'Translation service unavailable' })
      }

      const result = await translate(text, { to: targetLang })

      return response.status(200).json({
        original: text,
        translated: result.text,
        from: result.from?.language?.iso || null,
        cached: result.cached || false,
        expiresAt: Date.now() + 1000 * 60 * 60, 
      })
    } catch (error: any) {
      return response.status(500).json({
        message: 'Translation failed',
        error: error.message || error,
      })
    }
  }
}
