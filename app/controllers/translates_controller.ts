import { HttpContext } from '@adonisjs/core/http'

export default class TranslatesController {
  public async translateMessage({ request, response }: HttpContext) {
    try {
      const { text, targetLang } = request.only(['text', 'targetLang'])
      if (!text || !targetLang) {
        return response.status(400).json({ message: 'Text and targetLang are required' })
      }

      // Dynamic import
      const translateModule = await import('@vitalets/google-translate-api')
      // Use `.translate` property which exists in CJS version
      const translate = (translateModule as any).translate as (text: string, options: { to: string }) => Promise<any>

      const result = await translate(text, { to: targetLang })

      return response.status(200).json({
        original: text,
        translated: result.text,
      })
    } catch (error) {
      console.error('Translation error:', error)
      return response.status(500).json({ message: 'Translation failed' })
    }
  }
}
