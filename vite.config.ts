import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const isInsideAdminTools = __dirname.includes('admin-tools');
  const base = process.env.VITE_BASE_PATH || (isInsideAdminTools || process.env.BUILD_FOR_ADMIN ? '/admin-tools/shaders-toolbox/' : '/');

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  };
});
