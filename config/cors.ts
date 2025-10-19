import { defineConfig } from "@adonisjs/cors";

export default defineConfig({
  enabled: true,

  origin: [
    'https://hackthon-web-gilt.vercel.app', 
    'http://localhost:5173',              
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: ['cache-control', 'content-language', 'content-type'],
  credentials: true,
  maxAge: 90,
})
