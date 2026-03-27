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
    port: 5174,
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
    port: 4174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('md-editor-v3')) {
            return 'editor';
          }

          if (id.includes('@codemirror') || id.includes('/codemirror/')) {
            return 'editor-codemirror';
          }

          if (id.includes('@lezer')) {
            return 'editor-lezer';
          }

          if (id.includes('prettier')) {
            return 'editor-prettier';
          }

          if (
            id.includes('markdown-it') ||
            id.includes('highlight.js') ||
            id.includes('entities') ||
            id.includes('linkify-it') ||
            id.includes('mdurl') ||
            id.includes('punycode') ||
            id.includes('uc.micro') ||
            id.includes('katex') ||
            id.includes('mermaid') ||
            id.includes('cropper')
          ) {
            return 'editor-extensions';
          }

          if (id.includes('@arco-design/web-vue')) {
            return 'arco';
          }

          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'framework';
          }

          if (id.includes('axios') || id.includes('marked')) {
            return 'shared-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
}));
