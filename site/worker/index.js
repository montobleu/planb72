// PlanB72 Worker: serveert de grote pakketbestanden (PMTiles) uit R2, met Range-ondersteuning.
// Alle andere aanvragen gaan naar de statische bestanden. Geen logging, geen cookies.

function leesBereik(kop) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(kop || '');
  if (!m) return undefined;
  if (m[1] === '' && m[2] !== '') return { suffix: Number(m[2]) };
  const offset = Number(m[1]);
  return m[2] === '' ? { offset } : { offset, length: Number(m[2]) - offset + 1 };
}

async function pakket(request, env, sleutel) {
  const bereik = leesBereik(request.headers.get('range'));
  const obj = request.method === 'HEAD'
    ? await env.PAKKETTEN.head(sleutel)
    : await env.PAKKETTEN.get(sleutel, bereik ? { range: bereik, onlyIf: request.headers } : { onlyIf: request.headers });
  if (!obj) return new Response('Niet gevonden', { status: 404 });

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, ETag',
    ETag: obj.httpEtag,
  });
  if (request.method === 'HEAD' || !('body' in obj)) {
    headers.set('Content-Length', String(obj.size));
    return new Response(null, { status: 'body' in obj || request.method === 'HEAD' ? 200 : 304, headers });
  }
  if (bereik && obj.range) {
    const begin = obj.range.offset ?? obj.size - obj.range.suffix;
    const lengte = obj.range.length ?? obj.size - begin;
    headers.set('Content-Range', `bytes ${begin}-${begin + lengte - 1}/${obj.size}`);
    headers.set('Content-Length', String(lengte));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

/**
 * Cookieloze bezoekersstatistiek via Nvivio (https://nvivio.com/docs/proxy).
 * Alles loopt via ons eigen domein: de browser praat nooit rechtstreeks met een derde partij.
 * /stats/script.js geeft het script van onze site (sitecode in de variabele NVIVIO_SITE);
 * het script stuurt zijn events naar /stats/e, dat we doorsturen naar nviv.io.
 * Zonder NVIVIO_SITE of NVIVIO_KEY wordt er niets gemeten.
 */
async function statistiek(request, env, pad) {
  if (!env.NVIVIO_SITE || !env.NVIVIO_KEY) {
    return pad === 'script.js'
      ? new Response('', { headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' } })
      : new Response(null, { status: 204 });
  }
  const doel = pad === 'script.js' ? `js/${env.NVIVIO_SITE}.js` : pad;
  const headers = new Headers();
  for (const naam of ['User-Agent', 'Accept-Language', 'Sec-GPC', 'Content-Type']) {
    const waarde = request.headers.get(naam);
    if (waarde) headers.set(naam, waarde);
  }
  if (request.method === 'POST') {
    headers.set('Authorization', `Bearer ${env.NVIVIO_KEY}`);
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) headers.set('X-Nvivio-Ip', ip);
    const cf = request.cf || {};
    if (cf.country) headers.set('X-Nvivio-Country', cf.country);
    if (cf.region) headers.set('X-Nvivio-Region', encodeURIComponent(cf.region));
    if (cf.city) headers.set('X-Nvivio-City', encodeURIComponent(cf.city));
  }
  return fetch(`https://nviv.io/${doel}`, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/stats/')) {
      return statistiek(request, env, url.pathname.slice('/stats/'.length));
    }
    if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.pmtiles') && (request.method === 'GET' || request.method === 'HEAD')) {
      return pakket(request, env, url.pathname.slice('/data/'.length));
    }
    return env.ASSETS.fetch(request);
  },
};
