import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png', 'marca-escuro.png', 'marca-claro.png'],
      manifest: {
        id: '/',
        name: 'Renovo Hub',
        short_name: 'Renovo',
        description: 'Escalas, repertório e Tons do ministério de louvor Renovo Music.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        background_color: '#282828',
        theme_color: '#282828',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icone-mascaravel-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // O SW gerado não trata push: `push.js` entra nele por importScripts, que
        // é bem mais barato que trocar tudo por injectManifest.
        importScripts: ['/push.js'],
        globIgnores: ['**/push.js'],
        navigateFallback: '/index.html',
        // /api/* e /entrar/* são do Worker; servir o index em cima deles quebraria o convite.
        navigateFallbackDenylist: [/^\/api\//, /^\/entrar\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fontes-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontes',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8787', '/entrar': 'http://localhost:8787' },
  },
})
