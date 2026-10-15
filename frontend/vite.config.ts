import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Where `/api` is proxied in dev. docker-compose sets this to http://backend:9999.
const apiTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:9999'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.orivexus.com',
    ],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
