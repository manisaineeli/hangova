import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative asset paths so the bundle works when served from a sub-path,
  // which is how GitHub Pages serves a project site
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1600 },
})
