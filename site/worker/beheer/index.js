// PlanB72 beheeromgeving (/beheer/): nalezers bekijken, controleren en bevestigen wat via GitHub
// binnenkomt. Aanmelden met GitHub OAuth; alleen wie schrijfrechten op de repository heeft, komt
// binnen. Elke actie gebruikt het token van de nalezer zelf.
//
// Secrets (zie docs/beheer.md): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSIE_GEHEIM, ANTHROPIC_API_KEY.
// Variabelen (wrangler.jsonc): BEHEER_REPO, BEHEER_SCOPE.

import { gh, GitHubFout, aanmeldUrl, wisselCode, trekTokenIn, rechten } from './github.js';
import { overzicht, prDetail, prBestand, issueDetail, register } from './gegevens.js';
import { laatClaudeNakijken, alsCommentaar, controleerResultaat } from './claude.js';
import {
  SESSIE_COOKIE, OAUTH_COOKIE, SESSIE_DUUR, verzegel, ontzegel, leesCookie, zetCookie, wisCookie, willekeurig, pkceUitdaging,
} from './sessie.js';

const HERCONTROLE = 5 * 60; // seconden tussen twee controles van de schrijfrechten (lezen)

/** Strikte koppen voor alles onder /beheer/. */
const BEVEILIGING = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://github.com; require-trusted-types-for 'script'; trusted-types 'none'",
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), interest-cohort=()',
};

function metKoppen(antwoord, extra = {}) {
  const r = new Response(antwoord.body, antwoord);
  for (const [k, v] of Object.entries({ ...BEVEILIGING, ...extra })) r.headers.set(k, v);
  return r;
}

function json(data, status = 200, koppen = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...BEVEILIGING, ...koppen } });
}

function fout(status, bericht, extra = {}) {
  return json({ fout: bericht, ...extra }, status);
}

/** Welke instellingen ontbreken. Geen waarden, alleen namen. */
function ontbrekend(env) {
  return ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSIE_GEHEIM'].filter((k) => !env[k])
    .concat(env.SESSIE_GEHEIM && env.SESSIE_GEHEIM.length < 32 ? ['SESSIE_GEHEIM (minstens 32 tekens)'] : []);
}

const repoVan = (env) => env.BEHEER_REPO || 'montobleu/planb72';

/** Alleen eigen paden als bestemming na het aanmelden. */
function veiligTerug(pad) {
  return typeof pad === 'string' && /^\/beheer\/[\w\-/?=&.%]*$/.test(pad) && !pad.includes('//') ? pad : '/beheer/';
}

function foutPagina(titel, tekst, status = 400) {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="dark light"><title>${titel} · Beheer · PlanB72</title><link rel="stylesheet" href="/beheer/beheer.css"></head><body><main class="beheer-wrap"><h1>${titel}</h1><p>${tekst}</p><p><a href="/beheer/">Terug naar het beheer</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...BEVEILIGING } });
}

const ontsnap = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Aanmelden ---------- */

async function aanmelden(request, env, url) {
  const mist = ontbrekend(env);
  if (mist.length) {
    return foutPagina('Aanmelden is nog niet ingesteld', `Deze Worker mist: ${ontsnap(mist.join(', '))}. Zie docs/beheer.md voor de GitHub OAuth App en de secrets.`, 503);
  }
  const state = willekeurig();
  const verifier = willekeurig(48);
  const terug = veiligTerug(url.searchParams.get('terug'));
  const zegel = await verzegel(env.SESSIE_GEHEIM, 'oauth', { state, verifier, terug, tot: Math.floor(Date.now() / 1000) + 600 });
  const doel = aanmeldUrl({
    clientId: env.GITHUB_CLIENT_ID,
    redirectUri: `${url.origin}/beheer/terug/`,
    state,
    uitdaging: await pkceUitdaging(verifier),
    scope: env.BEHEER_SCOPE || 'public_repo',
  });
  return new Response(null, { status: 302, headers: { Location: doel, 'Set-Cookie': zetCookie(OAUTH_COOKIE, zegel, 600), ...BEVEILIGING } });
}

