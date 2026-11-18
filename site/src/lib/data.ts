// Eén plek waar de site de gedeelde data van de repository inleest.
// Elk bestand in data/landen/ is een land; de app toont de landen die de gebruiker kiest
// (zie lib/landkeuze.ts). Vertalingen van de landinfo staan in i18n/land/<land>.json.
import type { Taal } from '../i18n/talen';
import { register } from './register';

export type Noodnummer = { nummer: string; wat: string; dringend: boolean; bron: string };
export type Kanaal = { naam: string; soort: string; wat: string; voorbereiden: string; url: string | null; bron: string };
export type Site = {
  id: string; naam: string; soort: string; land: string; lat: number; lon: number;
  schuilen_km: number | null; jodium_km: number | null; evacuatie_km: number | null; uitbreidingszone_km?: number | null;
};
export type Land = {
  code: string;
  naam: { nl: string; fr: string; de: string; en: string };
  talen: string[];
  bbox: [number, number, number, number];
  centrum: [number, number];
  bijgewerkt: string;
  status: string;
  noodnummers: Noodnummer[];
  kanalen: Kanaal[];
  nucleair: {
    kernboodschap: string; bron: string; uitbreidingszone_km: number | null; opmerking: string;
    coordinaten_status: string; sites: Site[]; zones_bron: string; jodium_bron?: string;
  };
  schuilen: { officieel_netwerk: boolean | null; advies: string; bron: string; netwerk_bron?: string };
  voorraad: { water_liter_pp_per_dag: number | null; water_bron: string; water_status: string; advies_uren: number | null; advies_bron: string };
};

const bestanden = import.meta.glob('../../../data/landen/*.json', { eager: true, import: 'default' });
const vertaalbestanden = import.meta.glob('../i18n/land/*.json', { eager: true, import: 'default' });
// Volgorde in de app: België eerst (het eerste land), dan de buren.
const VOLGORDE = ['BE', 'NL', 'LU', 'FR', 'DE'];
const rang = (c: string) => VOLGORDE.indexOf(c) + 1 || 99;

/** Alle landen, in vaste volgorde. */
export const landen: Land[] = (Object.values(bestanden) as Land[]).sort(
  (a, b) => rang(a.code) - rang(b.code) || a.code.localeCompare(b.code)
);
/** Landcodes in kleine letters (be, nl, ...). */
export const landcodes = landen.map((l) => l.code.toLowerCase());
/** Het land dat geldt zolang de gebruiker niets kiest. */
export const STANDAARD_LAND = 'be';
export const land: Land = landen.find((l) => l.code.toLowerCase() === STANDAARD_LAND) ?? landen[0];

export const APP_VERSIE = '0.2.0';
export const BOUWDATUM = new Date().toISOString().slice(0, 10);

type Vertaling = {
  noodnummers?: Record<string, string>;
  kanalen?: Record<string, Partial<Pick<Kanaal, 'naam' | 'soort' | 'wat' | 'voorbereiden' | 'url' | 'bron'>>>;
  nucleair?: { kernboodschap?: string; bron?: string; opmerking?: string; coordinaten_status?: string; soorten?: Record<string, string> };
  schuilen?: { advies?: string; bron?: string };
  voorraad?: { water_bron?: string; water_status?: string };
};

/** Tekst met de taal waarin hij werkelijk staat (bij ontbrekende vertaling: Nederlands). */
export type Tekst = { tekst: string; lang: Taal };

function vertalingVan(code: string, taal: Taal): Vertaling {
  if (taal === 'nl') return {};
  const bestand = Object.entries(vertaalbestanden).find(([p]) => p.endsWith(`/${code}.json`))?.[1] as Record<string, unknown> | undefined;
  return (bestand?.[taal] ?? {}) as Vertaling;
}

/**
 * Landinfo van één land in een taal. Wat niet vertaald is, blijft Nederlands; `lang` zegt dan
 * welke taal de tekst heeft, zodat de pagina het lang-attribuut kan zetten.
 */
export function landVoor(taal: Taal, code = STANDAARD_LAND) {
  const l = landen.find((x) => x.code.toLowerCase() === code) ?? land;
  const v = vertalingVan(l.code.toLowerCase(), taal);
  const t = (vertaald: string | undefined, origineel: string): Tekst =>
    vertaald ? { tekst: vertaald, lang: taal } : { tekst: origineel, lang: 'nl' };
  return {
    code: l.code.toLowerCase(),
    naam: l.naam[taal],
    bijgewerkt: l.bijgewerkt,
    bbox: l.bbox,
    centrum: l.centrum,
    noodnummers: l.noodnummers.map((n) => ({ ...n, wat: t(v.noodnummers?.[n.nummer], n.wat) })),
    kanalen: l.kanalen.map((k) => {
      const kv = v.kanalen?.[k.naam] ?? {};
      return {
        naam: kv.naam ?? k.naam,
        soort: t(kv.soort, k.soort),
        wat: t(kv.wat, k.wat),
        voorbereiden: t(kv.voorbereiden, k.voorbereiden),
        url: kv.url ?? k.url,
        bron: kv.bron ?? k.bron,
        /** Werkt zonder stroomnet en internet (radio op batterijen): komt bovenaan. */
        radio: k.soort === 'radio en tv',
      };
    }),
    nucleair: {
      ...l.nucleair,
      kernboodschap: t(v.nucleair?.kernboodschap, l.nucleair.kernboodschap),
      bron: v.nucleair?.bron ?? l.nucleair.bron,
      opmerking: t(v.nucleair?.opmerking, l.nucleair.opmerking),
      coordinaten_status: t(v.nucleair?.coordinaten_status, l.nucleair.coordinaten_status),
      sites: l.nucleair.sites.map((s) => ({ ...s, kerncentrale: s.soort === 'Kerncentrale', soort: v.nucleair?.soorten?.[s.soort] ?? s.soort })),
    },
    schuilen: { ...l.schuilen, advies: t(v.schuilen?.advies, l.schuilen.advies), bron: v.schuilen?.bron ?? l.schuilen.bron },
    voorraad: { ...l.voorraad, water_bron: t(v.voorraad?.water_bron, l.voorraad.water_bron), water_status: t(v.voorraad?.water_status, l.voorraad.water_status) },
  };
}

/** Alle landen in een taal, in vaste volgorde. */
export function landenVoor(taal: Taal) {
  return landcodes.map((c) => landVoor(taal, c));
}

/** Korte naam van een bron: de eigenaar uit het bronnenregister, anders de domeinnaam. */
export function bronNaam(url: string | null | undefined): string {
  if (!url) return '';
  const r = register.find((b) => b.url === url);
  if (r) return r.eigenaar ?? r.naam;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export const isUrl = (s: string | null | undefined) => !!s && /^https?:\/\//.test(s);
