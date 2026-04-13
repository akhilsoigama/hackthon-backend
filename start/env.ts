import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  RATE_LIMIT_ENABLED: Env.schema.boolean.optional(),
  ACCESS_TOKEN_EXPIRES_IN: Env.schema.string.optional(),
  ADMIN_ACCESS_TOKEN_EXPIRES_IN: Env.schema.string.optional(),
  AUTH_COOKIE_NAME: Env.schema.string.optional(),
  AUTH_COOKIE_DOMAIN: Env.schema.string.optional(),
  AUTH_COOKIE_SECURE: Env.schema.boolean.optional(),
  AUTH_COOKIE_SAME_SITE: Env.schema.enum.optional(['lax', 'none', 'strict'] as const),
  AUTH_COOKIE_MAX_AGE: Env.schema.number.optional(),
  CORS_ORIGINS: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  DB_SSL: Env.schema.boolean.optional(), // ✅ add this

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string()
})
