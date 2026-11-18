// Keuzehulp: wat komt er op dit toestel? Gedeelde logica zonder DOM, voor de website, de
// web-app en later de apps voor iOS en Android (Capacitor, zie docs/downloaden.md).
// Werkt op de catalogus (site/public/data/catalogus.json, gemaakt door pipeline/catalogus.py).
// Alles wat de omgeving geeft (opgeslagen landkeuze, talen van het toestel, vrije opslag,
// soort verbinding) komt als argument binnen, zodat een native schil dezelfde code gebruikt.

// ---------- Catalogus ----------

export type Soort = 'basiskaart' | 'straat' | 'routes' | 'lagen' | 'inhoud';
export type Niveau = 'europa' | 'overzicht' | 'standaard' | 'straat';
/** Een bestand van een blok; `id` is het kaartpakket (kaarten.json) of routepakket (routes.json). */
export type Bestand = { id?: string; pad: string; bytes: number; sha256: string | null };
export type Blok = {
  id: string;
  soort: Soort;
  niveau: Niveau;
  naam: string;
  omschrijving: string;
  bytes: number;
  versie: string | null;
  land?: string;
  taal?: string;
  maxzoom?: number;
  bbox?: [number, number, number, number];
  /** Hoort bij het kleinste pakket (Zak). */
  zak: boolean;
  /** Zit in de app zelf (offline kern): niets apart te downloaden. */
  kern?: boolean;
  /** Grote blokken (straatniveau, routes, de standaardkaart van grote landen) hebben meerdere bestanden. */
  bestanden: Bestand[];
  vereist: string[];
};
export type CatLand = { code: string; naam: Record<string, string>; talen: string[]; buren: string[] };
export type Catalogus = { formaat: 'planb72-catalogus'; versie: number; bron: string; gemaakt?: string; landen: CatLand[]; talen: string[]; blokken: Blok[] };

export function isCatalogus(x: unknown): x is Catalogus {
  const c = x as Catalogus;
  return !!c && c.formaat === 'planb72-catalogus' && Array.isArray(c.blokken) && Array.isArray(c.landen);
}

// ---------- Keuze ----------
// Per land een detailniveau, kaartlagen en routes; nooit per provincie of regio.

export type Voorstel = 'eigen' | 'buren' | 'kies' | 'alles';
export type Detail = 'overzicht' | 'standaard' | 'straat';
export type LandKeuze = {
  code: string;
  detail: Detail;
  lagen: boolean;
  routes: boolean;
};
export type Keuze = {
  /** Eigen land: altijd het vertrekpunt en het eerste in `landen`. */
  eigen: string;
  voorstel: Voorstel;
  landen: LandKeuze[];
  talen: string[];
  /** Het uitgebreide overzicht van Europa (meer steden en wegen) bovenop het gewone. */
  europa: boolean;
};

export const VOORSTELLEN: Voorstel[] = ['eigen', 'buren', 'kies', 'alles'];
export const DETAILS: Detail[] = ['overzicht', 'standaard', 'straat'];

const landVan = (cat: Catalogus, code: string) => cat.landen.find((l) => l.code === code);
export const heeftRoutes = (cat: Catalogus, code: string) => cat.blokken.some((b) => b.soort === 'routes' && b.land === code);

/** Standaard per land: het eigen land wat ruimer, andere landen het overzicht. */
export function landStandaard(cat: Catalogus, code: string, eigen: boolean): LandKeuze {
  return { code, detail: eigen ? 'standaard' : 'overzicht', lagen: true, routes: eigen && heeftRoutes(cat, code) };
}

/**
 * Raad het eigen land. Volgorde: wat de gebruiker eerder koos (landkeuze), de regio in de
 * taal van het toestel (nl-BE, fr-FR), de taal van de pagina. `zeker` is alleen waar bij een
 * eerdere keuze; anders vraagt de keuzehulp het na.
 */
export function raadEigenLand(
  cat: Catalogus,
  bron: { opgeslagen?: string[] | null; toesteltalen?: readonly string[]; paginataal?: string },
): { land: string; zeker: boolean } {
  const codes = cat.landen.map((l) => l.code);
  const eerder = bron.opgeslagen?.find((c) => codes.includes(c));
  if (eerder) return { land: eerder, zeker: true };
  for (const t of bron.toesteltalen ?? []) {
    const regio = /^[a-z]{2,3}-([a-z]{2})\b/i.exec(t)?.[1]?.toLowerCase();
    if (regio && codes.includes(regio)) return { land: regio, zeker: false };
  }
  // Alleen een taal: Nederlands en Engels naar het eerste land van het project (België).
  const perTaal: Record<string, string> = { nl: 'be', fr: 'fr', de: 'de', en: 'be', lb: 'lu' };
  const taal = (bron.paginataal ?? bron.toesteltalen?.[0] ?? 'nl').slice(0, 2).toLowerCase();
  const gok = perTaal[taal];
  return { land: gok && codes.includes(gok) ? gok : codes.includes('be') ? 'be' : codes[0], zeker: false };
}

