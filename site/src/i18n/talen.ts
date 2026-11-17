// Talen van PlanB72. Nederlands is de brontaal; de andere vertalingen zijn een
// eerste versie en wachten op twee nalezers per taal (zie docs/nazicht.md).

export const TALEN = ['nl', 'fr', 'de', 'en'] as const;
export type Taal = (typeof TALEN)[number];
export const BRONTAAL: Taal = 'nl';

export const TAALNAMEN: Record<Taal, string> = { nl: 'Nederlands', fr: 'Français', de: 'Deutsch', en: 'English' };

/** Status van de vertaling per taal: 'bron' of 'na te lezen'. */
export const VERTAALSTATUS: Record<Taal, 'bron' | 'na te lezen'> = { nl: 'bron', fr: 'na te lezen', de: 'na te lezen', en: 'na te lezen' };

/** Pad in een andere taal: '/over/' -> '/fr/over/'. */
export function pad(taal: Taal, p: string) {
  const zonder = p.replace(/^\/(fr|de|en)(?=\/)/, '');
  return taal === BRONTAAL ? zonder : `/${taal}${zonder}`;
}

export function taalUitPad(p: string): Taal {
  const m = /^\/(fr|de|en)\//.exec(p);
  return (m?.[1] as Taal) ?? 'nl';
}

/** Opmaak van getallen en datums per taal. */
export const LOCALE: Record<Taal, string> = { nl: 'nl-BE', fr: 'fr-BE', de: 'de-BE', en: 'en-GB' };

export function isTaal(x: unknown): x is Taal {
  return typeof x === 'string' && (TALEN as readonly string[]).includes(x);
}

/** getStaticPaths voor de app: /app/ (nl), /fr/app/, /de/app/, /en/app/. */
export function taalPaden() {
  return TALEN.map((taal) => ({ params: { taal: taal === BRONTAAL ? undefined : taal }, props: { taal } }));
}

/** De taal van een app-pagina uit de routeparameter. */
export function taalVan(params: Record<string, string | undefined>): Taal {
  return isTaal(params.taal) ? params.taal : BRONTAAL;
}
