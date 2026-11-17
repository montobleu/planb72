// Routepakketten lezen (formaat van pipeline/routegraaf.py) en regio's samenvoegen.
// Bestand: "PB72PAK1", u32 versie, u32 lengte zoekdeel, u32 lengte netwerkdeel, dan beide delen
// als afzonderlijke gzip-blokken. Elk deel: u32 koplengte, JSON-kop met sectietabel, secties
// (little-endian, op 4 bytes uitgelijnd). Coördinaten in 1e-5 graad.

export const VOET = 1, FIETS = 2, AUTO = 4, EENR_AUTO = 8, EENR_FIETS = 16, ROTONDE = 32, FIETSINFRA = 64, ONVERHARD = 128;

/** Dezelfde volgorde als KLASSEN in pipeline/routegraaf.py. */
export const KLASSEN = [
  'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'service', 'track', 'road',
  'pedestrian', 'footway', 'cycleway', 'path', 'bridleway', 'steps',
] as const;
export const K = Object.fromEntries(KLASSEN.map((k, i) => [k, i])) as Record<(typeof KLASSEN)[number], number>;

export type Sectie = { naam: string; type: 'u8' | 'i16' | 'u32' | 'i32' | 'utf8'; bytes: number };
type Kop = { id: string; versie: number; osm: string; bbox: [number, number, number, number]; schaal: number; secties: Sectie[]; [k: string]: unknown };

export type Zoekdeel = {
  id: string;
  soort: Uint8Array;
  naam: Uint32Array;
  plaats: Uint32Array;
  x: Int32Array;
  y: Int32Array;
  namen: string[];
};

export type Netwerkdeel = {
  id: string;
  osm: string;
  bbox: [number, number, number, number];
  knoopId: Uint32Array;
  knoopX: Int32Array;
  knoopY: Int32Array;
  randId: Uint32Array;
  randA: Uint32Array;
  randB: Uint32Array;
  randLengte: Uint32Array; // decimeter
  randKlasse: Uint8Array;
  randVlag: Uint8Array;
  randSnelheid: Uint8Array;
  randNaam: Uint32Array;
  randVorm: Uint32Array; // E + 1 beginposities in vorm (in punten)
  vorm: Int16Array; // stappen ten opzichte van het vorige punt, beginnend bij knoop A
  blokKnoop: Uint32Array;
  blokSoort: Uint8Array;
  namen: string[];
};

/** Het samengevoegde netwerk van één of meer regio's. */
export type Graaf = {
  regios: string[];
  n: number;
  e: number;
  x: Int32Array;
  y: Int32Array;
  a: Uint32Array;
  b: Uint32Array;
  lengte: Float32Array; // meter
  klasse: Uint8Array;
  vlag: Uint8Array;
  snelheid: Uint8Array;
  naam: Uint32Array;
  vormStart: Uint32Array;
  vormX: Int32Array; // absolute tussenpunten
  vormY: Int32Array;
  blok: Uint8Array; // per knoop: 1 auto, 2 fiets
  namen: string[];
  /** Aangrenzende segmenten per knoop (CSR). */
  buurStart: Uint32Array;
  buur: Uint32Array;
};

async function pak(blok: Blob): Promise<ArrayBuffer> {
  const stroom = blok.stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stroom).arrayBuffer();
}

function secties(buf: ArrayBuffer): { kop: Kop; s: Record<string, ArrayBufferView | string> } {
  const dv = new DataView(buf);
  const koplengte = dv.getUint32(0, true);
  const kop = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, koplengte))) as Kop;
  let pos = 4 + koplengte;
  const s: Record<string, ArrayBufferView | string> = {};
  for (const sec of kop.secties) {
    const n = sec.bytes;
    if (sec.type === 'utf8') s[sec.naam] = new TextDecoder().decode(new Uint8Array(buf, pos, n));
    else if (sec.type === 'u8') s[sec.naam] = new Uint8Array(buf, pos, n);
    else if (sec.type === 'i16') s[sec.naam] = new Int16Array(buf, pos, n / 2);
    else if (sec.type === 'u32') s[sec.naam] = new Uint32Array(buf, pos, n / 4);
    else s[sec.naam] = new Int32Array(buf, pos, n / 4);
    pos += n + ((4 - (n % 4)) % 4);
  }
  return { kop, s };
}

async function delen(bestand: Blob) {
  const kop = new DataView(await bestand.slice(0, 20).arrayBuffer());
  const magie = new TextDecoder().decode(new Uint8Array(kop.buffer, 0, 8));
  if (magie !== 'PB72PAK1') throw new Error('Geen routepakket');
  const versie = kop.getUint32(8, true);
  if (versie !== 1) throw new Error(`Routepakket versie ${versie} wordt niet ondersteund; werk de app bij`);
  const zoek = kop.getUint32(12, true);
  const netwerk = kop.getUint32(16, true);
  return { zoek: bestand.slice(20, 20 + zoek), netwerk: bestand.slice(20 + zoek, 20 + zoek + netwerk) };
}

