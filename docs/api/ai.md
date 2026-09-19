# AI API

This document details the AI functionalities currently implemented in the RuralSpark backend.

## Overview
The AI feature is implemented in the `ChatBotController`. It provides a chat interface backed by the **Groq SDK** and uses models like `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`. It also includes real-time web search integration using the **Tavily Core** API.

---

## POST `/chatbot`

**Purpose**: Interact with the AI chatbot, which handles role-aware contexts and optional web searches.
**Authentication**: Authenticated User (Requires `CHATBOT_ACCESS` permission and is rate-limited).

### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `messages` (array of objects, optional): Array of chat messages with `role` (`system`, `user`, `assistant`) and `content`.
  - `query` (string, optional): The user's query (if `messages` is empty, this acts as the user's message).
  - `useWebSearch` (boolean, optional): Set to `true` to enable real-time web search via Tavily for context. (Skipped if `speed` is `fast`).
  - `speed` (string, optional): Can be `fast` or `balanced`. Defaults to `balanced`. `fast` uses a smaller LLM model and restricts web searching.
  - `userContext` (object, optional): Passes the user's current context to adjust the AI behavior.
    - `userType` (string)
    - `userName` / `name` (string)
    - `permissions` (array of strings)
    - `instituteId` (number)
    - `facultyId` (number)
    - `departmentId` (number)

### Backend Flow
1. **Validation**: Normalizes messages and truncates history based on `speed` configuration.
2. **System Prompt Generation**: Retrieves the `EDUCATION_SYSTEM_PROMPT` using the `userContext`.
3. **Role Context**: Injects specific role/permission/ID context to prevent unauthorized suggestions.
4. **Web Search**: If `useWebSearch` is true and `speed` is balanced, performs a Tavily web search and injects the context as a `system` message.
5. **LLM Generation**: Calls Groq API to generate the completion.

### Response
```json
{
  "message": "The assistant's response text...",
  "completion": {
    "id": "chatcmpl-123",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "The assistant's response text..."
        }
      }
    ],
    "...": "other groq response fields"
  }
}
```

### Errors
- **400 Bad Request**: "Either a non-empty messages array or query string is required"
- **500 Internal Server Error**: "CHATBOT_API_KEY is not configured" or "Chat request failed"

---

## Environment Variables Used
- `CHATBOT_API_KEY`: Groq API Key.
- `TAVILY_API_KEY`: Tavily API Key for web searches.
- `CHATBOT_MODEL` / `CHATBOT_FAST_MODEL`: Configurable models (e.g. llama-3.3).
- `CHATBOT_MAX_TOKENS` / `CHATBOT_FAST_MAX_TOKENS`: Configurable output tokens.
- `CHATBOT_MAX_MESSAGES` / `CHATBOT_FAST_MAX_MESSAGES`: Configurable message history length.
