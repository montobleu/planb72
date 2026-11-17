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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.pmtiles') && (request.method === 'GET' || request.method === 'HEAD')) {
      return pakket(request, env, url.pathname.slice('/data/'.length));
    }
    return env.ASSETS.fetch(request);
  },
};
