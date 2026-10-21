import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'html-dev-transform',
      apply: 'serve',
      transformIndexHtml(html) {
        return html
          .replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/index\.css">/, '')
          .replace(
            /<script type="module" crossorigin src="\.\/assets\/index\.js"><\/script>/,
            '<script type="module" src="/src/main.tsx"></script>'
          );
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
  },
});
