import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  // ── Auth ─────────────────────────────────────────────────────────────────────
  RATE_LIMIT_ENABLED: Env.schema.boolean.optional(),
  ACCESS_TOKEN_EXPIRES_IN: Env.schema.string.optional(),
  ADMIN_ACCESS_TOKEN_EXPIRES_IN: Env.schema.string.optional(),
  REFRESH_TOKEN_EXPIRES_IN: Env.schema.string.optional(),

  // ── Cookie ───────────────────────────────────────────────────────────────────
  AUTH_COOKIE_NAME: Env.schema.string.optional(),
  AUTH_COOKIE_DOMAIN: Env.schema.string.optional(),
  AUTH_COOKIE_SECURE: Env.schema.boolean.optional(),
  AUTH_COOKIE_SAME_SITE: Env.schema.enum.optional(['lax', 'none', 'strict'] as const),
  AUTH_COOKIE_MAX_AGE: Env.schema.number.optional(),

  // ── CORS ─────────────────────────────────────────────────────────────────────
  CORS_ORIGINS: Env.schema.string.optional(),

  // ── Database ─────────────────────────────────────────────────────────────────
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  DB_SSL: Env.schema.boolean.optional(),
  DB_POOL_MIN: Env.schema.number.optional(),
  DB_POOL_MAX: Env.schema.number.optional(),

  // ── Redis ─────────────────────────────────────────────────────────────────────
  REDIS_URL: Env.schema.string.optional(),
  REDIS_HOST: Env.schema.string.optional(),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_TLS: Env.schema.boolean.optional(),

  // ── File Storage (S3 / Cloudflare R2) ────────────────────────────────────────
  STORAGE_DRIVER: Env.schema.enum.optional(['s3', 'r2', 'cloudinary', 'local'] as const),
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  AWS_BUCKET: Env.schema.string.optional(),
  AWS_ENDPOINT: Env.schema.string.optional(),  // For Cloudflare R2 custom endpoint

  // ── Mail ─────────────────────────────────────────────────────────────────────
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),
})

