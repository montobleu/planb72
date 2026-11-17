// Kaartpakketten voor offline gebruik.
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

export async function opfsMap(mapnaam = MAP): Promise<FileSystemDirectoryHandle | null> {
  try {
    const wortel = await navigator.storage.getDirectory();
    return await wortel.getDirectoryHandle(mapnaam, { create: true });
  } catch {
    return null;
  }
}

async function kanOpfsSchrijven(mapnaam = MAP) {
  const map = await opfsMap(mapnaam);
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
  await bewaarBestand(MAP, `${p.id}.pmtiles`, p.pad, p.bytes, CACHE, voortgang, signaal);
}

/**
 * Een groot bestand naar de toestelopslag downloaden (OPFS, anders de Cache API onder `url`).
 * Ook gebruikt voor de routepakketten (lib/routepakketten.ts).
 */
export async function bewaarBestand(
  mapnaam: string, naam: string, url: string, bytes: number, cachenaam: string,
  voortgang: (fractie: number) => void, signaal?: AbortSignal,
) {
  const antwoord = await fetch(url, { cache: 'no-store', signal: signaal });
  if (!antwoord.ok || !antwoord.body) throw new Error(`Download mislukt (${antwoord.status})`);
  const totaal = Number(antwoord.headers.get('Content-Length')) || bytes;
  let binnen = 0;
  const teller = new TransformStream<Uint8Array, Uint8Array>({
    transform(stuk, ctrl) {
      binnen += stuk.byteLength;
      voortgang(Math.min(1, binnen / totaal));
      ctrl.enqueue(stuk);
    },
  });
  const stroom = antwoord.body.pipeThrough(teller);

  if (await kanOpfsSchrijven(mapnaam)) {
    const map = (await opfsMap(mapnaam))!;
    const deel = naam.replace(/\.[^.]+$/, '.deel');
    const tijdelijk = await map.getFileHandle(deel, { create: true });
    const schrijver = await (tijdelijk as any).createWritable();
    await stroom.pipeTo(schrijver, { signal: signaal });
    // Klaar: hernoemen door te kopiëren naar de definitieve naam.
    const definitief = await map.getFileHandle(naam, { create: true });
    const w2 = await (definitief as any).createWritable();
    await (await tijdelijk.getFile()).stream().pipeTo(w2);
    await map.removeEntry(deel);
  } else {
    const blob = await new Response(stroom).blob();
    const cache = await caches.open(cachenaam);
    await cache.put(url, new Response(blob, { headers: { 'Content-Type': 'application/octet-stream' } }));
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
    ? `${(bytes / 1073741824).toLocaleString('nl-BE', { maximumFractionDigits: 1 })} GB`
    : `${Math.max(1, Math.round(bytes / 1048576)).toLocaleString('nl-BE')} MB`;
}
