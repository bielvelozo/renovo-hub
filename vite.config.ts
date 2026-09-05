import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Renovo Hub',
        short_name: 'Renovo',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '/',
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
})
