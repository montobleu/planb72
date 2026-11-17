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
