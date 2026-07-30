import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
      'info.orivexus.com',
      'orivexus.com',
    ],
    proxy: {
      '/api': {
        target: 'http://backend:9999',
        changeOrigin: true,
      },
    },
  },
})
