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

      // Dynamic import
      const translateModule = await import('@vitalets/google-translate-api')

      // Pick the correct function
      const translate = (translateModule as any).translate ?? (translateModule as any).default?.translate

      if (typeof translate !== 'function') {
        return response.status(500).json({ message: 'Translation service unavailable' })
      }

      // Perform translation
      const result = await translate(text, { to: targetLang })

      return response.status(200).json({
        original: text,
        translated: result.text,
        from: result.from?.language?.iso || null,
      })
    } catch (error: any) {
      return response.status(500).json({
        message: 'Translation failed',
        error: error.message || error,
      })
    }
  }
}
