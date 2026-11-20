// Offline routeplanning: aanknopen aan het netwerk, A* en aanwijzingen.
// Draait in een Web Worker (route.worker.ts); geen DOM, geen netwerk.

import {
  type Graaf, K, VOET, FIETS, AUTO, EENR_AUTO, EENR_FIETS, ROTONDE, FIETSINFRA, ONVERHARD,
} from './routegraaf';

export type Modus = 'voet' | 'fiets' | 'auto';
export type Punt = { lon: number; lat: number };
export type Stap = { tekst: string; afstand: number; lon: number; lat: number; soort: string };
export type Route = {
  modus: Modus;
  afstand: number; // meter
  duur: number; // seconden
  lijn: [number, number][];
  stappen: Stap[];
  rekentijd: number; // ms
  bezocht: number;
  van: Punt;
  naar: Punt;
};

const SCHAAL = 1e5;
const M_PER_EENHEID = 1.1131949; // 1e-5 graad breedte in meter
// cos(51,6°): de kleinste waarde in België, zodat de schatting van A* nooit te hoog is.
const COS_MIN = 0.6211;

// ---------- Snelheid en gewicht per vervoerswijze ----------

const AUTO_STANDAARD: Record<number, number> = {
  [K.motorway]: 120, [K.motorway_link]: 60, [K.trunk]: 90, [K.trunk_link]: 50, [K.primary]: 70, [K.primary_link]: 45,
  [K.secondary]: 60, [K.secondary_link]: 40, [K.tertiary]: 50, [K.tertiary_link]: 35, [K.unclassified]: 40,
  [K.residential]: 30, [K.living_street]: 10, [K.service]: 15, [K.road]: 30, [K.track]: 15,
};
const AUTO_MAX_MS = 110 / 3.6;

function autoSnelheid(g: Graaf, e: number) {
  const k = g.klasse[e];
  let v = g.snelheid[e] || AUTO_STANDAARD[k] || 20;
  // Gemiddelde ligt onder de toegelaten snelheid (kruispunten, verkeer).
  v *= k <= K.trunk_link ? 0.9 : k <= K.secondary_link ? 0.8 : 0.7;
  return Math.min(v / 3.6, AUTO_MAX_MS);
}

function fietsSnelheid(g: Graaf, e: number) {
  const k = g.klasse[e];
  if (k === K.steps) return 0.6;
  if (k === K.pedestrian) return 2.5;
  return (g.vlag[e] & ONVERHARD ? 12 : 16) / 3.6;
}

function fietsVoorkeur(g: Graaf, e: number) {
  const k = g.klasse[e];
  const infra = g.vlag[e] & FIETSINFRA;
  if (k === K.cycleway) return 0.85;
  if (infra) return 0.95;
  if (k === K.trunk || k === K.trunk_link) return 2.5;
  if (k === K.primary || k === K.primary_link) return 1.7;
  if (k === K.secondary || k === K.secondary_link) return 1.35;
  if (k === K.tertiary || k === K.tertiary_link) return 1.1;
  if (k === K.service || k === K.track) return 1.15;
  return 1;
}
const FIETS_MIN = 0.85, FIETS_MAX_MS = 16 / 3.6;

function voetSnelheid(g: Graaf, e: number) {
  return (g.klasse[e] === K.steps ? 2 : 4.8) / 3.6;
}
function voetVoorkeur(g: Graaf, e: number) {
  const k = g.klasse[e];
  return k === K.trunk || k === K.trunk_link ? 1.6 : k === K.primary || k === K.primary_link ? 1.25 : 1;
}
const VOET_MAX_MS = 4.8 / 3.6;

const TOEGANG: Record<Modus, number> = { voet: VOET, fiets: FIETS, auto: AUTO };
const EENR: Record<Modus, number> = { voet: 0, fiets: EENR_FIETS, auto: EENR_AUTO };
const BLOK: Record<Modus, number> = { voet: 0, fiets: 2, auto: 1 };

