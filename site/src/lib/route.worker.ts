// Web Worker voor routeplanning en zoeken: het rekenwerk blokkeert de interface niet,
// ook niet op oude telefoons. Alles komt van het toestel (routepakketten in OPFS,
// kaartlagen uit de cache van de service worker).

import { leesNetwerkdeel, leesZoekdeel, voegSamen, type Graaf, type Netwerkdeel, type Zoekdeel } from './routegraaf';
import { bereken, maakGeheugen, maakRaster, type Geheugen, type Modus, type Punt, type Raster } from './route';

export type Vraag =
  | { soort: 'pakketten'; pakketten: { id: string; bbox: [number, number, number, number]; bestand: Blob }[] }
  | { soort: 'route'; nr: number; van: Punt; naar: Punt; modus: Modus }
  | { soort: 'zoek'; nr: number; tekst: string; nabij?: Punt };

export type Treffer = { naam: string; context: string; soort: string; lon: number; lat: number };

const SOORT = ['straat', 'stad', 'gemeente', 'dorp', 'gehucht', 'wijk', 'buurt'];
const LAGEN = [
  ['ziekenhuizen', 'ziekenhuis'], ['schuilplekken', 'mogelijke schuilplek'], ['drinkwater', 'drinkwater'],
  ['politie', 'politie'], ['brandweer', 'brandweer'], ['apotheken', 'apotheek'], ['medisch', 'medische post'],
  ['overheid', 'gemeentehuis'], ['aed', 'AED'],
] as const;

type Pakket = { id: string; bbox: [number, number, number, number]; bestand: Blob };
let pakketten: Pakket[] = [];
const zoekdelen = new Map<string, Zoekdeel & { sleutels: string[] }>();
type Kaartpunt = { naam: string; context: string; soort: string; lon: number; lat: number; sleutel: string };
let punten: Kaartpunt[] | null = null;
const netwerken = new Map<string, Netwerkdeel>();
let huidig: { sleutel: string; g: Graaf; r: Raster; mem: Geheugen } | null = null;

// Geen lib "webworker": die zou de DOM-typen van de rest van de app overschrijven.
const post = (b: unknown) => (self as unknown as { postMessage(b: unknown): void }).postMessage(b);

