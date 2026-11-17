// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://planb72.org',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Geen externe lettertypes, geen telemetrie, niets van buiten laden.
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
