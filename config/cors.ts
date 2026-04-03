import { defineConfig } from "@adonisjs/cors";

export default defineConfig({
  enabled: true,

  origin: [
    'https://www.ruralspark.me', 
    'http://localhost:5173',
    'http://localhost:4173'  
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: true,
  exposeHeaders: [],
  credentials: true,  
  maxAge: 90,
})
    