export function normaliseer(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function laadZoekdelen() {
  for (const p of pakketten) {
    if (zoekdelen.has(p.id)) continue;
    const z = await leesZoekdeel(p.bestand);
    const norm = z.namen.map(normaliseer);
    zoekdelen.set(p.id, { ...z, sleutels: norm });
  }
}

async function laadPunten() {
  if (punten) return punten;
  const uit: Kaartpunt[] = [];
  for (const [laag, soort] of LAGEN) {
    try {
      const r = await fetch(`/data/be/${laag}.geojson`);
      if (!r.ok) continue;
      const fc = await r.json();
      for (const f of fc.features ?? []) {
        const p = f.properties ?? {};
        const [lon, lat] = f.geometry?.coordinates ?? [];
        if (typeof lon !== 'number') continue;
        const naam = String(p.naam || p.soort || soort);
        const context = [p.soort && p.soort !== naam ? p.soort : soort, p.adres || p.plaats].filter(Boolean).join(', ');
        uit.push({ naam, context, soort, lon, lat, sleutel: normaliseer(`${naam} ${soort} ${context}`) });
      }
    } catch {}
  }
  punten = uit;
  return uit;
}

/** Elk zoekwoord moet het begin van een woord in de naam of plaats zijn. */
function past(sleutel: string, woorden: string[]) {
  return woorden.every((w) => sleutel.startsWith(w) || sleutel.includes(' ' + w));
}

async function zoek(tekst: string, nabij?: Punt): Promise<Treffer[]> {
  const q = normaliseer(tekst);
  if (q.length < 2) return [];
  const woorden = q.split(' ');
  await laadZoekdelen();
  type Kandidaat = Treffer & { score: number };
  const kandidaten: Kandidaat[] = [];
  const afstand = (lon: number, lat: number) => (nabij ? Math.hypot((lon - nabij.lon) * 0.63, lat - nabij.lat) : 0);
  const gezien = new Set<string>();
  for (const z of zoekdelen.values()) {
    for (let i = 0; i < z.soort.length; i++) {
      const naam = z.sleutels[z.naam[i]];
      const ctx = z.sleutels[z.plaats[i]];
      const sleutel = ctx ? `${naam} ${ctx}` : naam;
      if (!past(sleutel, woorden)) continue;
      const echt = z.namen[z.naam[i]], context = z.namen[z.plaats[i]];
      const lon = z.x[i] / 1e5, lat = z.y[i] / 1e5;
      const dubbel = `${echt}|${context}|${z.soort[i]}`;
      if (gezien.has(dubbel)) continue; // zelfde item in twee regio's
      gezien.add(dubbel);
      const soort = z.soort[i];
      // Plaatsen voor straten; exacte naam en naambegin eerst.
      let score = soort === 0 ? 30 : soort * 3;
      if (naam === q) score -= 40; else if (naam.startsWith(q)) score -= 20;
      score += Math.min(20, afstand(lon, lat) * 20);
      kandidaten.push({ naam: echt, context, soort: SOORT[soort] ?? 'plaats', lon, lat, score });
    }
  }
  for (const p of await laadPunten()) {
    if (!past(p.sleutel, woorden)) continue;
    let score = 25;
    if (normaliseer(p.naam).startsWith(q)) score -= 15;
    score += Math.min(20, afstand(p.lon, p.lat) * 20);
    kandidaten.push({ naam: p.naam, context: p.context, soort: p.soort, lon: p.lon, lat: p.lat, score });
  }
  kandidaten.sort((a, b) => a.score - b.score || a.naam.localeCompare(b.naam, 'nl'));
  return kandidaten.slice(0, 12).map(({ score, ...t }) => t);
}

/** Welke regio's zijn nodig: alle pakketten waarvan de bbox het gebied tussen A en B (met marge) raakt. */
function nodigeRegios(van: Punt, naar: Punt) {
  // Ongeveer 5 km rond het gebied tussen A en B, voor omwegen. De regio's overlappen al aan de randen.
  const marge = 0.05;
  const w = Math.min(van.lon, naar.lon) - marge, e = Math.max(van.lon, naar.lon) + marge;
  const s = Math.min(van.lat, naar.lat) - marge, n = Math.max(van.lat, naar.lat) + marge;
  const binnen = (p: Punt, b: number[]) => p.lon >= b[0] && p.lon <= b[2] && p.lat >= b[1] && p.lat <= b[3];
  const raakt = pakketten.filter((p) => p.bbox[0] <= e && p.bbox[2] >= w && p.bbox[1] <= n && p.bbox[3] >= s);
  return {
    regios: raakt.map((p) => p.id).sort(),
    vanGedekt: pakketten.some((p) => binnen(van, p.bbox)),
    naarGedekt: pakketten.some((p) => binnen(naar, p.bbox)),
  };
}

async function netwerk(regios: string[]) {
  const sleutel = regios.join(',');
  if (huidig?.sleutel === sleutel) return { ...huidig, laadtijd: 0 };
  const begin = performance.now();
  const delen: Netwerkdeel[] = [];
  for (const id of regios) {
    let d = netwerken.get(id);
    if (!d) {
      const p = pakketten.find((x) => x.id === id)!;
      d = await leesNetwerkdeel(p.bestand);
      // Hoogstens enkele regio's als ruwe data bewaren; de rest opnieuw lezen als het nodig is.
      if (netwerken.size >= 4) netwerken.delete(netwerken.keys().next().value!);
      netwerken.set(id, d);
    }
    delen.push(d);
  }
  huidig = null; // geheugen vrijmaken vóór het samenvoegen
  const g = voegSamen(delen);
  const r = maakRaster(g);
  huidig = { sleutel, g, r, mem: maakGeheugen(g) };
  return { ...huidig, laadtijd: performance.now() - begin };
}

self.onmessage = async (ev: MessageEvent<Vraag>) => {
  const v = ev.data;
  try {
    if (v.soort === 'pakketten') {
      pakketten = v.pakketten;
      for (const id of [...zoekdelen.keys()]) if (!pakketten.some((p) => p.id === id)) zoekdelen.delete(id);
      for (const id of [...netwerken.keys()]) if (!pakketten.some((p) => p.id === id)) netwerken.delete(id);
      huidig = null;
      post({ soort: 'pakketten', aantal: pakketten.length });
    } else if (v.soort === 'zoek') {
      post({ soort: 'zoek', nr: v.nr, treffers: await zoek(v.tekst, v.nabij) });
    } else if (v.soort === 'route') {
      const nodig = nodigeRegios(v.van, v.naar);
      if (!pakketten.length) throw new Error('Er staat geen routepakket op dit toestel. Download een regio via Instellingen.');
      if (!nodig.vanGedekt || !nodig.naarGedekt)
        throw new Error(`Punt ${!nodig.vanGedekt ? 'A' : 'B'} ligt buiten de routepakketten op dit toestel. Download de regio via Instellingen.`);
      post({ soort: 'voortgang', nr: v.nr, tekst: `Netwerk laden (${nodig.regios.length} ${nodig.regios.length === 1 ? 'regio' : "regio's"})` });
      const n = await netwerk(nodig.regios);
      const uit = bereken(n.g, n.r, n.mem, v.van, v.naar, v.modus);
      if ('fout' in uit) throw new Error(uit.fout);
      post({ soort: 'route', nr: v.nr, route: uit, laadtijd: n.laadtijd, regios: nodig.regios, knopen: n.g.n });
    }
  } catch (e) {
    post({ soort: 'fout', nr: (v as { nr?: number }).nr ?? 0, tekst: (e as Error).message || String(e) });
  }
};
