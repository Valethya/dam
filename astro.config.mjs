import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.damfilms.cl',
  server: {
    port: 4321
  },
  devToolbar: {
    enabled: false
  }
});