/** Mag een segment in deze richting gebruikt worden (vooruit = van a naar b)? */
function mag(g: Graaf, e: number, m: Modus, vooruit: boolean) {
  const v = g.vlag[e];
  if (!(v & TOEGANG[m])) return false;
  return vooruit || !(v & EENR[m]);
}

/** Reistijd in seconden over het hele segment. */
function tijd(g: Graaf, e: number, m: Modus) {
  const s = m === 'auto' ? autoSnelheid(g, e) : m === 'fiets' ? fietsSnelheid(g, e) : voetSnelheid(g, e);
  return g.lengte[e] / s;
}
/** Kost voor het zoeken: reistijd maal voorkeur. */
function gewicht(g: Graaf, e: number, m: Modus) {
  const t = tijd(g, e, m);
  return m === 'fiets' ? t * fietsVoorkeur(g, e) : m === 'voet' ? t * voetVoorkeur(g, e) : t;
}
function schatting(m: Modus) {
  // seconden per meter vogelvlucht, nooit meer dan de werkelijke kost
  return m === 'auto' ? 1 / AUTO_MAX_MS : m === 'fiets' ? FIETS_MIN / FIETS_MAX_MS : 1 / VOET_MAX_MS;
}

// ---------- Ruimtelijk raster voor het aanknopen ----------

export type Raster = { x0: number; y0: number; cel: number; nx: number; ny: number; start: Uint32Array; lijst: Uint32Array };

function* punten(g: Graaf, e: number): Generator<[number, number]> {
  yield [g.x[g.a[e]], g.y[g.a[e]]];
  for (let p = g.vormStart[e]; p < g.vormStart[e + 1]; p++) yield [g.vormX[p], g.vormY[p]];
  yield [g.x[g.b[e]], g.y[g.b[e]]];
}

export function maakRaster(g: Graaf, cel = 500): Raster {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < g.n; i++) {
    if (g.x[i] < x0) x0 = g.x[i]; if (g.x[i] > x1) x1 = g.x[i];
    if (g.y[i] < y0) y0 = g.y[i]; if (g.y[i] > y1) y1 = g.y[i];
  }
  const nx = Math.max(1, Math.ceil((x1 - x0 + 1) / cel)), ny = Math.max(1, Math.ceil((y1 - y0 + 1) / cel));
  const tel = new Uint32Array(nx * ny + 1);
  const vakken = (e: number, doe: (c: number) => void) => {
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (const [px, py] of punten(g, e)) { if (px < a) a = px; if (px > c) c = px; if (py < b) b = py; if (py > d) d = py; }
    const i0 = Math.floor((a - x0) / cel), i1 = Math.floor((c - x0) / cel), j0 = Math.floor((b - y0) / cel), j1 = Math.floor((d - y0) / cel);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) doe(j * nx + i);
  };
  for (let e = 0; e < g.e; e++) vakken(e, (c) => tel[c + 1]++);
  for (let c = 0; c < nx * ny; c++) tel[c + 1] += tel[c];
  const lijst = new Uint32Array(tel[nx * ny]);
  const vul = tel.slice(0, nx * ny);
  for (let e = 0; e < g.e; e++) vakken(e, (c) => (lijst[vul[c]++] = e));
  return { x0, y0, cel, nx, ny, start: tel, lijst };
}

export type Aanknoping = { e: number; t: number; x: number; y: number; afstand: number };

