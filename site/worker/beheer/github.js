// GitHub-aanroepen namens de ingelogde nalezer. Elke actie gebruikt het token van die persoon,
// zodat goedkeuringen en commentaar onder het eigen GitHub-account staan.

const API = 'https://api.github.com';

export class GitHubFout extends Error {
  constructor(status, bericht, details) {
    super(bericht);
    this.status = status;
    this.details = details;
  }
}

function koppen(token, accept = 'application/vnd.github+json') {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'planb72-beheer',
  };
}

/** REST-aanroep; geeft JSON (of tekst bij een raw-Accept), gooit GitHubFout bij een fout. */
export async function gh(token, pad, { method = 'GET', body, accept } = {}) {
  const antwoord = await fetch(API + pad, {
    method,
    headers: { ...koppen(token, accept), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (antwoord.status === 204) return null;
  // Bij een raw-Accept is de inhoud het bestand zelf, ook als het een JSON-bestand is.
  const isJson = !(accept || '').includes('raw') || !antwoord.ok
    ? (antwoord.headers.get('content-type') || '').includes('json')
    : false;
  const inhoud = isJson ? await antwoord.json() : await antwoord.text();
  if (!antwoord.ok) {
    const bericht = (isJson && inhoud?.message) || `GitHub antwoordde ${antwoord.status}`;
    throw new GitHubFout(antwoord.status, bericht, isJson ? inhoud?.errors : undefined);
  }
  return inhoud;
}

/** GraphQL-aanroep. */
export async function ghql(token, query, variables) {
  const antwoord = await fetch(API + '/graphql', {
    method: 'POST',
    headers: { ...koppen(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const inhoud = await antwoord.json().catch(() => ({}));
  if (!antwoord.ok || inhoud.errors?.length) {
    const status = inhoud.errors?.[0]?.type === 'NOT_FOUND' ? 404 : antwoord.status === 200 ? 502 : antwoord.status;
    throw new GitHubFout(status, inhoud.errors?.[0]?.message || inhoud.message || 'GraphQL-fout');
  }
  return inhoud.data;
}

/** Ruwe inhoud van een bestand op een bepaalde commit; '' als het bestand daar niet bestaat. */
export async function bestand(token, repo, pad, ref) {
  if (!ref) return '';
  try {
    return await gh(token, `/repos/${repo}/contents/${pad.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`, {
      accept: 'application/vnd.github.raw+json',
    });
  } catch (e) {
    if (e instanceof GitHubFout && e.status === 404) return '';
    throw e;
  }
}

/* ---------- OAuth ---------- */

export function aanmeldUrl({ clientId, redirectUri, state, uitdaging, scope }) {
  const u = new URL('https://github.com/login/oauth/authorize');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('scope', scope);
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', uitdaging);
  u.searchParams.set('code_challenge_method', 'S256');
  u.searchParams.set('allow_signup', 'false');
  return u.toString();
}

export async function wisselCode({ clientId, clientSecret, code, redirectUri, verifier }) {
  const antwoord = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'planb72-beheer' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, code_verifier: verifier }),
  });
  const inhoud = await antwoord.json().catch(() => ({}));
  if (!inhoud.access_token) throw new GitHubFout(401, inhoud.error_description || 'GitHub gaf geen token terug.');
  return inhoud.access_token;
}

/** Trek het token in bij GitHub (afmelden). Fouten negeren we: de cookie verdwijnt toch. */
export async function trekTokenIn({ clientId, clientSecret, token }) {
  await fetch(`${API}/applications/${clientId}/token`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'planb72-beheer',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: token }),
  }).catch(() => {});
}

/**
 * Heeft deze gebruiker schrijfrechten op de repository? Leest `permissions` van de repository
 * zoals GitHub die voor het token teruggeeft.
 */
export async function rechten(token, repo) {
  const [gebruiker, r] = await Promise.all([gh(token, '/user'), gh(token, `/repos/${repo}`)]);
  const p = r.permissions || {};
  return {
    login: gebruiker.login,
    naam: gebruiker.name || gebruiker.login,
    schrijven: Boolean(p.push || p.maintain || p.admin),
    beheer: Boolean(p.admin),
    samenvoegen: { merge: r.allow_merge_commit, squash: r.allow_squash_merge, rebase: r.allow_rebase_merge },
    standaardBranch: r.default_branch,
  };
}
