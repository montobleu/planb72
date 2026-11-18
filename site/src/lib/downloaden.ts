// Downloads van de keuzehulp in de web-app: per blok uit de catalogus, met voortgang,
// pauzeren en hervatten. Een blok is altijd een heel land op één detailniveau; achter
// "België, straatniveau" zitten de negen regiobestanden uit R2, die na elkaar binnenkomen.
// Hergebruikt de opslag van de kaartpakketten (lib/kaarten.ts) en routepakketten
// (lib/routepakketten.ts): elk bestand onder zijn eigen naam in OPFS, anders in de Cache API,
// zodat de kaart en de routeplanner ze vinden zoals voorheen. Kaartlagen in de Cache API per
// land, zoals het vroegere basispakket. Een native schil (Capacitor) vervangt alleen dit
// bestand; zie docs/downloaden.md.

import { bewaarBestand, opfsMap, opToestel, verwijder as kaartVerwijder } from './kaarten';
import { routesOpToestel, verwijderRoute } from './routepakketten';
import { isCatalogus, type Bestand, type Blok, type Catalogus } from './selectie';

const CATALOGUS = '/data/catalogus.json';
const CATALOGUS_CACHE = 'pb72-pakket-catalogus';
const KAART = { map: 'kaarten', cache: 'pb72-pakket-kaarten', ext: '.pmtiles' };
const ROUTE = { map: 'routes', cache: 'pb72-pakket-routes', ext: '.pb72r' };
const lagenCache = (land: string) => `pb72-pakket-${land}`;
/** Instellingen die de service worker leest (talen); geen pakketcache, dus niet als pagina geserveerd. */
const INSTELLINGEN = 'pb72-instellingen';

/** De catalogus: met verbinding vers (en bewaard voor offline), anders de bewaarde. */
export async function laadCatalogus(): Promise<Catalogus | null> {
  if (navigator.onLine) {
    try {
      const r = await fetch(CATALOGUS, { cache: 'no-store' });
      if (r.ok) {
        const cat = await r.clone().json();
        if (isCatalogus(cat)) {
          try { await (await caches.open(CATALOGUS_CACHE)).put(CATALOGUS, r); } catch {}
          return cat;
        }
      }
    } catch {}
  }
  try {
    const r = await caches.match(CATALOGUS);
    const cat = r ? await r.json() : null;
    return isCatalogus(cat) ? cat : null;
  } catch {
    return null;
  }
}

/** Per blok hoeveel van zijn bestanden al op dit toestel staan. */
export type Aanwezig = Map<string, { delen: number; van: number; bytes: number }>;

/** Welke blokken van de catalogus (helemaal of gedeeltelijk) op dit toestel staan. */
export async function aanwezigheid(cat: Catalogus): Promise<Aanwezig> {
  const uit: Aanwezig = new Map();
  const kaarten = await opToestel();
  const routes = await routesOpToestel();
  for (const b of cat.blokken) {
    if (b.kern) continue;
    let binnen: Bestand[] = [];
    if (b.soort === 'basiskaart' || b.soort === 'straat') binnen = b.bestanden.filter((f) => kaarten.has(f.id!));
    else if (b.soort === 'routes') binnen = b.bestanden.filter((f) => routes.has(f.id!));
    else if (b.soort === 'lagen') {
      try {
        const cache = await caches.open(lagenCache(b.land!));
        if (await cache.match(`/data/${b.land}/meta.json`)) binnen = b.bestanden;
      } catch {}
    }
    if (binnen.length) uit.set(b.id, { delen: binnen.length, van: b.bestanden.length, bytes: binnen.reduce((t, f) => t + f.bytes, 0) });
  }
  return uit;
}

/** Alleen de blokken die volledig op dit toestel staan. */
export const volledig = (a: Aanwezig) => new Set([...a].filter(([, x]) => x.delen === x.van).map(([id]) => id));

/**
 * Download één blok: alle bestanden die nog ontbreken, na elkaar. `voortgang` krijgt de
 * binnengehaalde bytes van het hele blok (één voortgangsbalk).
 */
export async function downloadBlok(b: Blok, voortgang: (bytes: number) => void, signaal?: AbortSignal) {
  if (b.kern) return;
  if (b.soort === 'lagen') return downloadLagen(b, voortgang, signaal);
  const doel = b.soort === 'routes' ? ROUTE : KAART;
  const al: Map<string, unknown> = b.soort === 'routes' ? await routesOpToestel() : await opToestel();
  let klaar = 0;
  for (const f of b.bestanden) {
    if (al.has(f.id!)) { voortgang((klaar += f.bytes)); continue; }
    const basis = klaar;
    await bewaarHervatbaar(doel.map, f.id! + doel.ext, f.pad, f.bytes, doel.cache, f.sha256, (n) => voortgang(basis + n), signaal);
    voortgang((klaar += f.bytes));
  }
}

