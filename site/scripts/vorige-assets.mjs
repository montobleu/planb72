// Neemt de stijl- en scriptbestanden van de vorige versies mee in een nieuwe publicatie.
//
// Waarom: Astro geeft elk bestand in _astro/ een naam met een hash. Na een nieuwe versie
// bestaan de oude namen niet meer. Een pagina van de vorige versie (nog even in de cache van
// Cloudflare, in een open tabblad of in de offline opslag van de app) vraagt dan een stijlbestand
// dat er niet meer is, en verschijnt zonder opmaak. Daarom blijven oude bestanden 30 dagen staan.
//
// Werkwijze: draai na `npm run build` en vóór `wrangler deploy`.
//   1. Lees de lijst van de site die nu online staat (/assets-lijst.json). Bestaat die nog niet,
//      dan halen we de namen uit de live sw.js.
//   2. Wat online staat maar niet in de nieuwe build zit, downloaden we naar dist/_astro/.
//   3. Schrijf de nieuwe lijst met per oud bestand de datum waarop het vervangen werd.
// Alleen de standaardbibliotheek van Node.

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = (process.env.PB72_SITE ?? 'https://planb72.bram-664.workers.dev').replace(/\/$/, '');
const BEWAREN_DAGEN = 30;
const DIST = new URL('../dist/', import.meta.url).pathname;
const MAP = join(DIST, '_astro');
const vandaag = new Date().toISOString().slice(0, 10);

if (!existsSync(MAP)) {
  console.error('vorige-assets: geen dist/_astro; eerst bouwen.');
  process.exit(1);
}

const nieuw = new Set(readdirSync(MAP).map((f) => `_astro/${f}`));

async function vorigeLijst() {
  try {
    const r = await fetch(`${SITE}/assets-lijst.json`, { cache: 'no-store' });
    if (r.ok) return (await r.json()).bestanden ?? {};
  } catch {}
  // Eerste keer: de namen uit de service worker van de live versie.
  try {
    const r = await fetch(`${SITE}/sw.js`, { cache: 'no-store' });
    if (r.ok) {
      const namen = [...new Set((await r.text()).match(/_astro\/[\w.\-]+/g) ?? [])];
      return Object.fromEntries(namen.map((n) => [n, { vervangen: null }]));
    }
  } catch {}
  return null;
}

const vorige = await vorigeLijst();
if (vorige === null) {
  console.warn(`vorige-assets: ${SITE} niet bereikbaar; geen oude bestanden meegenomen.`);
}

const grens = new Date(Date.now() - BEWAREN_DAGEN * 864e5).toISOString().slice(0, 10);
const lijst = {};
for (const n of nieuw) lijst[n] = { vervangen: null };

let meegenomen = 0;
let vervallen = 0;
let mislukt = 0;
for (const [naam, info] of Object.entries(vorige ?? {})) {
  if (nieuw.has(naam) || !/^_astro\/[\w.\-]+$/.test(naam)) continue;
  const vervangen = info?.vervangen ?? vandaag;
  if (vervangen < grens) { vervallen++; continue; }
  try {
    const r = await fetch(`${SITE}/${naam}`);
    if (!r.ok) { mislukt++; continue; }
    writeFileSync(join(DIST, naam), Buffer.from(await r.arrayBuffer()));
    lijst[naam] = { vervangen };
    meegenomen++;
  } catch {
    mislukt++;
  }
}

writeFileSync(join(DIST, 'assets-lijst.json'), JSON.stringify({ bijgewerkt: vandaag, bewaren_dagen: BEWAREN_DAGEN, bestanden: lijst }, null, 0));
console.log(`vorige-assets: ${nieuw.size} nieuw, ${meegenomen} oude meegenomen, ${vervallen} vervallen (> ${BEWAREN_DAGEN} dagen), ${mislukt} niet meer te vinden.`);
