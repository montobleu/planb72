// De kaartlagen die de app kent. De data komt van de pijplijn (pipeline/lagen.py).

export type Laag = { id: string; naam: string; kleur: string; groep: string; standaard?: boolean };

export const LAGEN: Laag[] = [
  { id: 'ziekenhuizen', naam: 'Ziekenhuizen', kleur: '#ff5a5a', groep: 'Medisch', standaard: true },
  { id: 'medisch', naam: 'Medische posten', kleur: '#ff9d9d', groep: 'Medisch' },
  { id: 'apotheken', naam: 'Apotheken', kleur: '#5ccf8a', groep: 'Medisch' },
  { id: 'aed', naam: 'AED-toestellen', kleur: '#ffd84d', groep: 'Medisch' },
  { id: 'dierenarts', naam: 'Dierenartsen', kleur: '#c39bff', groep: 'Medisch' },
  { id: 'politie', naam: 'Politie', kleur: '#6cb6ff', groep: 'Hulpdiensten', standaard: true },
  { id: 'brandweer', naam: 'Brandweer', kleur: '#ff8a3d', groep: 'Hulpdiensten', standaard: true },
  { id: 'overheid', naam: 'Gemeentehuizen', kleur: '#b8c4ce', groep: 'Hulpdiensten' },
  { id: 'drinkwater', naam: 'Drinkwater', kleur: '#38d6e0', groep: 'Water' },
  { id: 'schuilplekken', naam: 'Mogelijke schuilplekken', kleur: '#e6e6e6', groep: 'Schuilen' },
];

export const SCHUIL_LABEL = 'Mogelijke schuilplek. Niet officieel aangewezen. Toegang en toestand onbekend.';
