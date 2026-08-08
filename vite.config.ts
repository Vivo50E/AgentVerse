import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend on 5173, backend proxy on 8787. /api is proxied to the backend so the
// XAI key never touches the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
