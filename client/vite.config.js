import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(),'')
  return {
    plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname,'./src'),
    },
  },
  server: {
    proxy:{
      '/api': { 
        target: env.VITE_SERVER_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads':{
        target: env.VITE_SERVER_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
  }
})

 