import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa senao quebra no github pages
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 900 },
})
