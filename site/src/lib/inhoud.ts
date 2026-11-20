// Inhoud (scenario's, gidsen, eerste hulp) in een taal, met de Nederlandse tekst als bron.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Taal } from '../i18n/talen';

export type Soort = 'scenarios' | 'gidsen' | 'eerstehulp';
type Origineel = CollectionEntry<Soort>;
type Vertaling = CollectionEntry<'scenariosVertaald' | 'gidsenVertaald' | 'eerstehulpVertaald'>;

const VERTAALD = { scenarios: 'scenariosVertaald', gidsen: 'gidsenVertaald', eerstehulp: 'eerstehulpVertaald' } as const;

export type Item = {
  id: string;
  soort: Soort;
  origineel: Origineel;
  vertaling?: Vertaling;
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
        titel: v?.data.titel ?? o.data.titel,
        kort: v?.data.kort ?? o.data.kort,
        titelLang: v ? taal : 'nl',
      } satisfies Item;
    })
    .sort((a, b) => a.origineel.data.volgorde - b.origineel.data.volgorde);
}
