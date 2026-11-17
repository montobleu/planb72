// De kaartlagen die de app kent. De data komt van de pijplijn (pipeline/lagen.py).
import type { Taal } from '../i18n/talen';

export type Groep = 'medisch' | 'hulpdiensten' | 'water' | 'schuilen';
export type Laag = { id: string; naam: Record<Taal, string>; kleur: string; groep: Groep; standaard?: boolean };

export const LAGEN: Laag[] = [
  { id: 'ziekenhuizen', naam: { nl: 'Ziekenhuizen', fr: 'Hôpitaux', de: 'Krankenhäuser', en: 'Hospitals' }, kleur: '#ff5a5a', groep: 'medisch', standaard: true },
  { id: 'medisch', naam: { nl: 'Medische posten', fr: 'Postes médicaux', de: 'Medizinische Stellen', en: 'Medical posts' }, kleur: '#ff9d9d', groep: 'medisch' },
  { id: 'apotheken', naam: { nl: 'Apotheken', fr: 'Pharmacies', de: 'Apotheken', en: 'Pharmacies' }, kleur: '#5ccf8a', groep: 'medisch' },
  { id: 'aed', naam: { nl: 'AED-toestellen', fr: 'Défibrillateurs (DEA)', de: 'AED-Geräte', en: 'AEDs' }, kleur: '#ffd84d', groep: 'medisch' },
  { id: 'dierenarts', naam: { nl: 'Dierenartsen', fr: 'Vétérinaires', de: 'Tierärzte', en: 'Vets' }, kleur: '#c39bff', groep: 'medisch' },
  { id: 'politie', naam: { nl: 'Politie', fr: 'Police', de: 'Polizei', en: 'Police' }, kleur: '#6cb6ff', groep: 'hulpdiensten', standaard: true },
  { id: 'brandweer', naam: { nl: 'Brandweer', fr: 'Pompiers', de: 'Feuerwehr', en: 'Fire service' }, kleur: '#ff8a3d', groep: 'hulpdiensten', standaard: true },
  { id: 'overheid', naam: { nl: 'Gemeentehuizen', fr: 'Maisons communales', de: 'Gemeindehäuser', en: 'Town halls' }, kleur: '#b8c4ce', groep: 'hulpdiensten' },
  { id: 'drinkwater', naam: { nl: 'Drinkwater', fr: 'Eau potable', de: 'Trinkwasser', en: 'Drinking water' }, kleur: '#38d6e0', groep: 'water' },
  { id: 'schuilplekken', naam: { nl: 'Mogelijke schuilplekken', fr: 'Abris possibles', de: 'Mögliche Schutzorte', en: 'Possible shelters' }, kleur: '#e6e6e6', groep: 'schuilen' },
];

export const SCHUIL_LABEL: Record<Taal, string> = {
  nl: 'Mogelijke schuilplek. Niet officieel aangewezen. Toegang en toestand onbekend.',
  fr: 'Abri possible. Non désigné officiellement. Accès et état inconnus.',
  de: 'Möglicher Schutzort. Nicht offiziell ausgewiesen. Zugang und Zustand unbekannt.',
  en: 'Possible shelter. Not officially designated. Access and condition unknown.',
};
