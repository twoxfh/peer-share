import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: '/peer-share/',
  build: {
    outDir: 'docs',
  },
  server: {
    host: true,
  },
});