/** Dichtstbijzijnde punt op een segment dat de vervoerswijze mag gebruiken. */
export function knoopAan(g: Graaf, r: Raster, p: Punt, m: Modus, maxMeter = 5000): Aanknoping | null {
  const px = p.lon * SCHAAL, py = p.lat * SCHAAL;
  const c = Math.cos((p.lat * Math.PI) / 180);
  const ci = Math.floor((px - r.x0) / r.cel), cj = Math.floor((py - r.y0) / r.cel);
  let beste: Aanknoping | null = null;
  const celMeter = r.cel * M_PER_EENHEID * c;
  const maxRing = Math.ceil(maxMeter / celMeter) + 1;
  const gezien = new Set<number>();
  for (let ring = 0; ring <= maxRing; ring++) {
    if (beste && beste.afstand < (ring - 1) * celMeter) break;
    for (let j = cj - ring; j <= cj + ring; j++) {
      for (let i = ci - ring; i <= ci + ring; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== ring) continue;
        if (i < 0 || j < 0 || i >= r.nx || j >= r.ny) continue;
        const cel = j * r.nx + i;
        for (let q = r.start[cel]; q < r.start[cel + 1]; q++) {
          const e = r.lijst[q];
          if (gezien.has(e)) continue;
          gezien.add(e);
          if (!(g.vlag[e] & TOEGANG[m])) continue;
          // Snelwegen alleen aanknopen als er niets anders in de buurt is.
          const straf = m === 'auto' && g.klasse[e] <= K.trunk_link ? 60 : 0;
          const k = dichtstOpSegment(g, e, px, py, c);
          if (k && (!beste || k.afstand + straf < beste.afstand + (beste as any).straf)) {
            beste = { ...k, straf } as Aanknoping;
          }
        }
      }
    }
  }
  if (!beste || beste.afstand > maxMeter) return null;
  return beste;
}

function dichtstOpSegment(g: Graaf, e: number, px: number, py: number, c: number) {
  let vorige: [number, number] | null = null;
  let langs = 0, beste: { d: number; langs: number; x: number; y: number } | null = null;
  for (const pt of punten(g, e)) {
    if (vorige) {
      const ax = vorige[0] * c, ay = vorige[1], bx = pt[0] * c, by = pt[1];
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((px * c - ax) * dx + (py - ay) * dy) / l2)) : 0;
      const qx = ax + t * dx, qy = ay + t * dy;
      const d = Math.hypot(px * c - qx, py - qy);
      const l = Math.sqrt(l2);
      if (!beste || d < beste.d) beste = { d, langs: langs + t * l, x: qx / c, y: qy };
      langs += l;
    }
    vorige = pt;
  }
  if (!beste) return null;
  return { e, t: langs ? beste.langs / langs : 0, x: beste.x, y: beste.y, afstand: beste.d * M_PER_EENHEID };
}

// ---------- A* ----------

class Hoop {
  knoop = new Uint32Array(1024);
  sleutel = new Float64Array(1024);
  n = 0;
  zet(k: number, s: number) {
    if (this.n === this.knoop.length) {
      const k2 = new Uint32Array(this.n * 2); k2.set(this.knoop); this.knoop = k2;
      const s2 = new Float64Array(this.n * 2); s2.set(this.sleutel); this.sleutel = s2;
    }
    let i = this.n++;
    while (i > 0) {
      const o = (i - 1) >> 1;
      if (this.sleutel[o] <= s) break;
      this.knoop[i] = this.knoop[o]; this.sleutel[i] = this.sleutel[o]; i = o;
    }
    this.knoop[i] = k; this.sleutel[i] = s;
  }
  neem(): number {
    const top = this.knoop[0];
    const k = this.knoop[--this.n], s = this.sleutel[this.n];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= this.n) break;
      if (c + 1 < this.n && this.sleutel[c + 1] < this.sleutel[c]) c++;
      if (this.sleutel[c] >= s) break;
      this.knoop[i] = this.knoop[c]; this.sleutel[i] = this.sleutel[c]; i = c;
    }
    this.knoop[i] = k; this.sleutel[i] = s;
    return top;
  }
  get min() { return this.sleutel[0]; }
}

/** Werkgeheugen per netwerk, hergebruikt tussen berekeningen. */
export type Geheugen = { kost: Float64Array; vorige: Int32Array; ronde: Uint32Array; klaar: Uint32Array; teller: number };
export function maakGeheugen(g: Graaf): Geheugen {
  return { kost: new Float64Array(g.n), vorige: new Int32Array(g.n), ronde: new Uint32Array(g.n), klaar: new Uint32Array(g.n), teller: 0 };
}

