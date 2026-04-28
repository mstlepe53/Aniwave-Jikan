import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      // In dev, proxy /api/mal-to-anilist to AniList GraphQL directly
      '/api/mal-to-anilist': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // This is handled by our Express server — just forward to it
      },
      // In dev, proxy /api/kiwi to miruro directly
      '/api/kiwi': {
        target: 'https://miruro-nine-navy.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kiwi\/([^/]+)\/([^/]+)\/(.+)$/, '/watch/kiwi/$1/$2/$3'),
      },
      // All other /api routes go to local Express server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
});
