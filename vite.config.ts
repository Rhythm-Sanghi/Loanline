import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // ensure relative paths for static hosting/GitHub Pages
  css: {
    postcss: {
      plugins: [], // isolated from parent directory postcss configs
    },
  },
});
