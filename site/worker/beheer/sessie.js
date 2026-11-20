// Versleutelde sessiecookie voor de beheeromgeving.
// De cookie bevat het GitHub-token van de nalezer, versleuteld met AES-GCM onder een sleutel
// afgeleid van het Worker-secret SESSIE_GEHEIM. Niets wordt op de server bewaard.
// HttpOnly, Secure, SameSite=Lax en alleen voor /beheer/: de publieke site krijgt geen cookie.

export const SESSIE_COOKIE = '__Secure-pb72-beheer';
export const OAUTH_COOKIE = '__Secure-pb72-oauth';
export const SESSIE_DUUR = 8 * 60 * 60; // seconden
const PAD = '/beheer/';

const tekst = new TextEncoder();
const leesTekst = new TextDecoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function vanB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Willekeurige tekenreeks (state, PKCE-verifier). */
export function willekeurig(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** PKCE: code_challenge = BASE64URL(SHA-256(verifier)). */
export async function pkceUitdaging(verifier) {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', tekst.encode(verifier))));
}

const sleutels = new Map();
async function sleutel(geheim, doel) {
  const id = doel + '\u0000' + geheim;
  if (!sleutels.has(id)) {
    const ruw = await crypto.subtle.importKey('raw', tekst.encode(geheim), 'HKDF', false, ['deriveKey']);
    sleutels.set(id, await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: tekst.encode('planb72-beheer'), info: tekst.encode(doel) },
      ruw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    ));
  }
  return sleutels.get(id);
}

/** Versleutel een object; `doel` scheidt de sessie- en de OAuth-cookie. */
export async function verzegel(geheim, doel, waarde) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sleutel(geheim, doel), tekst.encode(JSON.stringify(waarde)));
  return b64url(iv) + '.' + b64url(new Uint8Array(data));
}

/** Ontsleutel; geeft null bij een ongeldige of verlopen waarde. */
export async function ontzegel(geheim, doel, waarde) {
  if (!waarde || !waarde.includes('.')) return null;
  try {
    const [iv, data] = waarde.split('.');
    const ruw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: vanB64url(iv) }, await sleutel(geheim, doel), vanB64url(data));
    const obj = JSON.parse(leesTekst.decode(ruw));
    if (!obj || typeof obj !== 'object' || (obj.tot && obj.tot < Date.now() / 1000)) return null;
    return obj;
  } catch {
    return null;
  }
}

export function leesCookie(request, naam) {
  const kop = request.headers.get('cookie') || '';
  for (const deel of kop.split(';')) {
    const [k, ...v] = deel.trim().split('=');
    if (k === naam) return v.join('=');
  }
  return null;
}

export function zetCookie(naam, waarde, maxAge) {
  return `${naam}=${waarde}; Path=${PAD}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function wisCookie(naam) {
  return `${naam}=; Path=${PAD}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
