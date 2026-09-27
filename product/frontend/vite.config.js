import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The dev server proxies every /api call to the Hangova API Gateway so the
 * browser only ever talks to one origin and CORS never enters the picture.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.HANGOVA_GATEWAY || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4174,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.HANGOVA_GATEWAY || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Build straight into the gateway's static resources so the API gateway
    // serves the app and the API from one origin and one public URL.
    outDir: '../backend/api-gateway/src/main/resources/static',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // three.js is large and changes rarely, so it gets its own long-cached
        // chunk and the app shell can paint before it arrives
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/](three|@react-three)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router)/ },
          ],
        },
      },
    },
  },
})