type Stuk = { e: number; vooruit: boolean; van: number; tot: number }; // van/tot: fractie van het segment

export function bereken(g: Graaf, r: Raster, mem: Geheugen, van: Punt, naar: Punt, m: Modus): Route | { fout: string } {
  const begin = performance.now();
  const A = knoopAan(g, r, van, m);
  if (!A) return { fout: 'Punt A ligt niet in de buurt van een weg voor deze vervoerswijze, of buiten de routepakketten op dit toestel.' };
  const B = knoopAan(g, r, naar, m);
  if (!B) return { fout: 'Punt B ligt niet in de buurt van een weg voor deze vervoerswijze, of buiten de routepakketten op dit toestel.' };

  const ronde = ++mem.teller;
  const { kost, vorige, klaar } = mem;
  const h = schatting(m);
  const doelX = g.x[g.b[B.e]], doelY = g.y[g.b[B.e]];
  const c = COS_MIN;
  const rest = (v: number) => Math.hypot((g.x[v] - doelX) * c, g.y[v] - doelY) * M_PER_EENHEID * h;
  // De schatting meet tot knoop b van het doelsegment; trek de lengte van dat segment af zodat ze nooit te hoog is.
  const marge = g.lengte[B.e] * h;
  const hoop = new Hoop();
  const zet = (v: number, k: number, via: number) => {
    if (mem.ronde[v] !== ronde) { mem.ronde[v] = ronde; kost[v] = Infinity; }
    if (k < kost[v]) { kost[v] = k; vorige[v] = via; hoop.zet(v, k + Math.max(0, rest(v) - marge)); }
  };
  // Vertrek: van het aanknopingspunt naar knoop a (achteruit) of b (vooruit).
  const wA = gewicht(g, A.e, m);
  if (mag(g, A.e, m, true)) zet(g.b[A.e], (1 - A.t) * wA, -1 - A.e * 2);
  if (mag(g, A.e, m, false)) zet(g.a[A.e], A.t * wA, -2 - A.e * 2);

  // Aankomst: vanaf knoop a vooruit tot het punt, of vanaf b achteruit.
  const wB = gewicht(g, B.e, m);
  const eindA = mag(g, B.e, m, true) ? B.t * wB : Infinity;
  const eindB = mag(g, B.e, m, false) ? (1 - B.t) * wB : Infinity;
  let besteKost = Infinity, besteEind = -1;
  // Zelfde segment: rechtstreeks.
  let rechtstreeks = false;
  if (A.e === B.e) {
    const vooruit = B.t >= A.t;
    if (mag(g, A.e, m, vooruit)) { besteKost = Math.abs(B.t - A.t) * wA; rechtstreeks = true; }
  }

  const blokbit = BLOK[m];
  let bezocht = 0;
  while (hoop.n) {
    if (hoop.min >= besteKost) break;
    const u = hoop.neem();
    if (klaar[u] === ronde) continue;
    klaar[u] = ronde;
    bezocht++;
    const ku = kost[u];
    if (u === g.a[B.e] && ku + eindA < besteKost) { besteKost = ku + eindA; besteEind = 0; rechtstreeks = false; }
    if (u === g.b[B.e] && ku + eindB < besteKost) { besteKost = ku + eindB; besteEind = 1; rechtstreeks = false; }
    // Een versperring (paaltje, draaihek) kan je bereiken maar niet passeren.
    if (blokbit && g.blok[u] & blokbit) continue;
    for (let q = g.buurStart[u]; q < g.buurStart[u + 1]; q++) {
      const e = g.buur[q];
      const vooruit = g.a[e] === u;
      if (!mag(g, e, m, vooruit)) continue;
      const v = vooruit ? g.b[e] : g.a[e];
      if (v === u) continue;
      if (klaar[v] === ronde) continue;
      zet(v, ku + gewicht(g, e, m), vooruit ? e * 2 : e * 2 + 1);
    }
  }
  if (besteKost === Infinity) return { fout: 'Geen route gevonden tussen A en B met deze vervoerswijze in de routepakketten op dit toestel.' };

  // Pad terug opbouwen.
  const stukken: Stuk[] = [];
  if (rechtstreeks) {
    stukken.push({ e: A.e, vooruit: B.t >= A.t, van: A.t, tot: B.t });
  } else {
    stukken.push(besteEind === 0 ? { e: B.e, vooruit: true, van: 0, tot: B.t } : { e: B.e, vooruit: false, van: 1, tot: B.t });
    let v = besteEind === 0 ? g.a[B.e] : g.b[B.e];
    for (;;) {
      const via = vorige[v];
      if (via < 0) {
        const e = Math.floor((-via - 1) / 2);
        const vooruit = (-via - 1) % 2 === 0;
        stukken.push(vooruit ? { e, vooruit: true, van: A.t, tot: 1 } : { e, vooruit: false, van: A.t, tot: 0 });
        break;
      }
      const e = via >> 1, vooruit = (via & 1) === 0;
      stukken.push({ e, vooruit, van: vooruit ? 0 : 1, tot: vooruit ? 1 : 0 });
      v = vooruit ? g.a[e] : g.b[e];
    }
    stukken.reverse();
  }

  let afstand = 0, duur = 0;
  for (const s of stukken) {
    const f = Math.abs(s.tot - s.van);
    afstand += g.lengte[s.e] * f;
    duur += tijd(g, s.e, m) * f;
  }
  const { lijn, stappen } = beschrijf(g, stukken, m, naar);
  return {
    modus: m, afstand, duur, lijn, stappen, bezocht,
    rekentijd: performance.now() - begin,
    van: { lon: A.x / SCHAAL, lat: A.y / SCHAAL },
    naar: { lon: B.x / SCHAAL, lat: B.y / SCHAAL },
  };
}

