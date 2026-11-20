// @ts-check
import { defineConfig } from 'astro/config';
import rehypeBron from './src/lib/rehype-bron.mjs';
import rehypeFunctioneel from './src/lib/rehype-functioneel.mjs';

export default defineConfig({
  site: 'https://planb72.org',
  trailingSlash: 'always',
  // Stylesheets als apart bestand (behalve heel kleine): de app bestaat in vier talen en elke
  // pagina met een eigen kopie van de CSS zou het offline budget van 15 MB overschrijden.
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // Geen externe lettertypes, geen telemetrie, niets van buiten laden.
  devToolbar: { enabled: false },
  // Eerst de bronvermelding, dan de functionele links (kaartknoppen, hulpmiddelen, telefoonnummers).
  markdown: { rehypePlugins: [rehypeBron, rehypeFunctioneel] },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