/** Een kaart- of routebestand op dit toestel dat in geen enkel blok van de catalogus meer staat. */
export type Oud = { soort: 'kaart' | 'route'; id: string; bytes: number };

/**
 * Verouderde bestanden: op het toestel, maar niet meer in de catalogus (bv. straatniveau tot
 * zoom 14, vervangen door zoom 15). Ze blijven werken tot de gebruiker ze opruimt.
 */
export async function verouderd(cat: Catalogus): Promise<Oud[]> {
  const bekend = new Set(cat.blokken.flatMap((b) => b.bestanden.map((f) => f.id)));
  const uit: Oud[] = [];
  for (const [id, f] of await opToestel()) if (!bekend.has(id)) uit.push({ soort: 'kaart', id, bytes: f instanceof File ? f.size : 0 });
  for (const [id, f] of await routesOpToestel()) if (!bekend.has(id)) uit.push({ soort: 'route', id, bytes: f.size });
  return uit;
}

export async function verwijderOud(o: Oud) {
  if (o.soort === 'kaart') await kaartVerwijder(o.id);
  else await verwijderRoute({ id: o.id, pad: `/data/route/${o.id}.pb72r` });
}

/** Een blok helemaal verwijderen, met al zijn bestanden. */
export async function verwijderBlok(b: Blok) {
  for (const f of b.bestanden) {
    if (b.soort === 'basiskaart' || b.soort === 'straat') await kaartVerwijder(f.id!);
    else if (b.soort === 'routes') await verwijderRoute({ id: f.id!, pad: f.pad });
  }
  if (b.soort === 'lagen') { try { await caches.delete(lagenCache(b.land!)); } catch {} }
}

