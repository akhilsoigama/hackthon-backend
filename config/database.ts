import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl: env.get('DB_SSL', true) ? { rejectUnauthorized: false } : false,
      },
      // ── Connection Pool ────────────────────────────────────────────────────
      // Tune via DB_POOL_MIN / DB_POOL_MAX environment variables.
      // Defaults: min=2, max=10 — suitable for most deployments.
      pool: {
        min: 2,
        max: 10,

        acquireTimeoutMillis: 60_000,
        createTimeoutMillis: 30_000,
        idleTimeoutMillis: 600_000,

        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,

        propagateCreateError: false,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      // Enable query logging only in development to avoid log noise in production
      debug: env.get('NODE_ENV') === 'development',
    },
  },
})

export default dbConfig
