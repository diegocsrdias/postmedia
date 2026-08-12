import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // app principal
        main: resolve(__dirname, 'index.html'),
        // rota de render usada pelo Chromium headless do agendador
        render: resolve(__dirname, 'render.html'),
      },
    },
  },
})
