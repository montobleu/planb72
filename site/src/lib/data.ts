// Eén plek waar de site de gedeelde data van de repository inleest.
import be from '../../../data/landen/be.json';

export const land = be;
export type Land = typeof be;

export const APP_VERSIE = '0.1.0';
export const BOUWDATUM = new Date().toISOString().slice(0, 10);