async function terugVanGitHub(request, env, url) {
  const mist = ontbrekend(env);
  if (mist.length) return foutPagina('Aanmelden is nog niet ingesteld', `Ontbrekend: ${ontsnap(mist.join(', '))}.`, 503);
  if (url.searchParams.get('error')) {
    return foutPagina('Aanmelden geannuleerd', ontsnap(url.searchParams.get('error_description') || 'GitHub gaf geen toestemming.'));
  }
  const oauth = await ontzegel(env.SESSIE_GEHEIM, 'oauth', leesCookie(request, OAUTH_COOKIE));
  const code = url.searchParams.get('code');
  if (!oauth || !code || url.searchParams.get('state') !== oauth.state) {
    return foutPagina('Aanmelden mislukt', 'De aanvraag is verlopen of komt niet van deze pagina. Probeer opnieuw.');
  }
  let token;
  try {
    token = await wisselCode({
      clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, code,
      redirectUri: `${url.origin}/beheer/terug/`, verifier: oauth.verifier,
    });
  } catch (e) {
    return foutPagina('Aanmelden mislukt', ontsnap(e.message));
  }
  const repo = repoVan(env);
  let r;
  try {
    r = await rechten(token, repo);
  } catch (e) {
    await trekTokenIn({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, token });
    return foutPagina('Aanmelden mislukt', `De rechten op ${ontsnap(repo)} konden niet gelezen worden: ${ontsnap(e.message)}`);
  }
  if (!r.schrijven) {
    await trekTokenIn({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, token });
    return foutPagina('Geen toegang', `Je bent aangemeld als ${ontsnap(r.login)}, maar je hebt geen schrijfrechten op ${ontsnap(repo)}. Vraag een beheerder om je als medewerker toe te voegen.`, 403);
  }
  const nu = Math.floor(Date.now() / 1000);
  const sessie = { token, login: r.login, naam: r.naam, beheer: r.beheer, samenvoegen: r.samenvoegen, gecontroleerd: nu, tot: nu + SESSIE_DUUR };
  const koppen = new Headers({ Location: oauth.terug || '/beheer/', ...BEVEILIGING });
  koppen.append('Set-Cookie', zetCookie(SESSIE_COOKIE, await verzegel(env.SESSIE_GEHEIM, 'sessie', sessie), SESSIE_DUUR));
  koppen.append('Set-Cookie', wisCookie(OAUTH_COOKIE));
  return new Response(null, { status: 302, headers: koppen });
}

/* ---------- Sessie ---------- */

/**
 * Leest en controleert de sessie. Bij schrijfacties (of na HERCONTROLE seconden) controleren we
 * opnieuw bij GitHub of de schrijfrechten er nog zijn.
 * @returns {Promise<{ sessie?: any, cookie?: string, antwoord?: Response }>}
 */
async function sessieVan(request, env, { schrijven }) {
  const sessie = await ontzegel(env.SESSIE_GEHEIM, 'sessie', leesCookie(request, SESSIE_COOKIE));
  if (!sessie) return { antwoord: fout(401, 'Niet aangemeld.', { aanmelden: true }) };
  const nu = Math.floor(Date.now() / 1000);
  if (!schrijven && nu - sessie.gecontroleerd < HERCONTROLE) return { sessie };
  try {
    const r = await rechten(sessie.token, repoVan(env));
    if (!r.schrijven || r.login !== sessie.login) {
      return { antwoord: fout(403, 'Je schrijfrechten op de repository zijn ingetrokken.', { aanmelden: true }) };
    }
    sessie.gecontroleerd = nu;
    sessie.beheer = r.beheer;
    sessie.samenvoegen = r.samenvoegen;
    return { sessie, cookie: zetCookie(SESSIE_COOKIE, await verzegel(env.SESSIE_GEHEIM, 'sessie', sessie), sessie.tot - nu) };
  } catch (e) {
    if (e instanceof GitHubFout && e.status === 401) return { antwoord: fout(401, 'Je GitHub-aanmelding is verlopen.', { aanmelden: true }) };
    throw e;
  }
}

/** Schrijfacties alleen vanaf deze site, met een eigen kop (geen formulier van elders). */
function vanHier(request, url) {
  const herkomst = request.headers.get('origin');
  return request.headers.get('x-pb72-beheer') === '1' && (!herkomst || herkomst === url.origin);
}

