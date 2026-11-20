// Na astro build: twee zoekindexen met Pagefind, elk per taal.
//   dist/pagefind/       de app (/app/, /fr/app/, ...): zit in de offline kern van de service worker.
//   dist/pagefind-site/  de websitepagina's: alleen online, wordt in de browser met de app-index
//                        samengevoegd (mergeIndex). Zo blijft de kern onder het budget van 15 MB.
// Alleen pagina's met data-pagefind-body komen in een index (zie layouts/App.astro en Site.astro).
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import * as pagefind from 'pagefind';

const DIST = path.resolve('dist');
const isApp = (rel) => /^((fr|de|en)\/)?app\//.test(rel);

async function* wandel(map) {
  for (const item of await readdir(map, { withFileTypes: true })) {
    const p = path.join(map, item.name);
    if (item.isDirectory()) yield* wandel(p);
    else if (item.name.endsWith('.html')) yield p;
  }
}

const paginas = { app: [], site: [] };
for await (const p of wandel(DIST)) {
  const rel = path.relative(DIST, p).split(path.sep).join('/');
  const html = await readFile(p, 'utf8');
  if (!html.includes('data-pagefind-body')) continue;
  const url = '/' + rel.replace(/(^|\/)index\.html$/, '$1');
  paginas[isApp(rel) ? 'app' : 'site'].push({ url, content: html });
}

async function bouw(naam, lijst, uit) {
  const { index, errors } = await pagefind.createIndex({});
  if (!index) throw new Error(`Pagefind: ${errors.join(', ')}`);
  for (const pagina of lijst) {
    const r = await index.addHTMLFile(pagina);
    if (r.errors.length) throw new Error(`Pagefind ${pagina.url}: ${r.errors.join(', ')}`);
  }
  await rm(uit, { recursive: true, force: true });
  const w = await index.writeFiles({ outputPath: uit });
  if (w.errors.length) throw new Error(`Pagefind: ${w.errors.join(', ')}`);
  console.log(`zoekindex ${naam}: ${lijst.length} pagina's in ${path.relative(process.cwd(), uit)}`);
}

await bouw('app', paginas.app, path.join(DIST, 'pagefind'));
await bouw('website', paginas.site, path.join(DIST, 'pagefind-site'));
await pagefind.close();
