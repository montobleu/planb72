// Eén plek waar de site de gedeelde data van de repository inleest.
import be from '../../../data/landen/be.json';
import beVertaald from '../i18n/land/be.json';
import type { Taal } from '../i18n/talen';

export const land = be;
export type Land = typeof be;

export const APP_VERSIE = '0.1.0';
export const BOUWDATUM = new Date().toISOString().slice(0, 10);

type Kanaal = Land['kanalen'][number];
type Vertaling = {
  noodnummers?: Record<string, string>;
  kanalen?: Record<string, Partial<Pick<Kanaal, 'naam' | 'soort' | 'wat' | 'voorbereiden' | 'url' | 'bron'>>>;
  nucleair?: { kernboodschap?: string; bron?: string; opmerking?: string; coordinaten_status?: string; soorten?: Record<string, string> };
  schuilen?: { advies?: string; bron?: string };
  voorraad?: { water_bron?: string; water_status?: string };
};

/** Tekst met de taal waarin hij werkelijk staat (bij ontbrekende vertaling: Nederlands). */
export type Tekst = { tekst: string; lang: Taal };

/**
 * Landinfo in een taal. Wat niet vertaald is, blijft Nederlands; `lang` zegt dan
 * welke taal de tekst heeft, zodat de pagina het lang-attribuut kan zetten.
 */
export function landVoor(taal: Taal) {
  const v = (taal === 'nl' ? {} : ((beVertaald as Record<string, unknown>)[taal] ?? {})) as Vertaling;
  const t = (vertaald: string | undefined, origineel: string): Tekst =>
    vertaald ? { tekst: vertaald, lang: taal } : { tekst: origineel, lang: 'nl' };
  return {
    naam: be.naam[taal],
    bijgewerkt: be.bijgewerkt,
    noodnummers: be.noodnummers.map((n) => ({ ...n, wat: t(v.noodnummers?.[n.nummer], n.wat) })),
    kanalen: be.kanalen.map((k) => {
      const kv = v.kanalen?.[k.naam] ?? {};
      return {
        naam: kv.naam ?? k.naam,
        soort: t(kv.soort, k.soort),
        wat: t(kv.wat, k.wat),
        voorbereiden: t(kv.voorbereiden, k.voorbereiden),
        url: kv.url ?? k.url,
        bron: kv.bron ?? k.bron,
      };
    }),
    nucleair: {
      ...be.nucleair,
      kernboodschap: t(v.nucleair?.kernboodschap, be.nucleair.kernboodschap),
      bron: v.nucleair?.bron ?? be.nucleair.bron,
      opmerking: t(v.nucleair?.opmerking, be.nucleair.opmerking),
      coordinaten_status: t(v.nucleair?.coordinaten_status, be.nucleair.coordinaten_status),
      sites: be.nucleair.sites.map((s) => ({ ...s, kerncentrale: s.soort === 'Kerncentrale', soort: v.nucleair?.soorten?.[s.soort] ?? s.soort })),
    },
    schuilen: { ...be.schuilen, advies: t(v.schuilen?.advies, be.schuilen.advies), bron: v.schuilen?.bron ?? be.schuilen.bron },
    voorraad: { ...be.voorraad, water_bron: t(v.voorraad?.water_bron, be.voorraad.water_bron), water_status: t(v.voorraad?.water_status, be.voorraad.water_status) },
  };
}