// ---------- Geometrie en aanwijzingen ----------

/** Punten van een stuk segment, in rijrichting, in graden. */
function stukLijn(g: Graaf, s: Stuk): [number, number][] {
  const pts = [...punten(g, s.e)];
  const c = Math.cos((pts[0][1] / SCHAAL) * Math.PI / 180);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot((pts[i][0] - pts[i - 1][0]) * c, pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  const op = (f: number): [number, number] => {
    const d = f * L;
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const t = cum[i] === cum[i - 1] ? 0 : (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
    return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
  };
  const lo = Math.min(s.van, s.tot), hi = Math.max(s.van, s.tot);
  const uit: [number, number][] = [op(lo)];
  for (let i = 1; i < pts.length - 1; i++) if (cum[i] / L > lo && cum[i] / L < hi) uit.push(pts[i]);
  uit.push(op(hi));
  if (!s.vooruit) uit.reverse();
  return uit.map(([x, y]) => [x / SCHAAL, y / SCHAAL]);
}

function koers(a: [number, number], b: [number, number]) {
  const c = Math.cos((a[1] * Math.PI) / 180);
  return (Math.atan2((b[0] - a[0]) * c, b[1] - a[1]) * 180) / Math.PI;
}
/** Koers aan het begin of einde van een lijn, gemeten over ongeveer 20 m. */
function koersBij(lijn: [number, number][], einde: boolean) {
  const pts = einde ? [...lijn].reverse() : lijn;
  const a = pts[0];
  let b = pts[1] ?? a;
  for (let i = 1; i < pts.length; i++) {
    b = pts[i];
    if (Math.hypot((b[0] - a[0]) * 0.63, b[1] - a[1]) * 111320 > 20) break;
  }
  return einde ? koers(b, a) : koers(a, b);
}
const WINDSTREKEN = ['het noorden', 'het noordoosten', 'het oosten', 'het zuidoosten', 'het zuiden', 'het zuidwesten', 'het westen', 'het noordwesten'];

const NAAMLOOS: Record<number, string> = {
  [K.cycleway]: 'het fietspad', [K.footway]: 'het voetpad', [K.path]: 'het pad', [K.steps]: 'de trap', [K.track]: 'de veldweg',
  [K.service]: 'de toegangsweg', [K.pedestrian]: 'de voetgangerszone', [K.bridleway]: 'het ruiterpad', [K.living_street]: 'het woonerf',
  [K.motorway_link]: 'de op- of afrit', [K.trunk_link]: 'de verbindingsweg', [K.primary_link]: 'de verbindingsweg',
  [K.secondary_link]: 'de verbindingsweg', [K.tertiary_link]: 'de verbindingsweg', [K.motorway]: 'de autosnelweg',
};
function naamVan(g: Graaf, e: number) {
  let n = g.namen[g.naam[e]];
  if (n?.startsWith('richting ')) {
    // Richtingborden: per rijstrook gescheiden met |; dubbels weg, hoogstens drie bestemmingen.
    const doelen = [...new Set(n.slice(9).split(/\s*[|/]\s*/).filter(Boolean))];
    n = `richting ${doelen.slice(0, 3).join(', ')}`;
  }
  return n || NAAMLOOS[g.klasse[e]] || 'de weg';
}

function bocht(hoek: number): { tekst: string; soort: string } {
  const a = Math.abs(hoek);
  const kant = hoek < 0 ? 'links' : 'rechts';
  if (a < 25) return { tekst: 'Ga rechtdoor', soort: 'rechtdoor' };
  if (a < 60) return { tekst: `Houd ${kant} aan`, soort: `flauw-${kant}` };
  if (a < 135) return { tekst: `Sla ${kant}af`, soort: kant };
  return { tekst: `Sla scherp ${kant}af`, soort: `scherp-${kant}` };
}

function beschrijf(g: Graaf, stukken: Stuk[], m: Modus, naar: Punt) {
  const lijn: [number, number][] = [];
  const lijnen = stukken.map((s) => stukLijn(g, s));
  for (const l of lijnen) for (const p of l) {
    const v = lijn[lijn.length - 1];
    if (!v || v[0] !== p[0] || v[1] !== p[1]) lijn.push(p);
  }

  // Groepen: opeenvolgende stukken met dezelfde naam, of één rotonde.
  type Groep = { naam: string; van: number; tot: number; rotonde: boolean; afstand: number };
  const groepen: Groep[] = [];
  const isAfrit = (e: number) => g.klasse[e] === K.motorway_link || g.klasse[e] === K.trunk_link;
  stukken.forEach((s, i) => {
    const naam = naamVan(g, s.e);
    const rot = !!(g.vlag[s.e] & ROTONDE);
    const lengte = g.lengte[s.e] * Math.abs(s.tot - s.van);
    const laatste = groepen[groepen.length - 1];
    // Een reeks op- en afritten (knooppunt) is één aanwijzing, met het eerste richtingbord.
    const afrit = laatste && !rot && !laatste.rotonde && isAfrit(s.e) && isAfrit(stukken[laatste.tot].e);
    if (laatste && laatste.rotonde === rot && (rot || afrit || laatste.naam === naam)) {
      if (afrit && !laatste.naam.startsWith('richting ') && naam.startsWith('richting ')) laatste.naam = naam;
      laatste.tot = i; laatste.afstand += lengte;
    } else groepen.push({ naam, van: i, tot: i, rotonde: rot, afstand: lengte });
  });
  // Korte tussenstukken (tot 30 m) tussen twee delen van dezelfde straat samenvoegen.
  for (let i = 1; i < groepen.length - 1; i++) {
    const [a, b, c] = [groepen[i - 1], groepen[i], groepen[i + 1]];
    if (!b.rotonde && !a.rotonde && !c.rotonde && b.afstand <= 30 && a.naam === c.naam) {
      a.tot = c.tot; a.afstand += b.afstand + c.afstand; groepen.splice(i, 2); i--;
    }
  }
  // Heel korte stukken (< 15 m, bv. een oversteek) krijgen geen eigen aanwijzing.
  for (let i = 1; i < groepen.length - 1; i++) {
    const [a, b] = [groepen[i - 1], groepen[i]];
    if (!a.rotonde && !b.rotonde && b.afstand < 15) { a.tot = b.tot; a.afstand += b.afstand; groepen.splice(i, 1); i--; }
  }

  // Een heel kort eerste stuk (aanknopen op een zijstraat): vertrekken via de volgende straat.
  if (groepen.length > 1 && groepen[0].afstand < 15 && !groepen[0].rotonde && !groepen[1].rotonde) {
    groepen[1].van = groepen[0].van; groepen[1].afstand += groepen[0].afstand; groepen.shift();
  }

  const stappen: Stap[] = [];
  groepen.forEach((gr, i) => {
    const eerste = lijnen[gr.van][0];
    if (i === 0) {
      const k = (koersBij(lijnen[gr.van], false) + 360) % 360;
      const ws = WINDSTREKEN[Math.round(k / 45) % 8];
      const via = gr.naam.startsWith('richting ') ? 'de op- of afrit' : gr.naam;
      stappen.push({ tekst: `Vertrek via ${via} richting ${ws}`, afstand: gr.afstand, lon: eerste[0], lat: eerste[1], soort: 'vertrek' });
      if (!gr.rotonde) return;
    }
    if (gr.rotonde) {
      // Afslagen tellen: knopen op de rotonde met een ander bruikbaar segment.
      let afslagen = 0;
      for (let j = gr.van; j <= gr.tot; j++) {
        const s = stukken[j];
        const knoop = s.vooruit ? g.b[s.e] : g.a[s.e];
        if (j === gr.tot && i < groepen.length - 1) { afslagen++; break; }
        for (let q = g.buurStart[knoop]; q < g.buurStart[knoop + 1]; q++) {
          const e = g.buur[q];
          if (g.vlag[e] & ROTONDE) continue;
          if (mag(g, e, m, g.a[e] === knoop)) { afslagen++; break; }
        }
      }
      const volgende = groepen[i + 1];
      const doel = volgende ? (volgende.naam.startsWith('richting ') ? ` ${volgende.naam}` : ` naar ${volgende.naam}`) : '';
      const tekst = `Neem op de rotonde de ${Math.max(1, afslagen)}e afslag${doel}`;
      stappen.push({ tekst, afstand: gr.afstand + (volgende?.afstand ?? 0), lon: eerste[0], lat: eerste[1], soort: 'rotonde' });
      if (volgende) (volgende as any).opgenomen = true;
      return;
    }
    if ((gr as any).opgenomen) return;
    const vorigeLijn = lijnen[groepen[i - 1].tot];
    const hoek = ((koersBij(lijnen[gr.van], false) - koersBij(vorigeLijn, true) + 540) % 360) - 180;
    const b = bocht(hoek);
    const opAf = g.klasse[stukken[gr.van].e] === K.motorway_link;
    const bord = gr.naam.startsWith('richting ');
    const tekst = opAf
      ? `Neem de op- of afrit${bord ? ` ${gr.naam}` : gr.naam === NAAMLOOS[K.motorway_link] ? '' : ` ${gr.naam}`}`
      : bord ? `${b.tekst} ${gr.naam}`
      : b.soort === 'rechtdoor' ? `Ga rechtdoor op ${gr.naam}` : `${b.tekst} naar ${gr.naam}`;
    stappen.push({ tekst, afstand: gr.afstand, lon: eerste[0], lat: eerste[1], soort: b.soort });
  });
  const eind = lijn[lijn.length - 1];
  stappen.push({ tekst: 'Aankomst bij B', afstand: 0, lon: eind?.[0] ?? naar.lon, lat: eind?.[1] ?? naar.lat, soort: 'aankomst' });
  return { lijn, stappen };
}
