// Routepakketten (routenetwerk en zoekindex per regio) op het toestel.
// Zelfde werkwijze als de kaartpakketten: OPFS waar het kan, anders de Cache API.

import { bewaarBestand, opfsMap } from './kaarten';

export type Routepakket = {
  id: string;
  naam: string;
  omschrijving: string;
  groep: 'regio';
  bbox: [number, number, number, number];
  bytes: number;
  knopen: number;
  randen: number;
  zoek: number;
  pad: string;
  osm: string;
};

const MAP = 'routes';
const CACHE = 'pb72-pakket-routes';
const naam = (id: string) => `${id}.pb72r`;

export async function routeOverzicht(): Promise<Routepakket[]> {
  try {
    const r = await fetch('/data/routes.json');
    if (!r.ok) return [];
    return (await r.json()).pakketten as Routepakket[];
  } catch {
    return [];
  }
}

/** Routepakketten op dit toestel, met het bestand (OPFS of cache). */
export async function routesOpToestel(): Promise<Map<string, Blob>> {
  const uit = new Map<string, Blob>();
  const map = await opfsMap(MAP);
  if (map) {
    for await (const [n, handle] of (map as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
      if (handle.kind === 'file' && n.endsWith('.pb72r')) {
        const bestand = await (handle as FileSystemFileHandle).getFile();
        if (bestand.size > 0) uit.set(n.replace('.pb72r', ''), bestand);
      }
    }
  }
  try {
    const cache = await caches.open(CACHE);
    for (const req of await cache.keys()) {
      const id = new URL(req.url).pathname.split('/').pop()!.replace('.pb72r', '');
      if (!uit.has(id)) {
        const r = await cache.match(req);
        if (r) uit.set(id, await r.blob());
      }
    }
  } catch {}
  return uit;
}

export function downloadRoute(p: Routepakket, voortgang: (f: number) => void, signaal?: AbortSignal) {
  return bewaarBestand(MAP, naam(p.id), p.pad, p.bytes, CACHE, voortgang, signaal);
}

export async function verwijderRoute(p: Pick<Routepakket, 'id' | 'pad'>) {
  const map = await opfsMap(MAP);
  try { await map?.removeEntry(naam(p.id)); } catch {}
  try { await map?.removeEntry(`${p.id}.deel`); } catch {}
  try { await (await caches.open(CACHE)).delete(p.pad); } catch {}
}
