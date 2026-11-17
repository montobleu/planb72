// Gedeelde basiskaart voor alle kaartpagina's van de app.
// Stapelt de kaartpakketten van grof naar fijn (Europa, België, regio's). Op het toestel
// bewaarde pakketten gaan voor; met verbinding vullen we aan van de server.
// Dezelfde logica als in /app/kaart/; die pagina kan na het samenvoegen ook deze module gebruiken.

import * as maplibregl from 'maplibre-gl';
// De worker als eigen bestand meeleveren; MapLibre zoekt hem anders naast een bestand dat niet bestaat.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Protocol, PMTiles, FileSource } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { overzicht, opToestel, type Kaartpakket } from './kaarten';
import { getekendSchema, volgWijzigingen } from './kleurschema';

export type Basiskaart = {
  stijl: maplibregl.StyleSpecification;
  /** Pakketten die de kaart toont, van grof naar fijn. */
  zichtbaar: Kaartpakket[];
  /** Aantal pakketten op dit toestel. */
  lokaal: number;
  licht: boolean;
  /** Korte uitleg voor de gebruiker, of leeg. */
  melding: string;
};

const RANG = { europa: 0, belgie: 1, regio: 2 } as const;
let protocol: Protocol | null = null;

/** Bouw de stijl van de basiskaart. Roept u één keer per pagina op. */
export async function basiskaart(taal = 'nl'): Promise<Basiskaart> {
  maplibregl.setWorkerUrl(workerUrl);
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
  }
  const licht = getekendSchema() === 'light';
  const pakketten = await overzicht();
  const lokaal = await opToestel();
  const gekozen = pakketten
    .filter((p) => lokaal.has(p.id) || (navigator.onLine && (p.id === 'eu-z7' || p.id === 'be-z12')))
    .sort((a, b) => (RANG[a.groep] ?? 3) - (RANG[b.groep] ?? 3) || a.maxzoom - b.maxzoom);
  // Per groep het fijnste pakket op het toestel, plus een fijner online pakket erbovenop als er
  // verbinding is. Valt de verbinding weg, dan blijft de lokale kaart eronder zichtbaar.
  const fijnste = (lijst: Kaartpakket[]) => lijst.reduce<Kaartpakket | undefined>((a, b) => (!a || b.maxzoom > a.maxzoom ? b : a), undefined);
  const zichtbaar: Kaartpakket[] = [];
  for (const groep of ['europa', 'belgie'] as const) {
    const lok = fijnste(gekozen.filter((p) => p.groep === groep && lokaal.has(p.id)));
    const onl = fijnste(gekozen.filter((p) => p.groep === groep && !lokaal.has(p.id)));
    if (lok) zichtbaar.push(lok);
    if (onl && (!lok || onl.maxzoom > lok.maxzoom)) zichtbaar.push(onl);
  }
  zichtbaar.push(...gekozen.filter((p) => !(p.groep in { europa: 1, belgie: 1 })));

  const bronnen: Record<string, maplibregl.SourceSpecification> = {};
  const basislagen: maplibregl.LayerSpecification[] = [
    { id: 'achtergrond', type: 'background', paint: { 'background-color': licht ? '#e9ecef' : '#1b1f24' } },
  ];
  const smaak = namedFlavor(licht ? 'light' : 'dark');
  for (const p of zichtbaar) {
    const bestand = lokaal.get(p.id);
    let url = `pmtiles://${location.origin}${p.pad}`;
    if (bestand instanceof File) {
      protocol.add(new PMTiles(new FileSource(bestand)));
      url = `pmtiles://${bestand.name}`;
    }
    bronnen[p.id] = {
      type: 'vector',
      url,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>',
    };
    for (const laag of layers(p.id, smaak, { lang: taal })) {
      if (laag.type === 'background') continue;
      basislagen.push({ ...laag, id: `${p.id}-${laag.id}` } as maplibregl.LayerSpecification);
    }
  }
  const melding =
    zichtbaar.length === 0
      ? 'Geen kaart op dit toestel. Download een kaartpakket via Instellingen.'
      : !navigator.onLine
        ? `Offline: ${zichtbaar.map((p) => p.naam).join(', ')}.`
        : '';
  return {
    stijl: {
      version: 8,
      glyphs: `${location.origin}/kaart/fonts/{fontstack}/{range}.pbf`,
      sprite: `${location.origin}/kaart/sprites/${licht ? 'light' : 'dark'}`,
      sources: bronnen,
      layers: basislagen,
    },
    zichtbaar,
    lokaal: lokaal.size,
    licht,
    melding,
  };
}

/** Een andere kleurstijl vraagt een nieuwe kaart; herladen is eenvoudig en betrouwbaar. */
export function herlaadBijKleurwissel() {
  document.addEventListener('pb72-kleurschema', () => location.reload());
  volgWijzigingen();
}

/** Uitleg bij een kaartfout: een onbereikbaar online pakket is geen probleem als er een lokale kaart is. */
export function kaartfoutTekst(fout: unknown, lokaal: number) {
  const netwerk = /fetch|network|load/i.test(String((fout as Error)?.message ?? ''));
  if (!netwerk) return 'De kaart kon niet volledig geladen worden.';
  return lokaal
    ? 'Geen verbinding met de server: de kaart op dit toestel wordt gebruikt.'
    : 'Geen verbinding en geen kaart op dit toestel. Download een kaartpakket via Instellingen.';
}
