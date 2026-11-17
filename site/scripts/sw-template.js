/* PlanB72 service worker — gegenereerd door scripts/sw-manifest.mjs.
   Kern: de app zelf, bij installatie meteen op het toestel.
   Pakket: kaart en kaartlagen, pas na een tik op "Pakket downloaden" (zie /app/pakket/). */

const VERSIE = '__VERSIE__';
const KERN = 'pb72-kern-' + VERSIE;
const PAKKET_VOORVOEGSEL = 'pb72-pakket-';
const KERNBESTANDEN = __KERNBESTANDEN__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(KERN).then(async (cache) => {
      // In kleine groepen, zodat een trage verbinding niet alles laat mislukken.
      for (let i = 0; i < KERNBESTANDEN.length; i += 20) {
        await cache.addAll(KERNBESTANDEN.slice(i, i + 20));
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n.startsWith('pb72-kern-') && n !== KERN).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'versie') event.source?.postMessage({ versie: VERSIE, aantal: KERNBESTANDEN.length });
});

async function zoekInCaches(request) {
  const url = new URL(request.url);
  url.hash = '';
  const sleutel = url.pathname + url.search;
  // Eerst de pakketcaches (grote data), dan de kern.
  const namen = await caches.keys();
  for (const naam of namen) {
    if (!naam.startsWith(PAKKET_VOORVOEGSEL) && naam !== KERN) continue;
    const cache = await caches.open(naam);
    const antwoord = (await cache.match(sleutel)) || (await cache.match(sleutel, { ignoreSearch: true }));
    if (antwoord) return antwoord;
  }
  // Mappen: /app/kaart -> /app/kaart/
  if (!url.pathname.endsWith('/') && !url.pathname.split('/').pop().includes('.')) {
    return zoekInCaches(new Request(url.origin + url.pathname + '/'));
  }
  return null;
}

/** Een Range-aanvraag (PMTiles leest zo de kaart) beantwoorden uit een volledig bewaard bestand. */
async function bereik(request, antwoord) {
  const kop = request.headers.get('range');
  const m = /bytes=(\d+)-(\d*)/.exec(kop || '');
  if (!m) return antwoord;
  const blob = await antwoord.blob();
  const begin = Number(m[1]);
  const einde = m[2] ? Math.min(Number(m[2]), blob.size - 1) : blob.size - 1;
  if (begin >= blob.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
  const stuk = blob.slice(begin, einde + 1);
  return new Response(stuk, {
    status: 206,
    headers: {
      'Content-Type': antwoord.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${begin}-${einde}/${blob.size}`,
      'Content-Length': String(stuk.size),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // PlanB72 laadt niets van buiten.

  // Bewust vers ophalen (pakket bijwerken): de cache overslaan.
  if (request.cache === 'no-store' && request.mode !== 'navigate') return;

  event.respondWith((async () => {
    const bewaard = await zoekInCaches(request);

    if (bewaard) {
      if (request.headers.has('range')) return bereik(request, bewaard);
      // Pagina's: meteen tonen wat er is, op de achtergrond verversen als er verbinding is.
      if (request.mode === 'navigate' && navigator.onLine) {
        event.waitUntil(
          fetch(request).then(async (vers) => {
            if (vers.ok && !vers.redirected) {
              const kern = await caches.open(KERN);
              if (await kern.match(url.pathname)) await kern.put(url.pathname, vers);
            }
          }).catch(() => {})
        );
      }
      return bewaard;
    }

    try {
      return await fetch(request);
    } catch (fout) {
      if (request.mode === 'navigate') {
        const offline = await zoekInCaches(new Request('/app/offline/'));
        if (offline) return offline;
      }
      throw fout;
    }
  })());
});
