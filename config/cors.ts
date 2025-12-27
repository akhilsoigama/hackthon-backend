import { defineConfig } from "@adonisjs/cors";

export default defineConfig({
  enabled: true,

  origin: [
    'https://eduhub-learn.vercel.app', 
    'http://localhost:5173',
    'http://localhost:4173'  
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,  
  maxAge: 90,
})
    