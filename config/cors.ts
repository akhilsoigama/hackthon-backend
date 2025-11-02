import { defineConfig } from "@adonisjs/cors";

export default defineConfig({
  enabled: true,

  // 👇 apne frontend ka origin yahan daal
  origin: [
    'https://hackthon-web-gilt.vercel.app', // <-- change this to your frontend URL
    'http://localhost:5173',            // for local testing
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,  
  maxAge: 90,
})
    