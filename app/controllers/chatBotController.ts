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

type UserContext = {
  userType: string
  userName: string
  permissions: string[]
  instituteId: number | null
  facultyId: number | null
  departmentId: number | null
}

export default class ChatBotController {
  public async chat({ request, response }: HttpContext) {
    try {
      const { messages, query, useWebSearch, userContext, speed } = request.only([
        'messages',
        'query',
        'useWebSearch',
        'userContext',
        'speed',
      ])

      const normalizedSpeed = speed === 'fast' ? 'fast' : 'balanced'

      const normalizedMessages = this.normalizeMessages(messages)
      const maxMessages =
        normalizedSpeed === 'fast'
          ? Number(env.get('CHATBOT_FAST_MAX_MESSAGES', '8'))
          : Number(env.get('CHATBOT_MAX_MESSAGES', '20'))
      const trimmedMessages =
        Number.isFinite(maxMessages) && maxMessages > 0
          ? normalizedMessages.slice(-maxMessages)
          : normalizedMessages

      if (!trimmedMessages.length && (!query || typeof query !== 'string')) {
        return response.status(400).json({
          message: 'Either a non-empty messages array or query string is required',
        })
      }

      if (!trimmedMessages.length && query) {
        trimmedMessages.push({ role: 'user', content: query })
      }

      // ── Extract role + name for dynamic prompt ──────────────────────────
      const ctx = this.parseUserContext(userContext)
      const systemPrompt = EDUCATION_SYSTEM_PROMPT(ctx.userType, ctx.userName)

      const chatMessages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ]

      // ── Role context (permissions, ids) ─────────────────────────────────
      const roleContextMessage = this.buildRoleContextMessage(ctx)
      if (roleContextMessage) {
        chatMessages.push({ role: 'system', content: roleContextMessage })
      }

      const apiKey = env.get('CHATBOT_API_KEY', '')
      if (!apiKey) {
        return response.status(500).json({
          message: 'CHATBOT_API_KEY is not configured',
        })
      }

      // ── Web search context ───────────────────────────────────────────────
      if (useWebSearch === true && normalizedSpeed !== 'fast') {
        const prompt = query || trimmedMessages.at(-1)?.content || ''
        const context = await this.webSearch(prompt)
        if (context) {
          chatMessages.push({
            role: 'system',
            content: `Use this real-time context when relevant:\n${context}`,
          })
        }
      }

      chatMessages.push(...trimmedMessages)

      const model =
        normalizedSpeed === 'fast'
          ? env.get('CHATBOT_FAST_MODEL', 'llama-3.1-8b-instant')
          : env.get('CHATBOT_MODEL', 'llama-3.3-70b-versatile')
      const maxTokens =
        normalizedSpeed === 'fast'
          ? Number(env.get('CHATBOT_FAST_MAX_TOKENS', '256'))
          : Number(env.get('CHATBOT_MAX_TOKENS', '800'))

      const groq = new Groq({ apiKey })
      const completion = await groq.chat.completions.create({
        model,
        messages: chatMessages,
        max_tokens: Number.isFinite(maxTokens) ? maxTokens : 800,
      })

      return response.status(200).json({
        message: completion.choices[0]?.message?.content || '',
        completion,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return response.status(500).json({
        message: 'Chat request failed',
        error: errorMessage,
      })
    }
  }

  // ── Parse & validate userContext ────────────────────────────────────────
  private parseUserContext(userContext: unknown): UserContext {
    const allowedUserTypes = ['super_admin', 'institute', 'faculty', 'student']

    if (!userContext || typeof userContext !== 'object') {
      return {
        userType: 'unknown',
        userName: 'User',
        permissions: [],
        instituteId: null,
        facultyId: null,
        departmentId: null,
      }
    }

    const ctx = userContext as Record<string, unknown>

    return {
      userType:
        typeof ctx.userType === 'string' && allowedUserTypes.includes(ctx.userType)
          ? ctx.userType
          : 'unknown',

      // ── userName — fallback chain ──────────────────────────────────────
      userName:
        typeof ctx.userName === 'string' && ctx.userName.trim()
          ? ctx.userName.trim()
          : typeof ctx.name === 'string' && ctx.name.trim()
            ? ctx.name.trim()
            : 'User',

      permissions: Array.isArray(ctx.permissions)
        ? ctx.permissions.filter((p): p is string => typeof p === 'string').slice(0, 50)
        : [],

      instituteId: typeof ctx.instituteId === 'number' ? ctx.instituteId : null,
      facultyId: typeof ctx.facultyId === 'number' ? ctx.facultyId : null,
      departmentId: typeof ctx.departmentId === 'number' ? ctx.departmentId : null,
    }
  }

  // ── Build role context message for permissions ──────────────────────────
  private buildRoleContextMessage(ctx: UserContext): string {
    if (ctx.userType === 'unknown') return ''

    return JSON.stringify({
      userType: ctx.userType,
      permissions: ctx.permissions,
      instituteId: ctx.instituteId,
      facultyId: ctx.facultyId,
      departmentId: ctx.departmentId,
      instruction:
        'Use this context to keep responses role-aware and permission-aware. Do not suggest unauthorized actions.',
    })
  }

  private normalizeMessages(input: unknown): ChatMessage[] {
    if (!Array.isArray(input)) return []

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

  private async webSearch(query: string): Promise<string> {
    const tavilyApiKey = env.get('TAVILY_API_KEY', '')
    if (!tavilyApiKey || !query.trim()) return ''

    const client = tavily({ apiKey: tavilyApiKey })
    const searchResult = await client.search(query, { maxResults: 1 })

    return searchResult.results?.[0]?.content || ''
  }
}