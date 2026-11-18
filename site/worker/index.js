// PlanB72 Worker: serveert de grote pakketbestanden (PMTiles en routepakketten) uit R2, met Range-ondersteuning.
// /beheer/ is de beheeromgeving voor nalezers (zie worker/beheer/ en docs/beheer.md). Die draait
// als aparte Worker (omgeving "beheer" in wrangler.jsonc) op een eigen hostnaam, zodat scripts op de
// publieke site niets kunnen doen met de sessie van een nalezer. De publieke Worker stuurt /beheer/
// door naar BEHEER_URL. Zonder BEHEER_URL (lokaal) serveert deze Worker het beheer zelf.
// Alle andere aanvragen gaan naar de statische bestanden. Geen logging, geen cookies op de publieke site.
import { beheer, alleenBeheer } from './beheer/index.js';

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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (env.BEHEER_APART) return alleenBeheer(request, env, ctx, url);
    if (url.pathname === '/beheer' || url.pathname.startsWith('/beheer/')) {
      if (env.BEHEER_URL) {
        const doel = new URL(url.pathname + url.search, env.BEHEER_URL);
        return request.method === 'GET' || request.method === 'HEAD'
          ? Response.redirect(doel.toString(), 308)
          : new Response('Niet gevonden', { status: 404 });
      }
      return beheer(request, env, ctx);
    }
    const groot = url.pathname.endsWith('.pmtiles') || (url.pathname.startsWith('/data/route/') && url.pathname.endsWith('.pb72r'));
    if (url.pathname.startsWith('/data/') && groot && (request.method === 'GET' || request.method === 'HEAD')) {
      return pakket(request, env, url.pathname.slice('/data/'.length));
    }
    return env.ASSETS.fetch(request);
  },
};
