// @ts-check
import { defineConfig } from 'astro/config';
import rehypeBron from './src/lib/rehype-bron.mjs';

export default defineConfig({
  site: 'https://planb72.org',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Geen externe lettertypes, geen telemetrie, niets van buiten laden.
  devToolbar: { enabled: false },
  markdown: { rehypePlugins: [rehypeBron] },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
