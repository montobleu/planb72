// Bronnenregister en status van de nachtelijke ronde, als ze bestaan.
const registerBestanden = import.meta.glob('../../../data/bronnen/register.json', { eager: true, import: 'default' });
const statusBestanden = import.meta.glob('../../../data/bronnen/status.json', { eager: true, import: 'default' });

export type Bron = {
  id: string; naam: string; eigenaar?: string; url: string; soort?: string; land?: string;
  licentie?: string; toestemming?: string; route?: string; frequentie?: string; gebruikt_in?: string[]; opmerking?: string;
};
export type BronStatus = {
  laatst_gecontroleerd?: string; laatst_gewijzigd?: string; http_status?: number; bereikbaar?: boolean; dagen_onbereikbaar?: number; licentie_gewijzigd?: boolean;
};

const ruw = Object.values(registerBestanden)[0] as unknown;
export const register: Bron[] = Array.isArray(ruw) ? (ruw as Bron[]) : ((ruw as { bronnen?: Bron[] })?.bronnen ?? []);

const ruweStatus = Object.values(statusBestanden)[0] as any;
export const status: Record<string, BronStatus> = ruweStatus?.bronnen ?? ruweStatus ?? {};
