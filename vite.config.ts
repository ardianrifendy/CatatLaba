import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Force a single React instance so libraries using hooks (Radix) don't
    // get a duplicate copy via dev pre-bundling ("Invalid hook call").
    dedupe: ['react', 'react-dom'],
  },
})
