// Kaartpakketten voor offline gebruik.
import { locale } from '../i18n/klant';
// Grote PMTiles-bestanden gaan naar de toestelopslag van de browser (Origin Private
// File System). Waar die niet beschikbaar is, vallen we terug op de Cache API; de
// service worker beantwoordt dan de Range-aanvragen uit het bewaarde bestand.

export type Kaartpakket = {
  id: string;
  naam: string;
  omschrijving: string;
  groep: 'europa' | 'belgie' | 'regio';
  bbox: [number, number, number, number];
  maxzoom: number;
  zak: boolean;
  bytes: number;
  pad: string;
  build?: string;
};

const MAP = 'kaarten';
const CACHE = 'pb72-pakket-kaarten';

export async function overzicht(): Promise<Kaartpakket[]> {
  try {
    const r = await fetch('/data/kaarten.json');
    if (!r.ok) return [];
    return (await r.json()).pakketten as Kaartpakket[];
  } catch {
    return [];
  }
}

async function opfsMap(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const wortel = await navigator.storage.getDirectory();
    return await wortel.getDirectoryHandle(MAP, { create: true });
  } catch {
    return null;
  }
}

async function kanOpfsSchrijven() {
  const map = await opfsMap();
  if (!map) return false;
  try {
    const test = await map.getFileHandle('.test', { create: true });
    const ok = typeof (test as any).createWritable === 'function';
    await map.removeEntry('.test');
    return ok;
  } catch {
    return false;
  }
}

/** Welke pakketten staan op dit toestel, met het bestand als het in OPFS staat. */
export async function opToestel(): Promise<Map<string, File | 'cache'>> {
  const uit = new Map<string, File | 'cache'>();
  const map = await opfsMap();
  if (map) {
    for await (const [naam, handle] of (map as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
      if (handle.kind === 'file' && naam.endsWith('.pmtiles')) {
        const bestand = await (handle as FileSystemFileHandle).getFile();
        if (bestand.size > 0) uit.set(naam.replace('.pmtiles', ''), bestand);
      }
    }
  }
  try {
    const cache = await caches.open(CACHE);
    for (const req of await cache.keys()) {
      const id = new URL(req.url).pathname.split('/').pop()!.replace('.pmtiles', '');
      if (!uit.has(id)) uit.set(id, 'cache');
    }
  } catch {}
  return uit;
}

/** Download een pakket; het oude bestand blijft staan tot het nieuwe volledig binnen is. */
export async function download(p: Kaartpakket, voortgang: (fractie: number) => void, signaal?: AbortSignal) {
  const antwoord = await fetch(p.pad, { cache: 'no-store', signal: signaal });
  if (!antwoord.ok || !antwoord.body) throw new Error(`Download mislukt (${antwoord.status})`);
  const totaal = Number(antwoord.headers.get('Content-Length')) || p.bytes;
  let binnen = 0;
  const teller = new TransformStream<Uint8Array, Uint8Array>({
    transform(stuk, ctrl) {
      binnen += stuk.byteLength;
      voortgang(Math.min(1, binnen / totaal));
      ctrl.enqueue(stuk);
    },
  });
  const stroom = antwoord.body.pipeThrough(teller);

  if (await kanOpfsSchrijven()) {
    const map = (await opfsMap())!;
    const tijdelijk = await map.getFileHandle(`${p.id}.deel`, { create: true });
    const schrijver = await (tijdelijk as any).createWritable();
    await stroom.pipeTo(schrijver, { signal: signaal });
    // Klaar: hernoemen door te kopiëren naar de definitieve naam.
    const definitief = await map.getFileHandle(`${p.id}.pmtiles`, { create: true });
    const w2 = await (definitief as any).createWritable();
    await (await tijdelijk.getFile()).stream().pipeTo(w2);
    await map.removeEntry(`${p.id}.deel`);
  } else {
    const blob = await new Response(stroom).blob();
    const cache = await caches.open(CACHE);
    await cache.put(p.pad, new Response(blob, { headers: { 'Content-Type': 'application/octet-stream' } }));
  }
  voortgang(1);
}

export async function verwijder(id: string) {
  const map = await opfsMap();
  try { await map?.removeEntry(`${id}.pmtiles`); } catch {}
  try { await map?.removeEntry(`${id}.deel`); } catch {}
  try { await (await caches.open(CACHE)).delete(`/data/${id}.pmtiles`); } catch {}
}

export function mb(bytes: number) {
  if (bytes === 0) return '0 MB';
  return bytes >= 1e9
    ? `${(bytes / 1073741824).toLocaleString(locale(), { maximumFractionDigits: 1 })} GB`
    : `${Math.max(1, Math.round(bytes / 1048576)).toLocaleString(locale())} MB`;
}
