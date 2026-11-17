// Inhoud (scenario's, gidsen, eerste hulp) in een taal, met de Nederlandse tekst als bron.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Taal } from '../i18n/talen';

export type Soort = 'scenarios' | 'gidsen' | 'eerstehulp';
type Origineel = CollectionEntry<Soort>;
type Vertaling = CollectionEntry<'scenariosVertaald' | 'gidsenVertaald' | 'eerstehulpVertaald'>;

const VERTAALD = { scenarios: 'scenariosVertaald', gidsen: 'gidsenVertaald', eerstehulp: 'eerstehulpVertaald' } as const;

/**
 * Medische, nucleaire en chemische instructies worden niet stilzwijgend vertaald: in fr, de
 * en en toont de app eerst de Nederlandse tekst en de officiële bron, en de vertaling pas na
 * een extra waarschuwing. Uitbreiden kan per tekst met `gevoelig: true` in de frontmatter.
 */
const GEVOELIG_SCENARIOS = new Set(['nucleair', 'chemisch', 'co', 'drinkwater', 'pandemie']);
const GEVOELIG_MODULES = new Set(['nucleair', 'gezondheid']);
const GEVOELIG_GIDSEN = new Set(['water', 'jodium']);

export function isGevoelig(soort: Soort, o: Origineel): boolean {
  if (o.data.gevoelig !== undefined) return o.data.gevoelig;
  if (soort === 'eerstehulp') return true;
  if (soort === 'scenarios') return GEVOELIG_SCENARIOS.has(o.id);
  const module = (o.data as { module?: string }).module ?? '';
  return GEVOELIG_MODULES.has(module) || GEVOELIG_GIDSEN.has(o.id);
}

export type Item = {
  id: string;
  soort: Soort;
  origineel: Origineel;
  vertaling?: Vertaling;
  gevoelig: boolean;
  /** Titel en korte omschrijving voor lijsten, in de taal van de pagina als die bestaat. */
  titel: string;
  kort: string;
  titelLang: Taal;
};

export async function inhoud(soort: Soort, taal: Taal): Promise<Item[]> {
  const originelen = (await getCollection(soort)) as Origineel[];
  const vertalingen = taal === 'nl' ? [] : ((await getCollection(VERTAALD[soort])) as Vertaling[]);
  return originelen
    .map((o) => {
      const v = vertalingen.find((x) => x.id === `${taal}/${o.id}`);
      return {
        id: o.id,
        soort,
        origineel: o,
        vertaling: v,
        gevoelig: isGevoelig(soort, o),
        titel: v?.data.titel ?? o.data.titel,
        kort: v?.data.kort ?? o.data.kort,
        titelLang: v ? taal : 'nl',
      } satisfies Item;
    })
    .sort((a, b) => a.origineel.data.volgorde - b.origineel.data.volgorde);
}
