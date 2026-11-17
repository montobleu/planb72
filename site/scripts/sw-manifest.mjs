// Na de build: maak dist/sw.js met de lijst van kernbestanden en controleer het opslagbudget.
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const DIST = path.resolve('dist');
const BUDGET_KERN_MB = 15; // uit het plan: "Kern (app en hulpmiddelen) minder dan 15 MB"

async function* wandel(map) {
  for (const item of await readdir(map, { withFileTypes: true })) {
    const p = path.join(map, item.name);
    if (item.isDirectory()) yield* wandel(p);
    else yield p;
  }
}

// Wat bij de kern hoort: de app, de gedeelde middelen, de zoekindex, lettertypes en iconen.
// Grote data (kaart en lagen) zit in het pakket en komt pas na een bewuste download.
const hoortBijKern = (rel) =>
  rel.startsWith('app/') ||
  rel.startsWith('_astro/') ||
  rel.startsWith('pagefind/') ||
  rel.startsWith('kaart/') ||
  rel.startsWith('icons/') ||
  rel === 'manifest.webmanifest' ||
  rel === 'favicon.svg' ||
  rel === 'data/be/meta.json' ||
  rel === 'data/kaarten.json' ||
  rel === 'data/be/nucleair.geojson';

const bestanden = [];
let totaal = 0;
const hash = createHash('sha256');

for await (const p of wandel(DIST)) {
  const rel = path.relative(DIST, p).split(path.sep).join('/');
  if (!hoortBijKern(rel)) continue;
  const inhoud = await readFile(p);
  hash.update(rel).update(inhoud);
  totaal += (await stat(p)).size;
  // Mappen-URL's in plaats van index.html, zodat links zonder bestandsnaam werken.
  bestanden.push('/' + (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel));
}

bestanden.sort();
const versie = hash.digest('hex').slice(0, 12);
const sjabloon = await readFile(path.resolve('scripts/sw-template.js'), 'utf8');
await writeFile(
  path.join(DIST, 'sw.js'),
  sjabloon.replace('__VERSIE__', versie).replace('__KERNBESTANDEN__', JSON.stringify(bestanden, null, 0))
);

const mb = totaal / 1024 / 1024;
console.log(`sw.js: ${bestanden.length} kernbestanden, ${mb.toFixed(2)} MB, versie ${versie}`);
if (mb > BUDGET_KERN_MB) {
  console.error(`Kern overschrijdt het budget van ${BUDGET_KERN_MB} MB.`);
  process.exit(1);
}
