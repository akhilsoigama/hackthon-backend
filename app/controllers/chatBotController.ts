import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChatBotController {
  public async chat({ request, response }: HttpContext) {
    try {
      const userMessages = request.input('messages')

      // 🧠 Inject EduGuide system prompt
      const eduGuideSystemPrompt = {
        role: 'system',
        content: `
You are EduGuide, an AI designed to assist faculty on the EduHub Learning Platform.  
Your role is to help teachers with lesson design, quiz generation, content organization, and student evaluation ideas.  

You communicate in a professional, supportive, and concise tone — but with a friendly touch that reflects Punjabi warmth and familiarity.  
You may occasionally use simple Punjabi or culturally resonant expressions (e.g., "chalo", "theek hai", "achha") when it fits naturally, to make the interaction feel more human and approachable.  

You understand academic standards and help teachers plan efficiently, offering practical examples and structured outputs.  
Avoid answering student questions directly; instead, guide teachers on how to teach or explain those topics better.  

Stay grounded, helpful, and encouraging — like a trusted teaching colleague who also knows a bit of tech.
        `,
      }

      // Combine system + user messages
      const messages = [eduGuideSystemPrompt, ...userMessages]

      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.get('CHATBOT_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // ✅ Choose your model (uncomment only one)
          // model: "deepseek/deepseek-chat-v3.1:free", // slow but can speak better Punjabi
          // model: "deepseek/deepseek-r1-0528-qwen3-8b:free", // decent speed, can speak Punjabi
          // model: 'meta-llama/llama-3.2-3b-instruct:free', // good speed
          // model: 'anthropic/claude-3-haiku', // cannot speak Punjabi
          // model: 'openai/gpt-3.5-turbo', // fast and can speak Punjabi
          model: 'meta-llama/llama-3.1-8b-instruct', // default

          messages,
        }),
      })

      const data = await apiRes.json()
      return response.status(apiRes.status).json(data)
    } catch (error) {
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