/** Talen die standaard meekomen: de taal van de pagina en die van het eigen land. */
export function standaardTalen(cat: Catalogus, eigen: string, paginataal: string): string[] {
  const uit = new Set([paginataal, ...(landVan(cat, eigen)?.talen ?? [])]);
  return cat.talen.filter((t) => uit.has(t));
}

/** Een nieuwe keuze vanuit het eigen land en een voorstel. */
export function nieuweKeuze(cat: Catalogus, eigen: string, voorstel: Voorstel, paginataal: string): Keuze {
  const k: Keuze = { eigen, voorstel: 'eigen', landen: [landStandaard(cat, eigen, true)], talen: standaardTalen(cat, eigen, paginataal), europa: false };
  return pasVoorstelToe(cat, k, voorstel);
}

/** Pas een voorstel toe. Wat de gebruiker per land al instelde, blijft waar het kan. */
export function pasVoorstelToe(cat: Catalogus, k: Keuze, voorstel: Voorstel): Keuze {
  const bestaand = new Map(k.landen.map((l) => [l.code, l]));
  const houd = (code: string) => bestaand.get(code) ?? landStandaard(cat, code, code === k.eigen);
  let codes: string[];
  if (voorstel === 'eigen') codes = [k.eigen];
  else if (voorstel === 'buren') codes = [k.eigen, ...(landVan(cat, k.eigen)?.buren ?? [])];
  else if (voorstel === 'alles') codes = [k.eigen, ...cat.landen.map((l) => l.code).filter((c) => c !== k.eigen)];
  else codes = k.landen.map((l) => l.code);
  let landen = codes.map(houd);
  let talen = k.talen;
  let europa = k.europa;
  if (voorstel === 'alles') {
    europa = true;
    // Alles: elk land volledig op straatniveau, met routes en lagen, in alle talen.
    landen = landen.map((l) => ({ ...l, detail: 'straat', lagen: true, routes: heeftRoutes(cat, l.code) }));
    talen = [...cat.talen];
  }
  return { ...k, voorstel, landen, talen, europa };
}

/** Een ander eigen land: komt vooraan, en het voorstel wordt opnieuw toegepast. */
export function zetEigenLand(cat: Catalogus, k: Keuze, eigen: string, paginataal: string): Keuze {
  if (!landVan(cat, eigen)) return k;
  const rest = k.landen.filter((l) => l.code !== eigen);
  const eigenKeuze = k.landen.find((l) => l.code === eigen) ?? landStandaard(cat, eigen, true);
  const talen = [...new Set([...k.talen, ...standaardTalen(cat, eigen, paginataal)])];
  return pasVoorstelToe(cat, { ...k, eigen, landen: [eigenKeuze, ...rest], talen: cat.talen.filter((t) => talen.includes(t)) }, k.voorstel);
}

/** Een land toevoegen of weghalen; maakt van het voorstel 'kies'. Het eigen land blijft altijd. */
export function zetLand(cat: Catalogus, k: Keuze, code: string, aan: boolean): Keuze {
  if (code === k.eigen || !landVan(cat, code)) return k;
  const zonder = k.landen.filter((l) => l.code !== code);
  const landen = aan ? [...zonder, landStandaard(cat, code, false)] : zonder;
  // Houd de volgorde van de catalogus achter het eigen land.
  const volgorde = cat.landen.map((l) => l.code);
  landen.sort((a, b) => (a.code === k.eigen ? -1 : b.code === k.eigen ? 1 : volgorde.indexOf(a.code) - volgorde.indexOf(b.code)));
  return { ...k, voorstel: 'kies', landen };
}

/** Eén land aanpassen (detail, lagen, routes). */
export function wijzigLand(k: Keuze, code: string, wijziging: Partial<Omit<LandKeuze, 'code'>>): Keuze {
  return { ...k, landen: k.landen.map((l) => (l.code === code ? { ...l, ...wijziging } : l)) };
}

// ---------- Van keuze naar blokken ----------

