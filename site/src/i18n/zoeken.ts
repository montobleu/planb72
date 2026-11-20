// Teksten van de zoekfunctie (zoekknop in de kop, zoekvenster en de zoekpagina van de app).
// Apart gehouden: dit bestand komt mee in de JavaScript van elke pagina en blijft klein.
import { isTaal, type Taal } from './talen';

/** Het soort pagina, zoals het in de index staat (data-pagefind-meta="soort:..."). */
export type Soort = 'situatie' | 'gids' | 'eerstehulp' | 'hulpmiddel' | 'app' | 'website';

/** Het soort van een app-pagina uit het pad zonder taal, bv. '/app/gids/water/'. */
export function soortVanPad(pad: string): Soort {
  if (/^\/app\/wat-nu\/[^/]+\//.test(pad)) return 'situatie';
  if (/^\/app\/gids\/[^/]+\//.test(pad)) return 'gids';
  if (/^\/app\/eerste-hulp\/[^/]+\//.test(pad)) return 'eerstehulp';
  if (/^\/app\/(voorraad|checklists|noodplan|signalen|kompas|notities)\//.test(pad)) return 'hulpmiddel';
  return 'app';
}

const nl = {
  knop: 'Zoeken',
  titel: 'Zoeken in PlanB72',
  uitleg: 'Zoekt in de app en op de website, ook offline in de app.',
  label: 'Zoekterm',
  voorbeeld: 'bijvoorbeeld: water, storm, 1722',
  sluiten: 'Zoekvenster sluiten',
  resultaten: 'Resultaten',
  meer: 'Meer resultaten',
  hint: 'Typ minstens twee tekens.',
  bezig: 'Zoeken…',
  niets: (t: string) => `Niets gevonden voor „${t}”.`,
  aantal: (n: number, t: string) => `${n} ${n === 1 ? 'resultaat' : 'resultaten'} voor „${t}”.`,
  getoond: (n: number) => `De eerste ${n} staan hieronder.`,
  nietBeschikbaar: 'Zoeken is niet beschikbaar in deze versie.',
  alleenOnline: 'alleen online',
  soort: { situatie: 'Situatie', gids: 'Gids', eerstehulp: 'Eerste hulp', hulpmiddel: 'Hulpmiddel', app: 'App', website: 'Website' } as Record<Soort, string>,
};
export type Zoektekst = typeof nl;

const fr: Zoektekst = {
  knop: 'Rechercher',
  titel: 'Rechercher dans PlanB72',
  uitleg: "Cherche dans l'application et sur le site, aussi hors ligne dans l'application.",
  label: 'Terme de recherche',
  voorbeeld: 'par exemple : eau, tempête, 1722',
  sluiten: 'Fermer la recherche',
  resultaten: 'Résultats',
  meer: 'Plus de résultats',
  hint: 'Saisissez au moins deux caractères.',
  bezig: 'Recherche…',
  niets: (t) => `Aucun résultat pour « ${t} ».`,
  aantal: (n, t) => `${n} résultat${n === 1 ? '' : 's'} pour « ${t} ».`,
  getoond: (n) => `Les ${n} premiers sont affichés ci-dessous.`,
  nietBeschikbaar: "La recherche n'est pas disponible dans cette version.",
  alleenOnline: 'en ligne uniquement',
  soort: { situatie: 'Situation', gids: 'Guide', eerstehulp: 'Premiers secours', hulpmiddel: 'Outil', app: 'Application', website: 'Site web' },
};

const de: Zoektekst = {
  knop: 'Suchen',
  titel: 'In PlanB72 suchen',
  uitleg: 'Sucht in der App und auf der Website, in der App auch offline.',
  label: 'Suchbegriff',
  voorbeeld: 'zum Beispiel: Wasser, Sturm, 1722',
  sluiten: 'Suche schließen',
  resultaten: 'Ergebnisse',
  meer: 'Weitere Ergebnisse',
  hint: 'Geben Sie mindestens zwei Zeichen ein.',
  bezig: 'Suche läuft…',
  niets: (t) => `Nichts gefunden für „${t}“.`,
  aantal: (n, t) => `${n} ${n === 1 ? 'Ergebnis' : 'Ergebnisse'} für „${t}“.`,
  getoond: (n) => `Die ersten ${n} stehen unten.`,
  nietBeschikbaar: 'Die Suche ist in dieser Version nicht verfügbar.',
  alleenOnline: 'nur online',
  soort: { situatie: 'Situation', gids: 'Leitfaden', eerstehulp: 'Erste Hilfe', hulpmiddel: 'Hilfsmittel', app: 'App', website: 'Website' },
};

const en: Zoektekst = {
  knop: 'Search',
  titel: 'Search PlanB72',
  uitleg: 'Searches the app and the website, also offline in the app.',
  label: 'Search term',
  voorbeeld: 'for example: water, storm, 1722',
  sluiten: 'Close search',
  resultaten: 'Results',
  meer: 'More results',
  hint: 'Type at least two characters.',
  bezig: 'Searching…',
  niets: (t) => `Nothing found for “${t}”.`,
  aantal: (n, t) => `${n} ${n === 1 ? 'result' : 'results'} for “${t}”.`,
  getoond: (n) => `The first ${n} are shown below.`,
  nietBeschikbaar: 'Search is not available in this version.',
  alleenOnline: 'online only',
  soort: { situatie: 'Situation', gids: 'Guide', eerstehulp: 'First aid', hulpmiddel: 'Tool', app: 'App', website: 'Website' },
};

export const ZOEKEN: Record<Taal, Zoektekst> = { nl, fr, de, en };

/** Teksten in de taal van de pagina (volgt <html lang>). */
export function zoektekst(): Zoektekst {
  const l = document.documentElement.lang;
  return ZOEKEN[isTaal(l) ? l : 'nl'];
}
