import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Laravel runs on :8000. Proxying makes the API same-origin, so Sanctum cookies work with no CORS pain.
const LARAVEL = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': LARAVEL,
      '/sanctum': LARAVEL,
      '/oauth': LARAVEL,
    },
  },
})