/**
 * De blokken van één land volgens de keuze, zonder afhankelijkheden.
 * Overzicht: de landkaart tot zoom 9. Standaard: daarbovenop alle wegen en dorpen.
 * Straatniveau: het overzicht plus alle regiobestanden op straatniveau; die bevatten ook de
 * lagere zoomniveaus, dus de standaardkaart is dan overbodig.
 */
function blokkenVanLand(cat: Catalogus, l: LandKeuze): Blok[] {
  const eigen = cat.blokken.filter((b) => b.land === l.code);
  const niveaus: Niveau[] = l.detail === 'overzicht' ? ['overzicht'] : l.detail === 'standaard' ? ['overzicht', 'standaard'] : ['overzicht', 'straat'];
  const uit = eigen.filter((b) => (b.soort === 'basiskaart' || b.soort === 'straat') && niveaus.includes(b.niveau));
  if (l.lagen) uit.push(...eigen.filter((b) => b.soort === 'lagen'));
  if (l.routes) uit.push(...eigen.filter((b) => b.soort === 'routes'));
  return uit;
}

/** Alle blokken van een keuze, met hun afhankelijkheden, in de volgorde van de catalogus. */
export function blokkenVoor(cat: Catalogus, k: Keuze): Blok[] {
  const ids = new Set<string>();
  for (const l of k.landen) for (const b of blokkenVanLand(cat, l)) ids.add(b.id);
  for (const t of k.talen) ids.add(`inhoud-${t}`);
  if (k.europa) for (const b of cat.blokken) if (b.niveau === 'europa') ids.add(b.id);
  const perId = new Map(cat.blokken.map((b) => [b.id, b]));
  const stapel = [...ids];
  while (stapel.length) {
    for (const v of perId.get(stapel.pop()!)?.vereist ?? []) if (!ids.has(v)) { ids.add(v); stapel.push(v); }
  }
  return cat.blokken.filter((b) => ids.has(b.id));
}

/** Te downloaden bytes (wat in de app zelf zit, telt niet). */
export const downloadBytes = (blokken: Blok[]) => blokken.filter((b) => !b.kern).reduce((t, b) => t + b.bytes, 0);

/** Bytes per land voor de samenvatting; Europa en talen apart. */
export function bytesPerLand(cat: Catalogus, k: Keuze): Map<string, number> {
  const uit = new Map<string, number>();
  for (const l of k.landen) uit.set(l.code, downloadBytes(blokkenVanLand(cat, l)));
  return uit;
}

/** Wat een detailniveau voor een land zou kosten (voor de keuzerondjes). */
export function bytesVoorDetail(cat: Catalogus, l: LandKeuze, detail: Detail): number {
  return downloadBytes(blokkenVanLand(cat, { ...l, detail, lagen: false, routes: false }));
}

/** Grote landen (Frankrijk, Duitsland) op een hoog detailniveau: apart waarschuwen. */
export const GROOT_LAND = 1024 * 1024 * 1024;

/** Verschil met wat al op het toestel staat. */
export function plan(gewenst: Blok[], aanwezig: Set<string>, cat: Catalogus) {
  const ids = new Set(gewenst.map((b) => b.id));
  return {
    toevoegen: gewenst.filter((b) => !b.kern && !aanwezig.has(b.id)),
    behouden: gewenst.filter((b) => b.kern || aanwezig.has(b.id)),
    verwijderen: cat.blokken.filter((b) => !b.kern && aanwezig.has(b.id) && !ids.has(b.id)),
  };
}

// ---------- Ruimte en verbinding ----------

/** Boven deze grootte vragen we wifi te gebruiken. */
export const DREMPEL_GROOT = 500 * 1024 * 1024;
/** Na de download moet er minstens zoveel vrij blijven op het toestel. */
export const MARGE = 200 * 1024 * 1024;

export type Opslag = { quota?: number; usage?: number };
export type Verbinding = { mobiel?: boolean; spaarstand?: boolean };
export type Waarschuwing = 'groot' | 'mobiel' | 'krap' | 'te-weinig' | 'onbekend';

export function beoordeel(bytes: number, opslag: Opslag | null, verbinding: Verbinding = {}) {
  const vrij = opslag?.quota !== undefined ? Math.max(0, opslag.quota - (opslag.usage ?? 0)) : undefined;
  const w: Waarschuwing[] = [];
  if (vrij === undefined) w.push('onbekend');
  else if (bytes > vrij) w.push('te-weinig');
  else if (vrij - bytes < MARGE) w.push('krap');
  if (bytes > DREMPEL_GROOT) w.push('groot');
  if (bytes > 0 && (verbinding.mobiel || verbinding.spaarstand)) w.push('mobiel');
  return { vrij, past: !w.includes('te-weinig'), waarschuwingen: w };
}

