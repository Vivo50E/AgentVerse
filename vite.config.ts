import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Frontend on 5173, backend proxy on 8787. /api is proxied to the backend so the
// XAI key never touches the browser.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker only wraps STATIC assets. /api/* is streamed SSE (agent
      // runs, Grok image generation) and must always hit the network live —
      // NetworkOnly below guarantees the SW never intercepts or caches it.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/sprites\/.*\.(png|jpg|jpeg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprites',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'AgentVerse',
        short_name: 'AgentVerse',
        description: "Watch your AI agent fight — a gamified observability layer for AI agents, powered by Grok.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // 'standalone' gives the closest thing to a native Mac app window
        // (Chrome/Edge "Install App"): its own window, dock icon, no browser
        // chrome/tabs/address bar.
        background_color: '#0b0918',
        theme_color: '#0b0918',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        // Let the SW run under `npm run dev` too, so install can be tested locally.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
