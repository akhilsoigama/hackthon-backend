import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import Groq from 'groq-sdk'
import { tavily } from '@tavily/core'
import { EDUCATION_SYSTEM_PROMPT } from '../constants/chatbot_system_prompt.js'


type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

export default class ChatBotController {
  public async chat({ request, response }: HttpContext) {
    try {
      const { messages, query, useWebSearch, userContext } = request.only([
        'messages',
        'query',
        'useWebSearch',
        'userContext',
      ])

      const normalizedMessages = this.normalizeMessages(messages)

      if (!normalizedMessages.length && (!query || typeof query !== 'string')) {
        return response.status(400).json({
          message: 'Either a non-empty messages array or query string is required',
        })
      }

      if (!normalizedMessages.length && query) {
        normalizedMessages.push({ role: 'user', content: query })
      }

      const chatMessages: ChatMessage[] = [
        {
          role: 'system',
          content: EDUCATION_SYSTEM_PROMPT,
        },
      ]

      const roleContextMessage = this.buildRoleContextMessage(userContext)
      if (roleContextMessage) {
        chatMessages.push({ role: 'system', content: roleContextMessage })
      }

      const apiKey = env.get('CHATBOT_API_KEY', '')
      if (!apiKey) {
        return response.status(500).json({
          message: 'CHATBOT_API_KEY is not configured',
        })
      }

      if (useWebSearch === true) {
        const prompt = query || normalizedMessages.at(-1)?.content || ''
        const context = await this.webSearch(prompt)
        if (context) {
          chatMessages.push({
            role: 'system',
            content: `Use this real-time context when relevant:\n${context}`,
          })
        }
      }

      chatMessages.push(...normalizedMessages)

      const groq = new Groq({ apiKey })
      const completion = await groq.chat.completions.create({
        model: env.get('CHATBOT_MODEL', 'llama-3.3-70b-versatile'),
        messages: chatMessages,
      })

      return response.status(200).json({
        message: completion.choices[0]?.message?.content || '',
        completion,
      })
    } catch (error: any) {
      return response.status(500).json({
        message: 'Chat request failed',
        error: error?.message || error,
      })
    }
  }

  private normalizeMessages(input: unknown): ChatMessage[] {
    if (!Array.isArray(input)) {
      return []
    }

    return input
      .filter((item): item is Partial<ChatMessage> => typeof item === 'object' && item !== null)
      .map((item) => ({
        role: this.isValidRole(item.role) ? item.role : 'user',
        content: typeof item.content === 'string' ? item.content.trim() : '',
      }))
      .filter((message) => message.content.length > 0)
  }

  private isValidRole(role: unknown): role is ChatRole {
    return role === 'system' || role === 'user' || role === 'assistant'
  }

  private buildRoleContextMessage(userContext: unknown): string {
    if (!userContext || typeof userContext !== 'object') {
      return ''
    }

    const ctx = userContext as Record<string, unknown>
    const allowedUserTypes = ['super_admin', 'institute', 'faculty', 'student']
    const userType =
      typeof ctx.userType === 'string' && allowedUserTypes.includes(ctx.userType)
        ? ctx.userType
        : 'unknown'

    const permissions = Array.isArray(ctx.permissions)
      ? ctx.permissions.filter((p): p is string => typeof p === 'string').slice(0, 50)
      : []

    const instituteId = typeof ctx.instituteId === 'number' ? ctx.instituteId : null
    const facultyId = typeof ctx.facultyId === 'number' ? ctx.facultyId : null
    const departmentId = typeof ctx.departmentId === 'number' ? ctx.departmentId : null

    return JSON.stringify({
      userType,
      permissions,
      instituteId,
      facultyId,
      departmentId,
      instruction:
        'Use this context to keep responses role-aware and permission-aware. Do not suggest unauthorized actions.',
    })
  }

  private async webSearch(query: string): Promise<string> {
    const tavilyApiKey = env.get('TAVILY_API_KEY', '')
    if (!tavilyApiKey || !query.trim()) {
      return ''
    }

    const client = tavily({ apiKey: tavilyApiKey })
    const searchResult = await client.search(query, { maxResults: 1 })

    return searchResult.results?.[0]?.content || ''
  }
}