/**
 * Opslag en verbinding in een browser. Een native schil geeft deze waarden zelf mee
 * (bv. de vrije ruimte van het toestel en het netwerktype van het besturingssysteem).
 */
export async function leesOpslag(): Promise<Opslag | null> {
  try {
    const s = await navigator.storage?.estimate?.();
    return s ? { quota: s.quota, usage: s.usage } : null;
  } catch {
    return null;
  }
}
export function leesVerbinding(): Verbinding {
  const c = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; saveData?: boolean } }).connection;
  return { mobiel: c?.type === 'cellular', spaarstand: !!c?.saveData };
}

// ---------- Keuze in een link (website → app) ----------
// In het #-deel van de link, zodat de keuze niet naar een server gaat:
// #eigen=be&voorstel=buren&land=be_standaard_lagen.routes&land=de_overzicht_lagen&talen=nl.fr

export function naarLink(k: Keuze): string {
  const p = new URLSearchParams();
  p.set('eigen', k.eigen);
  p.set('voorstel', k.voorstel);
  for (const l of k.landen) {
    const opties = [l.lagen && 'lagen', l.routes && 'routes'].filter(Boolean).join('.') || '-';
    p.append('land', [l.code, l.detail, opties].join('_'));
  }
  p.set('talen', k.talen.join('.'));
  if (k.europa) p.set('europa', '1');
  return p.toString();
}

/** Leest een keuze uit een link; ongeldige delen vallen weg. Null als er geen keuze in staat. */
export function uitLink(cat: Catalogus, hash: string): Keuze | null {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const eigen = p.get('eigen') ?? '';
  if (!landVan(cat, eigen)) return null;
  const voorstel = (VOORSTELLEN as string[]).includes(p.get('voorstel') ?? '') ? (p.get('voorstel') as Voorstel) : 'kies';
  const landen: LandKeuze[] = [];
  for (const ruw of p.getAll('land')) {
    const [code, detail, opties = ''] = ruw.split('_');
    if (!landVan(cat, code) || landen.some((l) => l.code === code)) continue;
    const o = opties.split('.');
    landen.push({
      code,
      detail: (DETAILS as string[]).includes(detail) ? (detail as Detail) : 'overzicht',
      lagen: o.includes('lagen'),
      routes: o.includes('routes') && heeftRoutes(cat, code),
    });
  }
  if (!landen.some((l) => l.code === eigen)) landen.unshift(landStandaard(cat, eigen, true));
  landen.sort((a, b) => (a.code === eigen ? -1 : b.code === eigen ? 1 : 0));
  const talen = (p.get('talen') ?? '').split('.').filter((t) => cat.talen.includes(t));
  return { eigen, voorstel, landen, talen: talen.length ? talen : standaardTalen(cat, eigen, 'nl'), europa: p.get('europa') === '1' };
}

/** Controleert een bewaarde keuze tegen de (mogelijk nieuwere) catalogus. */
export function geldigeKeuze(cat: Catalogus, k: unknown): Keuze | null {
  const x = k as Keuze;
  if (!x || typeof x.eigen !== 'string' || !Array.isArray(x.landen)) return null;
  return uitLink(cat, naarLink(x));
}

// ---------- Manifest voor het startprogramma (computer, USB) ----------

export type Manifest = {
  formaat: 'planb72-pakketten';
  versie: 1;
  gemaakt: string;
  bron: string;
  keuze: string;
  blokken: string[];
  bytes: number;
  bestanden: { pad: string; url: string; bytes: number; sha256: string | null }[];
};

/** De bestanden van een keuze, voor `planb72-start --pakketten <manifest>` of als lijst met links. */
export function maakManifest(cat: Catalogus, k: Keuze, bron = cat.bron, nu = new Date()): Manifest {
  const blokken = blokkenVoor(cat, k).filter((b) => !b.kern);
  const bestanden = blokken.flatMap((b) => b.bestanden).map((f) => ({
    pad: f.pad.replace(/^\//, ''),
    url: new URL(f.pad, bron).href,
    bytes: f.bytes,
    sha256: f.sha256,
  }));
  return {
    formaat: 'planb72-pakketten',
    versie: 1,
    gemaakt: nu.toISOString(),
    bron,
    keuze: naarLink(k),
    blokken: blokken.map((b) => b.id),
    bytes: bestanden.reduce((t, f) => t + f.bytes, 0),
    bestanden,
  };
}