async function sha256(data: ArrayBuffer) {
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Kaartlagen van een land: kleine bestanden, elk gecontroleerd, pas bewaard als alles binnen is. */
async function downloadLagen(b: Blok, voortgang: (bytes: number) => void, signaal?: AbortSignal) {
  const binnen: [string, Blob, string][] = [];
  let bytes = 0;
  for (const f of b.bestanden) {
    const r = await fetch(f.pad, { cache: 'no-store', signal: signaal });
    if (!r.ok) throw new Error(`${f.pad}: ${r.status}`);
    const blob = await r.blob();
    if (f.sha256 && (await sha256(await blob.arrayBuffer())) !== f.sha256) throw new Error(`${f.pad}: controlesom klopt niet`);
    binnen.push([f.pad, blob, r.headers.get('Content-Type') ?? 'application/octet-stream']);
    voortgang((bytes += blob.size));
  }
  const cache = await caches.open(lagenCache(b.land!));
  for (const [pad, blob, type] of binnen) await cache.put(pad, new Response(blob, { headers: { 'Content-Type': type } }));
}

const STUK = 8 * 1024 * 1024;

/**
 * Een groot bestand hervatbaar naar OPFS schrijven: wat binnen is, staat per stuk van 8 MB vast
 * in `<naam>.deel`; na een pauze of onderbreking vraagt de volgende poging alleen de rest
 * (Range). Zonder schrijfbare OPFS: de gewone download van lib/kaarten.ts (begint opnieuw).
 */
async function bewaarHervatbaar(
  mapnaam: string, naam: string, url: string, bytes: number, cachenaam: string, controle: string | null,
  voortgang: (bytes: number) => void, signaal?: AbortSignal,
) {
  const map = await opfsMap(mapnaam);
  const deelNaam = naam.replace(/\.[^.]+$/, '.deel');
  let deel: FileSystemFileHandle | null = null;
  try {
    deel = map ? await map.getFileHandle(deelNaam, { create: true }) : null;
    if (deel && typeof (deel as any).createWritable !== 'function') deel = null;
  } catch { deel = null; }
  if (!map || !deel) return bewaarBestand(mapnaam, naam, url, bytes, cachenaam, (f) => voortgang(f * bytes), signaal);

  let begin = (await deel.getFile()).size;
  if (begin > bytes) begin = 0;
  let r = await fetch(url, { cache: 'no-store', signal: signaal, headers: begin ? { Range: `bytes=${begin}-` } : {} });
  if (r.status === 416) { begin = 0; r = await fetch(url, { cache: 'no-store', signal: signaal }); }
  if (!r.ok || !r.body) throw new Error(`Download mislukt (${r.status})`);
  if (r.status !== 206) begin = 0; // de server stuurt het hele bestand
  if (begin === 0) { const w = await (deel as any).createWritable(); await w.close(); }

  let pos = begin;
  let buffer: Uint8Array[] = [];
  let inBuffer = 0;
  const vastleggen = async () => {
    if (!inBuffer) return;
    const w = await (deel as any).createWritable({ keepExistingData: true });
    await w.seek(pos);
    for (const stuk of buffer) await w.write(stuk);
    await w.close();
    pos += inBuffer;
    buffer = [];
    inBuffer = 0;
  };
  const lezer = r.body.getReader();
  voortgang(pos);
  try {
    for (;;) {
      const { done, value } = await lezer.read();
      if (done) break;
      buffer.push(value);
      inBuffer += value.byteLength;
      voortgang(pos + inBuffer);
      if (inBuffer >= STUK) await vastleggen();
    }
    await vastleggen();
  } catch (fout) {
    // Pauze of weggevallen verbinding: bewaar wat binnen is voor de volgende poging.
    try { await vastleggen(); } catch {}
    throw fout;
  }
  const bestand = await deel.getFile();
  if (bytes && bestand.size !== bytes) {
    await map.removeEntry(deelNaam).catch(() => {});
    throw new Error(`${naam}: grootte klopt niet (${bestand.size} in plaats van ${bytes})`);
  }
  // Grote bestanden alleen controleren als er een controlesom is en het geheugen het toelaat.
  if (controle && bestand.size < 128 * 1024 * 1024 && (await sha256(await bestand.arrayBuffer())) !== controle) {
    await map.removeEntry(deelNaam).catch(() => {});
    throw new Error(`${naam}: controlesom klopt niet`);
  }
  const definitief = await map.getFileHandle(naam, { create: true });
  const w = await (definitief as any).createWritable();
  await bestand.stream().pipeTo(w);
  await map.removeEntry(deelNaam);
}

// ---------- Wachtrij ----------

export type Staat = 'klaar-om-te-starten' | 'bezig' | 'gepauzeerd' | 'klaar';

/** Downloadt blokken na elkaar. Pauzeren breekt het huidige bestand af; hervatten gaat verder waar het was. */
export class Wachtrij {
  staat: Staat = 'klaar-om-te-starten';
  private index = 0;
  private huidig?: AbortController;
  readonly fouten = new Map<string, unknown>();

  constructor(
    readonly blokken: Blok[],
    private terug: {
      voortgang?: (b: Blok, bytes: number) => void;
      klaar?: (b: Blok) => void;
      fout?: (b: Blok, e: unknown) => void;
      staat?: (s: Staat) => void;
    } = {},
  ) {}

  get resterend() { return this.blokken.slice(this.index); }
  get huidigBlok(): Blok | undefined { return this.staat === 'bezig' ? this.blokken[this.index] : undefined; }
  get positie() { return this.index; }

  private zet(s: Staat) { this.staat = s; this.terug.staat?.(s); }

  async start() {
    if (this.staat === 'bezig') return;
    this.fouten.clear();
    this.zet('bezig');
    while (this.index < this.blokken.length) {
      const b = this.blokken[this.index];
      const ctrl = (this.huidig = new AbortController());
      try {
        await downloadBlok(b, (n) => this.terug.voortgang?.(b, n), ctrl.signal);
        this.terug.klaar?.(b);
      } catch (e) {
        if (ctrl.signal.aborted) return; // gepauzeerd: dit blok later verder
        this.fouten.set(b.id, e);
        this.terug.fout?.(b, e);
        if (!navigator.onLine) { this.zet('gepauzeerd'); return; }
      }
      this.index++;
    }
    this.zet('klaar');
  }

  pauzeer() {
    if (this.staat !== 'bezig') return;
    this.zet('gepauzeerd');
    this.huidig?.abort();
  }
}

// ---------- Talen van de app ----------

/**
 * Welke talen de app offline bewaart. De service worker haalt de pagina's van andere talen van
 * het toestel en vult ontbrekende talen aan (zie scripts/sw-template.js).
 */
export async function zetTalen(talen: string[]): Promise<boolean> {
  try {
    await (await caches.open(INSTELLINGEN)).put('/talen.json', new Response(JSON.stringify(talen), { headers: { 'Content-Type': 'application/json' } }));
  } catch {
    return false;
  }
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return true; // geldt bij de volgende installatie van de app
  return new Promise((klaar) => {
    const kanaal = new MessageChannel();
    const tijd = setTimeout(() => klaar(false), 120_000);
    kanaal.port1.onmessage = () => { clearTimeout(tijd); klaar(true); };
    sw.postMessage({ type: 'talen', talen }, [kanaal.port2]);
  });
}
