import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Все /api идут на Express-сервер
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
