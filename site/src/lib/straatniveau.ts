// Straatniveau met verbinding: laadt de regiopakketten die in beeld komen.
// De gewone straatnamen staan alleen in de regiopakketten (zoomniveau 14 of 15) en worden vanaf
// zoomniveau 15 getoond. Staat een regio niet op het toestel, dan halen we ze online op zodra je
// inzoomt (vanaf zoomniveau 12), zodat straten en straatnamen altijd verschijnen.
// Zonder verbinding gelden alleen de gedownloade regio's.

import type * as maplibregl from 'maplibre-gl';
import { layers, namedFlavor } from '@protomaps/basemaps';
import type { Kaartpakket } from './kaarten';

const VANAF_ZOOM = 12;
const MAX_ONLINE = 4;

type Opties = {
  pakketten: Kaartpakket[];
  /** Id's van pakketten die al in de stijl zitten (lokaal of online). */
  aanwezig: Set<string>;
  licht: boolean;
  taal: string;
};

const snijdt = (a: [number, number, number, number], b: maplibregl.LngLatBounds) =>
  a[0] <= b.getEast() && a[2] >= b.getWest() && a[1] <= b.getNorth() && a[3] >= b.getSouth();

export function volgStraatniveau(kaart: maplibregl.Map, { pakketten, aanwezig, licht, taal }: Opties) {
  const regios = pakketten.filter((p) => p.groep === 'regio');
  const online: string[] = []; // volgorde van toevoegen, oudste eerst
  const smaak = namedFlavor(licht ? 'light' : 'dark');

  // Nieuwe basislagen komen onder de eigen lagen (punten, zones, route), boven de basiskaart.
  const eersteEigenLaag = () => {
    const stijl = kaart.getStyle();
    const bronnen = stijl.sources ?? {};
    return stijl.layers?.find((l) => 'source' in l && l.source && (bronnen as Record<string, maplibregl.SourceSpecification>)[l.source as string]?.type !== 'vector')?.id;
  };

  function voegToe(p: Kaartpakket) {
    kaart.addSource(p.id, {
      type: 'vector',
      url: `pmtiles://${location.origin}${p.pad}`,
      bounds: p.bbox,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>',
    });
    const voor = eersteEigenLaag();
    for (const laag of layers(p.id, smaak, { lang: taal })) {
      if (laag.type === 'background') continue;
      kaart.addLayer({ ...laag, id: `${p.id}-${laag.id}` } as maplibregl.LayerSpecification, voor);
    }
    online.push(p.id);
    aanwezig.add(p.id);
  }

  function verwijder(id: string) {
    for (const l of kaart.getStyle().layers ?? []) if (l.id.startsWith(`${id}-`)) kaart.removeLayer(l.id);
    if (kaart.getSource(id)) kaart.removeSource(id);
    online.splice(online.indexOf(id), 1);
    aanwezig.delete(id);
  }

  function bijwerken() {
    if (!navigator.onLine || kaart.getZoom() < VANAF_ZOOM) return;
    const beeld = kaart.getBounds();
    const nodig = regios.filter((p) => snijdt(p.bbox, beeld) && !aanwezig.has(p.id));
    for (const p of nodig) {
      // Hou het aantal online regio's beperkt; ruim de oudste op die niet meer in beeld is.
      while (online.length >= MAX_ONLINE) {
        const weg = online.find((id) => !snijdt(regios.find((r) => r.id === id)!.bbox, beeld)) ?? online[0];
        verwijder(weg);
      }
      voegToe(p);
    }
  }

  kaart.on('moveend', bijwerken);
  if (kaart.loaded()) bijwerken();
  else kaart.once('load', bijwerken);
}