async function leesLichaam(request) {
  const tekst = await request.text();
  if (tekst.length > 200_000) throw new GitHubFout(413, 'Te groot.');
  try { return tekst ? JSON.parse(tekst) : {}; } catch { throw new GitHubFout(400, 'Ongeldige JSON.'); }
}

const nr = (s) => (/^\d{1,7}$/.test(s) ? Number(s) : null);
const SHA = /^[0-9a-f]{40}$/;
const PAD = /^[\w\-./ ]{1,300}$/;

/* ---------- Handtekening voor het Claude-resultaat ---------- */

const GELDIG_HANDTEKENING = 24 * 60 * 60 * 1000;

/** HMAC met een eigen sleutel, afgeleid van SESSIE_GEHEIM (los van de sleutels van de cookies). */
async function hmac(geheim, velden) {
  const enc = new TextEncoder();
  const basis = await crypto.subtle.importKey('raw', enc.encode(geheim), 'HKDF', false, ['deriveKey']);
  const sleutel = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('planb72-beheer'), info: enc.encode('claude-handtekening') },
    basis, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', sleutel, enc.encode(JSON.stringify(velden)));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function gelijk(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return v === 0;
}

/* ---------- API ---------- */

async function api(request, env, ctx, url) {
  const pad = url.pathname.slice('/beheer/api/'.length).replace(/\/$/, '');
  const methode = request.method;
  const repo = repoVan(env);

  if (pad === 'status' && methode === 'GET') {
    const mist = ontbrekend(env);
    let gebruiker = null;
    if (!mist.length) {
      const sessie = await ontzegel(env.SESSIE_GEHEIM, 'sessie', leesCookie(request, SESSIE_COOKIE));
      if (sessie) gebruiker = { login: sessie.login, naam: sessie.naam, beheer: Boolean(sessie.beheer) };
    }
    return json({ repo, ontbreekt: mist, claude: Boolean(env.ANTHROPIC_API_KEY), gebruiker });
  }

  if (ontbrekend(env).length) return fout(503, `Niet ingesteld: ${ontbrekend(env).join(', ')}. Zie docs/beheer.md.`);

  if (methode !== 'GET' && !vanHier(request, url)) return fout(403, 'Aanvraag geweigerd (niet vanaf de beheerpagina).');

  if (pad === 'afmelden' && methode === 'POST') {
    const sessie = await ontzegel(env.SESSIE_GEHEIM, 'sessie', leesCookie(request, SESSIE_COOKIE));
    if (sessie?.token) ctx.waitUntil(trekTokenIn({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, token: sessie.token }));
    return json({ ok: true }, 200, { 'Set-Cookie': wisCookie(SESSIE_COOKIE) });
  }

  const schrijven = methode !== 'GET';
  const { sessie, cookie, antwoord } = await sessieVan(request, env, { schrijven });
  if (antwoord) return antwoord;
  const extra = cookie ? { 'Set-Cookie': cookie } : {};
  const token = sessie.token;
  const ok = (data, status = 200) => json(data, status, extra);

  let m;
  if (pad === 'overzicht' && methode === 'GET') return ok(await overzicht(token, repo));

  if (pad === 'register' && methode === 'GET') return ok({ bronnen: await register(token, repo, url.searchParams.get('ref') || undefined) });

  if ((m = /^pr\/(\d+)$/.exec(pad)) && methode === 'GET') {
    const detail = await prDetail(token, repo, nr(m[1]));
    if (!detail) return fout(404, 'Pull request niet gevonden.');
    return ok({ ...detail, ik: sessie.login, claude: Boolean(env.ANTHROPIC_API_KEY), methodes: sessie.samenvoegen || null });
  }

  if ((m = /^pr\/(\d+)\/bestand$/.exec(pad)) && methode === 'GET') {
    const q = url.searchParams;
    const p = { pad: q.get('pad'), vorigPad: q.get('vorig') || null, basis: q.get('basis'), kop: q.get('kop'), status: q.get('status') };
    if (!PAD.test(p.pad || '') || (p.vorigPad && !PAD.test(p.vorigPad)) || !SHA.test(p.basis || '') || !SHA.test(p.kop || '') || p.pad.includes('..')) {
      return fout(400, 'Ongeldige parameters.');
    }
    return ok(await prBestand(token, repo, p));
  }

  if ((m = /^pr\/(\d+)\/review$/.exec(pad)) && methode === 'POST') {
    const { soort, tekst, kopSha } = await leesLichaam(request);
    const event = { goedkeuren: 'APPROVE', wijzigingen: 'REQUEST_CHANGES' }[soort];
    if (!event) return fout(400, 'Onbekende soort review.');
    if (event === 'REQUEST_CHANGES' && !String(tekst || '').trim()) return fout(400, 'Schrijf wat er moet veranderen.');
    if (!SHA.test(kopSha || '')) return fout(400, 'Commit ontbreekt.');
    const pr = await gh(token, `/repos/${repo}/pulls/${nr(m[1])}`);
    if (pr.user?.login === sessie.login) return fout(400, 'Je kunt je eigen pull request niet goedkeuren of afkeuren; de auteur telt nooit als nalezer.');
    if (pr.head.sha !== kopSha) return fout(409, 'Er zijn intussen nieuwe commits. Herlaad de pagina en kijk de nieuwste versie na.');
    const r = await gh(token, `/repos/${repo}/pulls/${nr(m[1])}/reviews`, { method: 'POST', body: { event, body: String(tekst || '').slice(0, 60000), commit_id: kopSha } });
    return ok({ ok: true, url: r.html_url });
  }

  if ((m = /^(pr|issue)\/(\d+)\/commentaar$/.exec(pad)) && methode === 'POST') {
    // Gewoon commentaar, geen review: zo verandert een opmerking nooit de telling van goedkeuringen.
    const { tekst } = await leesLichaam(request);
    if (!String(tekst || '').trim()) return fout(400, 'Lege reactie.');
    const r = await gh(token, `/repos/${repo}/issues/${nr(m[2])}/comments`, { method: 'POST', body: { body: String(tekst).slice(0, 60000) } });
    return ok({ ok: true, url: r.html_url });
  }

  if ((m = /^pr\/(\d+)\/samenvoegen$/.exec(pad)) && methode === 'POST') {
    const { methode: wijze = 'merge', kopSha } = await leesLichaam(request);
    if (!['merge', 'squash', 'rebase'].includes(wijze)) return fout(400, 'Onbekende manier van samenvoegen.');
    // De regels opnieuw nagaan op de server: de knop in de browser is niet genoeg.
    const detail = await prDetail(token, repo, nr(m[1]));
    if (!detail) return fout(404, 'Pull request niet gevonden.');
    if (detail.kopSha !== kopSha) return fout(409, 'Er zijn intussen nieuwe commits. Herlaad de pagina.');
    if (!detail.regels.mag) return fout(409, 'Samenvoegen kan nog niet.', { redenen: detail.regels.redenen });
    const r = await gh(token, `/repos/${repo}/pulls/${detail.nummer}/merge`, { method: 'PUT', body: { merge_method: wijze, sha: kopSha } });
    return ok({ ok: true, sha: r.sha, bericht: r.message });
  }

  if ((m = /^pr\/(\d+)\/claude$/.exec(pad)) && methode === 'POST') {
    if (!env.ANTHROPIC_API_KEY) return fout(503, 'Niet ingesteld: ANTHROPIC_API_KEY. Zie docs/beheer.md.');
    const detail = await prDetail(token, repo, nr(m[1]));
    if (!detail) return fout(404, 'Pull request niet gevonden.');
    // Voortgang als NDJSON, zodat de verbinding open blijft terwijl Claude leest.
    const { readable, writable } = new TransformStream();
    const schrijver = writable.getWriter();
    const enc = new TextEncoder();
    const stuur = (obj) => schrijver.write(enc.encode(JSON.stringify(obj) + '\n')).catch(() => {});
    const klus = (async () => {
      const begin = Date.now();
      try {
        const uit = await laatClaudeNakijken({ token, repo, pr: detail, sleutel: env.ANTHROPIC_API_KEY, meld: stuur });
        const tekst = JSON.stringify(uit.resultaat);
        const tijd = Date.now();
        const handtekening = await hmac(env.SESSIE_GEHEIM, ['claude', detail.nummer, detail.kopSha, uit.model, sessie.login, tijd, tekst]);
        await stuur({ klaar: true, ...uit, resultaatTekst: tekst, kopSha: detail.kopSha, tijd, handtekening, seconden: Math.round((tijd - begin) / 1000) });
      } catch (e) {
        await stuur({ fout: e instanceof Error ? e.message : 'Onbekende fout bij het nazicht door Claude.' });
      } finally {
        await schrijver.close().catch(() => {});
      }
    })();
    ctx.waitUntil(klus);
    return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', ...BEVEILIGING, ...extra } });
  }

  if ((m = /^pr\/(\d+)\/claude\/plaatsen$/.exec(pad)) && methode === 'POST') {
    const { resultaatTekst, kopSha, model, handtekening, tijd } = await leesLichaam(request);
    const verwacht = await hmac(env.SESSIE_GEHEIM, ['claude', nr(m[1]), kopSha, model, sessie.login, tijd, resultaatTekst]);
    if (!gelijk(handtekening, verwacht)) return fout(400, 'Dit resultaat komt niet van het nazicht door Claude of werd gewijzigd.');
    if (!(Date.now() - Number(tijd) < GELDIG_HANDTEKENING)) return fout(400, 'Dit resultaat is ouder dan een dag. Laat Claude opnieuw nakijken.');
    let resultaat;
    try { resultaat = JSON.parse(resultaatTekst); } catch { return fout(400, 'Ongeldig resultaat.'); }
    if (!controleerResultaat(resultaat)) return fout(400, 'Ongeldig resultaat.');
    const body = alsCommentaar({ resultaat, model, aanvrager: sessie.login, kopSha });
    const r = await gh(token, `/repos/${repo}/issues/${nr(m[1])}/comments`, { method: 'POST', body: { body } });
    return ok({ ok: true, url: r.html_url });
  }

  if ((m = /^issue\/(\d+)$/.exec(pad)) && methode === 'GET') {
    const detail = await issueDetail(token, repo, nr(m[1]));
    if (!detail) return fout(404, 'Issue niet gevonden.');
    return ok({ ...detail, ik: sessie.login });
  }

  if ((m = /^issue\/(\d+)\/labels$/.exec(pad)) && methode === 'POST') {
    const { labels } = await leesLichaam(request);
    if (!Array.isArray(labels) || labels.length > 30 || !labels.every((l) => typeof l === 'string' && l.length <= 50)) return fout(400, 'Ongeldige labels.');
    await gh(token, `/repos/${repo}/issues/${nr(m[1])}/labels`, { method: 'PUT', body: { labels } });
    return ok({ ok: true });
  }

  if ((m = /^issue\/(\d+)\/toewijzen$/.exec(pad)) && methode === 'POST') {
    const { logins } = await leesLichaam(request);
    if (!Array.isArray(logins) || logins.length > 10 || !logins.every((l) => /^[\w-]{1,39}$/.test(l))) return fout(400, 'Ongeldige accounts.');
    await gh(token, `/repos/${repo}/issues/${nr(m[1])}`, { method: 'PATCH', body: { assignees: logins } });
    return ok({ ok: true });
  }

  if ((m = /^issue\/(\d+)\/sluiten$/.exec(pad)) && methode === 'POST') {
    const { reden, tekst } = await leesLichaam(request);
    if (!['completed', 'not_planned', 'duplicate'].includes(reden)) return fout(400, 'Onbekende reden.');
    if (String(tekst || '').trim()) {
      await gh(token, `/repos/${repo}/issues/${nr(m[1])}/comments`, { method: 'POST', body: { body: String(tekst).slice(0, 60000) } });
    }
    await gh(token, `/repos/${repo}/issues/${nr(m[1])}`, { method: 'PATCH', body: { state: 'closed', state_reason: reden } });
    return ok({ ok: true });
  }

  if ((m = /^issue\/(\d+)\/heropenen$/.exec(pad)) && methode === 'POST') {
    await gh(token, `/repos/${repo}/issues/${nr(m[1])}`, { method: 'PATCH', body: { state: 'open' } });
    return ok({ ok: true });
  }

  if ((m = /^issue\/(\d+)\/taak$/.exec(pad)) && methode === 'POST') {
    // Een melding omzetten naar een taak: label "taak", "te beoordelen" eraf, een checklist als
    // reactie en eventueel iemand toewijzen. De repository staat op een persoonlijk account,
    // dus GitHub-issuetypes (alleen voor organisaties) zijn niet beschikbaar.
    const { stappen, toewijzen, notitie } = await leesLichaam(request);
    if (!Array.isArray(stappen) || stappen.length > 20 || !stappen.every((s) => typeof s === 'string' && s.length <= 300)) return fout(400, 'Ongeldige stappen.');
    if (toewijzen && !/^[\w-]{1,39}$/.test(toewijzen)) return fout(400, 'Ongeldig account.');
    const nummer = nr(m[1]);
    await gh(token, `/repos/${repo}/labels`, { method: 'POST', body: { name: 'taak', color: '0E8A16', description: 'Aanvaarde melding of voorstel; klaar om uit te voeren' } })
      .catch((e) => { if (!(e instanceof GitHubFout && e.status === 422)) throw e; });
    const issue = await gh(token, `/repos/${repo}/issues/${nummer}`);
    const labels = new Set((issue.labels || []).map((l) => l.name));
    labels.delete('te beoordelen');
    labels.add('taak');
    const body = { labels: [...labels] };
    if (toewijzen) body.assignees = [...new Set([...(issue.assignees || []).map((a) => a.login), toewijzen])];
    await gh(token, `/repos/${repo}/issues/${nummer}`, { method: 'PATCH', body });
    const tekst = [
      `Omgezet naar een taak door @${sessie.login} via de beheermodule.`,
      ...(String(notitie || '').trim() ? ['', String(notitie).slice(0, 5000)] : []),
      '',
      ...stappen.filter((s) => s.trim()).map((s) => `- [ ] ${s.replace(/\r?\n/g, ' ')}`),
    ].join('\n');
    await gh(token, `/repos/${repo}/issues/${nummer}/comments`, { method: 'POST', body: { body: tekst } });
    return ok({ ok: true });
  }

  return fout(404, 'Onbekende aanvraag.');
}

