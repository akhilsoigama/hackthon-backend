import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

const defaultOrigins = ['https://www.ruralspark.me', 'http://localhost:5173', 'http://localhost:4173']

const origins = env
  .get('CORS_ORIGINS')
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export default defineConfig({
  enabled: true,

  origin: origins && origins.length > 0 ? origins : defaultOrigins,

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
