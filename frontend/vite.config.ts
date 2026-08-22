import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = process.env.VITE_API_URL || 'http://localhost:8000'
const WS_TARGET  = API_TARGET.replace(/^http/, 'ws')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        // No rewrite — backend mounts routes at /api/*
      },
      '/static': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/storage': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/ws': {
        target: WS_TARGET,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