/* ---------- Ingang ---------- */

/** Wat de beheer-Worker op zijn eigen hostnaam naast /beheer/ nog serveert: stijlen, scripts, lettertypes. */
const GEDEELD = /^\/(_astro\/[\w.-]+\.(css|js)|fonts\/[\w.-]+\.woff2|favicon\.svg)$/;

/**
 * Aparte beheer-Worker (BEHEER_APART): alleen /beheer/ en de bestanden die het nodig heeft.
 * De publieke site en de app draaien hier niet, zodat er geen andere scripts op deze origin komen.
 */
export async function alleenBeheer(request, env, ctx, url) {
  if (url.pathname === '/beheer' || url.pathname.startsWith('/beheer/')) return beheer(request, env, ctx);
  if ((request.method === 'GET' || request.method === 'HEAD') && GEDEELD.test(url.pathname)) {
    const r = await env.ASSETS.fetch(request);
    const uit = new Response(r.body, r);
    uit.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    uit.headers.set('X-Content-Type-Options', 'nosniff');
    return uit;
  }
  return new Response(null, { status: 302, headers: { Location: '/beheer/', ...BEVEILIGING } });
}

export async function beheer(request, env, ctx) {
  const url = new URL(request.url);
  const p = url.pathname;
  try {
    if (p === '/beheer/aanmelden/' || p === '/beheer/aanmelden') return await aanmelden(request, env, url);
    if (p === '/beheer/terug/' || p === '/beheer/terug') return await terugVanGitHub(request, env, url);
    if (p.startsWith('/beheer/api/')) return await api(request, env, ctx, url);
  } catch (e) {
    if (e instanceof GitHubFout) {
      const status = e.status === 401 ? 401 : e.status === 403 ? 403 : e.status === 404 ? 404 : e.status === 409 || e.status === 422 ? 409 : 502;
      return fout(status, `GitHub: ${e.message}`, e.status === 401 ? { aanmelden: true } : {});
    }
    // Geen logging (zoals de rest van de Worker); de nalezer ziet een algemene melding.
    return fout(500, 'Er ging iets mis in de beheeromgeving.');
  }
  // Pagina's en scripts van de beheeromgeving: statisch, met strikte koppen.
  if (request.method !== 'GET' && request.method !== 'HEAD') return fout(405, 'Niet toegelaten.');
  return metKoppen(await env.ASSETS.fetch(request));
}
