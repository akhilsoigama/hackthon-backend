# LMS API Backend

Backend API for the ruralSpark learning platform, built with AdonisJS and TypeScript.

This service provides:

- Authentication and profile endpoints
- Role and permission based access control
- Institute, department, faculty, and student management
- Learning content management: lectures, assignments, quizzes, and quiz attempts
- AI chatbot support for education workflows

## Recent Performance Improvements

The API now uses a step-by-step optimization approach that keeps the existing flow intact:

- Multi-tenant isolation on list/detail endpoints where the authenticated user scope applies.
- Pagination support on list APIs using `page` and `limit` query params.
- Search and filter support on indexed fields for faster lookups.
- Thin controllers with service/repository-based query handling.
- In-memory caching for frequently requested GET routes with mutation-based invalidation.
- Response-time logging and contextual error logging for slower endpoints.
- Audit fields on key entities such as `createdBy` and `updatedBy`.

## API Query Conventions

Common list endpoints now support these query params:

- `page` - page number, default `1`
- `limit` - page size, default `20`
- `search` - free-text search on supported indexed fields
- `searchFor` - existing flow-specific filter flag
- `withDeleted` - include soft-deleted records when explicitly requested

For tenant-aware routes, the backend uses the authenticated JWT user context to scope results by the current user's institute, faculty, or student identity.

## Tech Stack

- AdonisJS 6
- TypeScript
- PostgreSQL with Lucid ORM
- Groq SDK for chatbot model calls
- Tavily for optional web search context
- Cloudinary for lecture media uploads

## Quick Start

1. Install dependencies.
   - npm install
2. Configure environment variables in .env.
3. Run migrations.
   - npm run migrate
4. Optional: seed data.
   - npm run seed
5. Start the development server.
   - npm run dev

## Main Scripts

- npm run dev
- npm run build
- npm run start
- npm run test
- npm run lint
- npm run typecheck
- npm run migrate
- npm run seed

## Required Environment Variables

Minimum variables to run core APIs:

- APP_KEY
- NODE_ENV
- PORT
- HOST
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_DATABASE

For chatbot:

- CHATBOT_API_KEY
- CHATBOT_MODEL (optional, default: llama-3.3-70b-versatile)
- TAVILY_API_KEY (optional, used only when useWebSearch is true)

For lecture media uploads:

- Cloudinary credentials configured in config/cloudinary.ts and .env

## Authentication

Public endpoints:

- POST /login
- POST /translate
- GET /ping
- GET /test-db

Protected APIs are grouped under auth middleware and permission checks where applicable.

## Route Groups (High Level)

All below endpoints are available in start/routes.ts and most require auth and permission middleware.

### Profile and auth session

- GET /profile
- POST /logout
- GET /auth-type
- GET /my-permissions
- POST /check-permission

### Roles and permissions

- GET /roles
- POST /roles
- GET /roles/:id
- PUT /roles/:id
- DELETE /roles/:id
- GET /permissions
- GET /permissions/:id

### User management

- Resource: /users
- POST /users/:id/roles
- DELETE /users/:id/roles/:roleId
- GET /users/:id/roles

### Institute, department, faculty, student

- Resource: /institutes
- Resource: /departments
- Resource: /faculty
- Resource: /student

### Events and surveys

- Resource: /govtEvent
- Resource: /instituteEvent

### Learning content and evaluation

- Resource: /lectures
- Resource: /assignments
- Resource: /quizzes
- Resource: /quiz-attempts

## Performance Notes

- GET endpoints are cached in memory for short TTL windows where it is safe to do so.
- Mutations invalidate related caches to keep list/detail views consistent.
- Queries use selective columns and preloads to reduce payload size and avoid N+1 patterns.
- DB indexes should be applied from the performance migration before relying on larger datasets.

## Chatbot API

Endpoint:

- POST /chatbot

Current behavior:

- Injects a built in education system prompt on every request
- Supports optional role-aware context via userContext
- Supports optional real-time web context when useWebSearch is true

Request body fields:

- messages: array of objects with role and content
- query: string fallback when messages is not provided
- useWebSearch: boolean
- userContext: optional object with userType, permissions, instituteId, facultyId, departmentId

Minimum request requirements:

- Send either non-empty messages or query

Chatbot response:

- message: model text output
- completion: raw model completion object

## Education System Prompt (Chatbot)

The chatbot prompt is maintained in app/constants/chatbot_system_prompt.ts.

It is designed for real education workflows and focuses on:

- Teacher help for quiz creation
- Teacher help for assignment creation
- Teacher help for lecture and material creation
- Role-safe and permission-aware guidance
- Backend-compatible payload structures

## Quiz Payload Reference

Expected create fields include:

- quizTitle, quizDescription, quizBanner
- subject, std, dueDate, marks, attemptLimit, isActive
- instituteId, facultyId, departmentId
- questions[] with questionText, questionType, marks, options[]

## Assignment Payload Reference

Expected create fields include:

- assignmentTitle, assignmentDescription
- assignmentFile, subject, std
- instituteId, facultyId, departmentId
- dueDate, marks, isActive

## Lecture Payload Reference

Expected create fields include:

- title, description, subject, std
- content_type: video | audio | pdf | text | image
- content_url or uploaded file based on content type
- thumbnail_url
- duration_in_seconds
- text_content for text lectures

## Notes

- Most resources are permission-gated using PermissionKeys.
- Some modules apply soft-deletes and hide deleted records by default.
- Unknown routes return JSON 404 response.

## Source References

- Routes: start/routes.ts
- Chatbot controller: app/controllers/chatBotController.ts
- Chatbot system prompt: app/constants/chatbot_system_prompt.ts
