import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

function resolveAllowedHosts(mode: string) {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredHosts = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(['2684kq16nn37.vicp.fun', ...configuredHosts]));
}

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: resolveAllowedHosts(mode),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
        xfwd: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
        xfwd: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));