export async function leesZoekdeel(bestand: Blob): Promise<Zoekdeel> {
  const { kop, s } = secties(await pak((await delen(bestand)).zoek));
  return {
    id: kop.id,
    soort: s.soort as Uint8Array,
    naam: s.naam as Uint32Array,
    plaats: s.plaats as Uint32Array,
    x: s.x as Int32Array,
    y: s.y as Int32Array,
    namen: (s.namen as string).split('\n'),
  };
}

export async function leesNetwerkdeel(bestand: Blob): Promise<Netwerkdeel> {
  const { kop, s } = secties(await pak((await delen(bestand)).netwerk));
  const d = s as Record<string, any>;
  // Knoopnummers, coördinaten en segmentnummers staan als verschillen: optellen.
  for (const k of ['knoopId', 'knoopX', 'knoopY', 'randId']) {
    const a = d[k] as Uint32Array | Int32Array;
    for (let i = 1; i < a.length; i++) a[i] += a[i - 1];
  }
  return { ...(d as Omit<Netwerkdeel, 'id' | 'osm' | 'bbox' | 'namen'>), id: kop.id, osm: kop.osm, bbox: kop.bbox, namen: (d.namen as string).split('\n') };
}

/** Voeg regio's samen tot één netwerk. Knopen en segmenten in de overlap komen maar één keer voor. */
export function voegSamen(delen: Netwerkdeel[]): Graaf {
  const knoopIndex = new Map<number, number>();
  let n = 0;
  const kaarten: Uint32Array[] = [];
  for (const d of delen) {
    const kaart = new Uint32Array(d.knoopId.length);
    for (let i = 0; i < d.knoopId.length; i++) {
      const g = d.knoopId[i];
      let j = knoopIndex.get(g);
      if (j === undefined) { j = n++; knoopIndex.set(g, j); }
      kaart[i] = j;
    }
    kaarten.push(kaart);
  }
  const x = new Int32Array(n), y = new Int32Array(n), blok = new Uint8Array(n);
  delen.forEach((d, r) => {
    const kaart = kaarten[r];
    for (let i = 0; i < kaart.length; i++) { x[kaart[i]] = d.knoopX[i]; y[kaart[i]] = d.knoopY[i]; }
    for (let i = 0; i < d.blokKnoop.length; i++) blok[kaart[d.blokKnoop[i]]] |= d.blokSoort[i];
  });

  // Segmenten: ontdubbelen op landelijk volgnummer.
  const gezien = delen.length > 1 ? new Set<number>() : null;
  const kies: [number, number][] = [];
  let vormpunten = 0;
  delen.forEach((d, r) => {
    for (let i = 0; i < d.randId.length; i++) {
      if (gezien) {
        if (gezien.has(d.randId[i])) continue;
        gezien.add(d.randId[i]);
      }
      kies.push([r, i]);
      vormpunten += d.randVorm[i + 1] - d.randVorm[i];
    }
  });
  const e = kies.length;
  const g: Graaf = {
    regios: delen.map((d) => d.id), n, e, x, y, blok,
    a: new Uint32Array(e), b: new Uint32Array(e), lengte: new Float32Array(e), klasse: new Uint8Array(e),
    vlag: new Uint8Array(e), snelheid: new Uint8Array(e), naam: new Uint32Array(e), vormStart: new Uint32Array(e + 1),
    vormX: new Int32Array(vormpunten), vormY: new Int32Array(vormpunten), namen: [],
    buurStart: new Uint32Array(n + 1), buur: new Uint32Array(2 * e),
  };
  const naamBegin: number[] = [];
  for (const d of delen) { naamBegin.push(g.namen.length); g.namen.push(...d.namen); }
  let v = 0;
  kies.forEach(([r, i], k) => {
    const d = delen[r];
    const kaart = kaarten[r];
    g.a[k] = kaart[d.randA[i]];
    g.b[k] = kaart[d.randB[i]];
    g.lengte[k] = d.randLengte[i] / 10;
    g.klasse[k] = d.randKlasse[i];
    g.vlag[k] = d.randVlag[i];
    g.snelheid[k] = d.randSnelheid[i];
    g.naam[k] = d.randNaam[i] ? naamBegin[r] + d.randNaam[i] : 0;
    g.vormStart[k] = v;
    let px = d.knoopX[d.randA[i]], py = d.knoopY[d.randA[i]];
    for (let p = d.randVorm[i]; p < d.randVorm[i + 1]; p++) {
      px += d.vorm[2 * p]; py += d.vorm[2 * p + 1];
      g.vormX[v] = px; g.vormY[v] = py; v++;
    }
  });
  g.vormStart[e] = v;

  // Buren per knoop.
  const graad = g.buurStart;
  for (let k = 0; k < e; k++) { graad[g.a[k] + 1]++; graad[g.b[k] + 1]++; }
  for (let i = 0; i < n; i++) graad[i + 1] += graad[i];
  const vul = graad.slice(0, n);
  for (let k = 0; k < e; k++) { g.buur[vul[g.a[k]]++] = k; g.buur[vul[g.b[k]]++] = k; }
  return g;
}
