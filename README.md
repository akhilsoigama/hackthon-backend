# 🎓 RuralSpark LMS — Enterprise Backend API

> **Production-grade, Multi-Tenant Learning Management System API** built with **AdonisJS 6**, **TypeScript**, **PostgreSQL**, **Redis**, and **AI-Driven Workflows (RAG & Web Push)**.

![AdonisJS](https://img.shields.io/badge/AdonisJS-6.19-5A45FF?style=for-the-badge&logo=adonisjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-6.1-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![WebPush](https://img.shields.io/badge/Web_Push-VAPID-FF6B6B?style=for-the-badge&logo=pwa&logoColor=white)
![OpenAPI](https://img.shields.io/badge/OpenAPI-Swagger%20%26%20Scalar-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## 📌 Table of Contents
- [1. System Architecture](#1-system-architecture)
- [2. Key Features](#2-key-features)
- [3. Multi-Tenant Role Hierarchy](#3-multi-tenant-role-hierarchy)
- [4. API Directory & Endpoints](#4-api-directory--endpoints)
- [5. Interactive API Documentation (Swagger & Scalar)](#5-interactive-api-documentation)
- [6. Environment Configuration](#6-environment-configuration)
- [7. Getting Started](#7-getting-started)
- [8. Performance & Security Best Practices](#8-performance--security-best-practices)

---

## 1. System Architecture

RuralSpark is architected as an **Event-Driven, Modular Monolith** designed for high concurrency, rural bandwidth optimization, and enterprise governance:

```
                      ┌────────────────────────────────────────┐
                      │    Client Applications (Web / PWA)     │
                      └───────────────────┬────────────────────┘
                                          │  HTTPS / REST / SSE
                                          ▼
                      ┌────────────────────────────────────────┐
                      │      AdonisJS 6 API Gateway            │
                      │  ├── CORS & Security Headers           │
                      │  ├── Rate Limiter (Token Bucket)       │
                      │  ├── Multi-Guard Auth (API / AdminAPI) │
                      │  └── Audit & Response Time Logger      │
                      └───────────────────┬────────────────────┘
                                          │
    ┌───────────────────────┬─────────────┴─────────────┬───────────────────────┐
    ▼                       ▼                           ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  ┌───────────────────┐
│ Identity & Core  │  │ Academic Engine  │  │ AI & Skill Learning   │  │ Real-Time Alerts  │
│ ├── Auth & JWT   │  │ ├── Lectures     │  │ ├── RAG Embeddings    │  │ ├── In-App Feed   │
│ ├── Multi-Tenant │  │ ├── Assignments  │  │ ├── Semantic Search  │  │ ├── Web Push      │
│ └── RBAC Grants  │  │ ├── Quizzes & Q&A│  │ ├── Groq Llama 3.3 LLM│  │ └── VAPID / FCM  │
│                  │  │ └── Faculty Leave│  │ └── Auto Quiz Gen     │  │     Dispatcher    │
└────────┬─────────┘  └────────┬─────────┘  └───────────┬───────────┘  └─────────┬─────────┘
         │                     │                        │                        │
         └─────────────────────┼────────────────────────┴────────────────────────┘
                               ▼
               ┌───────────────────────────────┐
               │    Persistence & Cache Layer  │
               │  ├── PostgreSQL (Lucid ORM)   │
               │  ├── Redis Caching            │
               │  └── Cloudinary CDN (Media)   │
               └───────────────────────────────┘
```

---

## 2. Key Features

### 🔔 1. Real-Time Notification & Mobile Web Push Engine
* **In-App Notification Feed:** Paginated notification history with live unread counter badge.
* **Mobile Lock-Screen Web Push:** Standards-compliant **VAPID** Web Push protocol delivers sound and vibration alerts to Android and iOS (PWA) lock screens—even when browsers are closed.
* **Self-Healing Device Store:** Automatically prunes dead subscription tokens on `410 Gone` and `404 Not Found` response codes.
* **Event Dispatcher:** Unified API for single or bulk dispatches (`NotificationService.create` & `NotificationService.createBulk`).

### 🧠 2. RAG Skill Learning & Semantic Search
* **Vector Knowledge Ingestion:** Ingests educational text and syllabus chunks for vector embeddings.
* **Contextual Retrieval:** Fast semantic search powering personalized skill courses.
* **AI Quiz Generation:** Instant quiz creation from ingested lecture transcripts and curriculum modules.

### 🤖 3. AI Education Assistant (Chatbot)
* **Groq SDK Integration:** Sub-second latency LLM inference using `llama-3.3-70b-versatile`.
* **Tenant-Aware Prompts:** Dynamically injects user context (role, standard, institute, enrolled subjects).
* **Live Web Retrieval:** Optional live internet retrieval via **Tavily API** for up-to-the-minute academic facts.

### 📚 4. Academic Lifecycle & Evaluation
* **Lectures & Media:** Multi-format lectures (Video, Audio, PDF, Text) with Cloudinary integration and FFmpeg transcoding.
* **Assignment Management:** Deadlines, file uploads, submissions tracking, and grading workflows.
* **Quizzes & Automated Scoring:** Timed quizzes, single/multiple-choice questions, and instant attempt scorecards.
* **Student Doubt / Q&A Desk:** Two-way question resolution system between students and faculty.
* **Faculty Leave Management:** Structured leave applications with Admin/HOD approval/rejection audit trail.
* **Institutional & Government Events:** Unified event feed with synchronization hooks.

---

## 3. Multi-Tenant Role Hierarchy

RuralSpark enforces strict tenant isolation at both the database and routing levels:

| Role | Target Identity | Privileges |
| :--- | :--- | :--- |
| **`super_admin`** | System Administrator | Full platform governance, institute provisioning, role/permission authoring |
| **`institute`** | College / School Admin | Faculty & student enrollment, department structure, campus events |
| **`faculty`** | Teachers & Professors | Material uploads, assignments, quiz authoring, grading, student Q&A |
| **`student`** | Learners & Scholars | Material consumption, assignment submissions, quiz attempts, doubts |

---

## 4. API Directory & Endpoints

### 🔐 Auth & Identity
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/login` | Authenticate user & issue access tokens |
| `GET` | `/api/v1/profile` | Current authenticated user profile |
| `POST` | `/api/v1/logout` | Revoke active access token |
| `GET` | `/api/v1/my-permissions` | Returns active user's permissions |

### 🔔 Notifications & Web Push
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Paginated notification list (supports `?unreadOnly=true`) |
| `GET` | `/api/v1/notifications/unread-count` | Header badge unread count |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all notifications as read |
| `GET` | `/api/v1/notifications/push/vapid-key` | Fetch public VAPID key for browser push |
| `POST` | `/api/v1/notifications/push/subscribe` | Register mobile/browser push subscription |
| `POST` | `/api/v1/notifications/push/unsubscribe` | Unsubscribe device from push notifications |

### 🧠 RAG & Skill Learning
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rag/courses` | List available skill courses |
| `GET` | `/api/rag/courses/:id` | Course detail with syllabus chunks |
| `POST` | `/api/rag/generate-quiz` | Auto-generate quiz questions via LLM context |
| `POST` | `/api/v1/rag/documents` | Ingest curriculum documents into vector store |

### 🤖 AI Chatbot
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/chatbot` | Educational conversational AI with web search fallback |

### 📝 Academics & Evaluation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `Resource` | `/api/v1/lectures` | Course lectures (video, audio, text) |
| `Resource` | `/api/v1/assignments` | Assignment creation and instructions |
| `Resource` | `/api/v1/quizzes` | Quiz definition and questions |
| `Resource` | `/api/v1/quiz-attempts` | Student quiz submissions and evaluation |
| `Resource` | `/api/v1/student-queries` | Student doubt questions and faculty answers |
| `Resource` | `/api/v1/faculty-leaves` | Leave applications, approve & reject |

---

## 5. Interactive API Documentation

The backend includes zero-config interactive API explorers generated automatically from routes and schemas:

* **Swagger UI:** [http://localhost:3333/docs](http://localhost:3333/docs)
* **Scalar UI (Modern):** [http://localhost:3333/scalar](http://localhost:3333/scalar)
* **Raw OpenAPI JSON:** [http://localhost:3333/swagger](http://localhost:3333/swagger)

---

## 6. Environment Configuration

Create a `.env` file in the root of `lms-api`:

```env
# ── Core Server ──────────────────────────────────────────────
NODE_ENV=development
PORT=3333
HOST=localhost
APP_KEY=your_generated_app_key_here
LOG_LEVEL=info

# ── Database (PostgreSQL) ───────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=rural_spark_lms
DB_SSL=false

# ── Redis Cache ──────────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# ── Web Push Notifications (VAPID) ───────────────────────────
VAPID_PUBLIC_KEY=BHAsuvuJfIxqzNUsI0EW0RyoSbdp9PgfHyT4YI93JzQ8vFNsq1Gasdc0gUcaXAYyQ6gOL644uvfFGrgJ-0yAaII
VAPID_PRIVATE_KEY=qHL3bPsaO--7QCPFTUrav8o_eugIgFPZNanOuRUXXNw
VAPID_SUBJECT=mailto:support@ruralspark.in

# ── AI & RAG ────────────────────────────────────────────────
CHATBOT_API_KEY=your_groq_api_key
CHATBOT_MODEL=llama-3.3-70b-versatile
TAVILY_API_KEY=your_tavily_search_key
EMBEDDING_API_KEY=your_embedding_key
EMBEDDING_API_URL=https://api.embeddings.com
EMBEDDING_MODEL=text-embedding-3-small

# ── Media Uploads (Cloudinary) ──────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 7. Getting Started

### Prerequisites
* **Node.js** `>= 20.x`
* **PostgreSQL** `>= 14.x`
* **Redis** `>= 6.x`

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run Database Migrations
node ace migration:run

# 3. (Optional) Seed Initial Roles and SuperAdmin
node ace db:seed

# 4. Start Development Server with hot-reload
npm run dev
```

### Essential CLI Scripts
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts AdonisJS development server with file watch |
| `npm run build` | Compiles TypeScript into production build |
| `npm run typecheck` | Validates TypeScript static types without emission |
| `npm run migrate` | Executes pending PostgreSQL database migrations |
| `npm run seed` | Seeds database with essential demo/system data |
| `npm run lint` | ESLint static code analysis |

---

## 8. Performance & Security Best Practices

1. **Defensive Mutation Invalidation:** Mutating actions immediately evict affected Redis cache keys to prevent stale dashboard readings.
2. **Selective Column Queries:** All Lucid ORM relationships leverage selective column projection and indexing to eliminate N+1 latency.
3. **Tenant Boundary Assertion:** Sensitive actions verify the caller's `instituteId` or `facultyId` against the requested record scope.
4. **Resilient Web Push:** Push delivery runs non-blocking via `Promise.allSettled`, guaranteeing that client API latency remains unaffected by external push network speeds.

---

<p align="center">
  <b>Built with ❤️ for Rural Education by the RuralSpark Engineering Team</b>
</p>
