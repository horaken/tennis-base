import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'html-dev-transform',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/index\.css">\s*/, '')
            .replace(
              /<script type="module" crossorigin src="\.\/assets\/index\.js"><\/script>/,
              '<script type="module" src="/src/main.tsx"></script>'
            );
        },
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/__google_sheets': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__google_sheets/, ''),
      },
    },
  },
});
