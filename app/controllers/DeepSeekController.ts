import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class DeepSeekController {
  public async chat({ request, response }: HttpContext) {
    try {
      const messages = request.input('messages')

      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.get('CHATBOT_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        // model: 'deepseek/deepseek-r1:free',
        // model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
        // model: 'meta-llama/llama-3.2-3b-instruct:free',
        // model: 'anthropic/claude-3-haiku',
        // model: 'openai/gpt-3.5-turbo',
        // model: 'meta-llama/llama-3.1-8b-instruct',
        // model: 'google/gemini-flash-1.5',
          messages,
        }),
      })

      const data = await apiRes.json()
      return response.status(apiRes.status).json(data)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error during API call:', error.message)
        console.error(error.stack)
      } else {
        console.error('An unexpected error occurred:', error)
      }
      return response.status(500).json({ message: 'An internal server error occurred.' })
    }
  }
}