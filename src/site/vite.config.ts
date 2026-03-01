import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import resumeMeta from './vite-plugin-resume-meta'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    resumeMeta(),
  ],
})
