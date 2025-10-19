import { defineConfig } from "@adonisjs/cors";

export default defineConfig({
  enabled: true,

  origin: [
    'https://eduhub-frontend.vercel.app',
    'http://localhost:5173',              
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
