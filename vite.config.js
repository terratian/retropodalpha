import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        classic: resolve(__dirname, 'apps/classic/index.html'),
        touch: resolve(__dirname, 'apps/touch/index.html')
      }
    }
  },
  server: {
    port: 3000
  }
});
