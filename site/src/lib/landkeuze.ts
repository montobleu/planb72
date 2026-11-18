// Welke landen de gebruiker op dit toestel gekozen heeft. Alles blijft op het toestel.
// De lijst van bestaande landen staat in <html data-alle-landen>, gezet door de layout;
// zo hoeft dit script de landdata zelf niet mee te laden.
import { lees, bewaar } from './app';

const SLEUTEL = 'landen';

export function alleLanden(): string[] {
  return (document.documentElement.dataset.alleLanden ?? 'be').split(' ').filter(Boolean);
}

/** Gekozen landen in volgorde van keuze; het eerste is het hoofdland (voorraad, start). */
export function gekozenLanden(): string[] {
  const alle = alleLanden();
  const keuze = lees<string[] | null>(SLEUTEL, null)?.filter((c) => alle.includes(c));
  return keuze?.length ? keuze : [document.documentElement.dataset.standaardLand ?? alle[0]];
}

export function hoofdland(): string {
  return gekozenLanden()[0];
}

/** Bewaar de keuze en pas de pagina meteen aan. */
export function kiesLanden(codes: string[]) {
  const alle = alleLanden();
  const geldig = codes.filter((c, i) => alle.includes(c) && codes.indexOf(c) === i);
  if (!geldig.length) return;
  bewaar(SLEUTEL, geldig);
  document.documentElement.dataset.landen = geldig.join(' ');
  document.dispatchEvent(new CustomEvent('pb72-landen', { detail: geldig }));
}
