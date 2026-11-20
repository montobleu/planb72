// @ts-check
// Gedeelde hulp voor de beheerpagina's: API-aanroepen, DOM opbouwen zonder innerHTML
// (de pagina dwingt Trusted Types af), veilige weergave van door GitHub gerenderde HTML,
// statusmeldingen en een bevestigingsvenster.

/**
 * Element maken. Kinderen: tekst, Node, of null/false (overgeslagen). Attributen die met "on"
 * beginnen worden event listeners; `class`, `hidden`, `disabled` en dergelijke werken zoals verwacht.
 * @param {string} tag
 * @param {Record<string, any> | null} [attrs]
 * @param {...any} kinderen
 * @returns {HTMLElement}
 */
export function h(tag, attrs, ...kinderen) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  voegToe(el, kinderen);
  return el;
}

/** @param {Element} el @param {any[]} kinderen */
function voegToe(el, kinderen) {
  for (const kind of kinderen.flat(Infinity)) {
    if (kind === null || kind === undefined || kind === false) continue;
    el.append(kind instanceof Node ? kind : document.createTextNode(String(kind)));
  }
}

/** Inhoud van een element vervangen. @param {Element} el @param {...any} kinderen */
export function vervang(el, ...kinderen) {
  el.replaceChildren();
  voegToe(el, kinderen);
}

/** @param {string} sel @returns {HTMLElement} */
export const $ = (sel) => /** @type {HTMLElement} */ (document.querySelector(sel));

/* ---------- API ---------- */

export class ApiFout extends Error {
  /** @param {number} status @param {string} bericht @param {any} data */
  constructor(status, bericht, data) { super(bericht); this.status = status; this.data = data; }
}

/**
 * @param {string} pad relatief aan /beheer/api/
 * @param {{ method?: string, body?: any }} [opties]
 */
export async function api(pad, { method = 'GET', body } = {}) {
  const antwoord = await fetch('/beheer/api/' + pad, {
    method,
    headers: { Accept: 'application/json', ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-PB72-Beheer': '1' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await antwoord.json().catch(() => ({}));
  if (!antwoord.ok) {
    if (data?.aanmelden) toonAanmelden(data.fout);
    throw new ApiFout(antwoord.status, data?.fout || `Fout ${antwoord.status}`, data);
  }
  return data;
}

/**
 * Lees een NDJSON-stroom (voortgang van het Claude-nazicht).
 * @param {string} pad
 * @param {any} body
 * @param {(regel: any) => void} bijRegel
 */
export async function apiStroom(pad, body, bijRegel) {
  const antwoord = await fetch('/beheer/api/' + pad, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-PB72-Beheer': '1' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (!antwoord.ok || !antwoord.body) {
    const data = await antwoord.json().catch(() => ({}));
    if (data?.aanmelden) toonAanmelden(data.fout);
    throw new ApiFout(antwoord.status, data?.fout || `Fout ${antwoord.status}`, data);
  }
  const lezer = antwoord.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await lezer.read();
    if (value) buffer += value;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const regel = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (regel) bijRegel(JSON.parse(regel));
    }
    if (done) break;
  }
  if (buffer.trim()) bijRegel(JSON.parse(buffer));
}

/* ---------- Status, aanmelden, kop ---------- */

/**
 * Statusmelding bovenaan (aria-live).
 * @param {string | Node} tekst
 * @param {'info' | 'ok' | 'gevaar'} [soort]
 */
export function meld(tekst, soort = 'info') {
  const el = $('[data-status]');
  el.className = 'melding' + (soort === 'gevaar' ? ' gevaar' : soort === 'ok' ? ' ok' : '');
  vervang(el, tekst);
  el.hidden = false;
}

export function wisMelding() {
  $('[data-status]').hidden = true;
}

/** @param {string} [reden] */
export function toonAanmelden(reden) {
  const terug = location.pathname + location.search;
  meld(h('p', null,
    reden ? reden + ' ' : 'Meld je aan met je GitHub-account. ',
    h('a', { class: 'knop hoofd', href: '/beheer/aanmelden/?terug=' + encodeURIComponent(terug) }, 'Aanmelden met GitHub'),
  ));
}

/**
 * Status ophalen, kop invullen en nagaan of er aangemeld is.
 * @returns {Promise<{ repo: string, ontbreekt: string[], claude: boolean, gebruiker: { login: string, naam: string, beheer: boolean } | null }>}
 */
export async function start() {
  const knop = /** @type {HTMLButtonElement} */ ($('[data-afmelden]'));
  knop.addEventListener('click', async () => {
    await api('afmelden', { method: 'POST' }).catch(() => {});
    location.href = '/beheer/';
  });
  const status = await api('status');
  if (status.ontbreekt.length) {
    meld(h('div', null,
      h('p', null, h('strong', null, 'De beheeromgeving is nog niet ingesteld.'), ' Deze Worker mist: ', status.ontbreekt.join(', '), '.'),
      h('p', null, 'Maak een GitHub OAuth App en zet de secrets zoals beschreven in ', h('code', null, 'docs/beheer.md'), '. Zonder die instellingen kan niemand zich aanmelden.'),
      !status.claude ? h('p', null, 'Ook ', h('code', null, 'ANTHROPIC_API_KEY'), ' ontbreekt: het nazicht door Claude is dan niet beschikbaar.') : null,
    ), 'gevaar');
    return status;
  }
  if (status.gebruiker) {
    vervang($('[data-gebruiker]'), 'Aangemeld als ', h('strong', null, status.gebruiker.login));
    knop.hidden = false;
  } else {
    toonAanmelden();
  }
  return status;
}

/* ---------- Weergave ---------- */

const DATUM = new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Brussels' });
const RELATIEF = new Intl.RelativeTimeFormat('nl', { numeric: 'auto' });

/** @param {string} iso */
export function datum(iso) {
  return iso ? DATUM.format(new Date(iso)) : '';
}

/** Een <time> met relatieve tekst ("3 dagen geleden") en de volledige datum als titel. @param {string} iso */
export function tijd(iso) {
  if (!iso) return '';
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  if (Math.abs(sec) < 60) return h('time', { datetime: iso, title: datum(iso) }, 'zojuist');
  const [w, e] = Math.abs(sec) < 3600 ? [sec / 60, 'minute'] : Math.abs(sec) < 86400 ? [sec / 3600, 'hour'] : [sec / 86400, 'day'];
  return h('time', { datetime: iso, title: datum(iso) }, RELATIEF.format(Math.round(w), /** @type {Intl.RelativeTimeFormatUnit} */ (e)));
}

/** Elementen en attributen die we van GitHub-HTML overhouden. */
const TOEGELATEN = {
  elements: ['p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'del', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'details', 'summary', 'input', 'kbd', 'sup', 'sub'],
  attributes: ['href', 'title', 'type', 'checked', 'disabled', 'open', 'align'],
  replaceWithChildrenElements: ['div', 'span', 'g-emoji', 'section'],
};

/**
 * Door GitHub gerenderde HTML (bodyHTML) veilig tonen met de Sanitizer API. Waar die ontbreekt,
 * tonen we de ruwe Markdown als tekst: geen HTML, dus niets om te ontsmetten.
 * @param {HTMLElement} el
 * @param {string} html
 * @param {string} ruw
 */
export function toonGitHubHtml(el, html, ruw) {
  if (html && 'setHTML' in Element.prototype) {
    /** @type {any} */ (el).setHTML(html, { sanitizer: TOEGELATEN });
    for (const a of el.querySelectorAll('a[href]')) { a.setAttribute('rel', 'noopener noreferrer'); a.setAttribute('target', '_blank'); }
    for (const i of el.querySelectorAll('input')) i.setAttribute('disabled', '');
  } else {
    vervang(el, h('div', { class: 'ruwe-tekst' }, ruw || ''));
  }
  if (!html && !ruw) vervang(el, h('p', { class: 'dempen' }, 'Geen beschrijving.'));
}

/** Uitkomst van een controle als label. @param {{ naam: string, uitkomst: string, url?: string | null }} c */
export function controleLabel(c) {
  const soort = { geslaagd: 'ok', mislukt: 'fout', bezig: 'bezig', 'niet gestart': 'bezig', overgeslagen: 'neutraal' }[c.uitkomst] || 'neutraal';
  const tekst = `${c.naam}: ${c.uitkomst}`;
  return c.url ? h('a', { class: `status status-${soort}`, href: c.url, rel: 'noopener' }, tekst) : h('span', { class: `status status-${soort}` }, tekst);
}

/** "1 van 2" met kleur. @param {number} aantal @param {number} nodig */
export function goedkeuringLabel(aantal, nodig) {
  return h('span', { class: `status status-${aantal >= nodig ? 'ok' : 'bezig'}` }, `${aantal} van ${nodig}`);
}

/** @param {string} label */
export function labelEl(label) {
  const kritiek = label.startsWith('inhoud:') || label === 'twee nalezers';
  return h('span', { class: 'label' + (kritiek ? ' kritiek' : '') }, label);
}

/**
 * Bevestigingsvenster (native <dialog>, modaal). Geeft true als de gebruiker bevestigt.
 * Verplichte vinkjes in `inhoud` (input required) moeten aangevinkt zijn voor "Bevestigen".
 * @param {{ titel: string, inhoud: any, knop?: string, gevaar?: boolean }} p
 */
export function bevestig({ titel, inhoud, knop = 'Bevestigen', gevaar = false }) {
  const dialoog = /** @type {HTMLDialogElement} */ ($('#bevestig'));
  vervang(/** @type {HTMLElement} */ (dialoog.querySelector('#bevestig-titel')), titel);
  vervang(/** @type {HTMLElement} */ (dialoog.querySelector('[data-bevestig-tekst]')), inhoud);
  const ja = /** @type {HTMLButtonElement} */ (dialoog.querySelector('[data-bevestig-ja]'));
  ja.textContent = knop;
  ja.className = 'knop ' + (gevaar ? 'gevaar' : 'hoofd');
  const annuleer = /** @type {HTMLButtonElement} */ (dialoog.querySelector('button[value=""]'));
  annuleer.formNoValidate = true;
  dialoog.returnValue = '';
  return new Promise((resolve) => {
    dialoog.addEventListener('close', () => {
      const v = dialoog.returnValue === 'ja';
      dialoog.returnValue = '';
      resolve(v);
    }, { once: true });
    dialoog.showModal();
  });
}

/**
 * Een knop die tijdens een actie uitgeschakeld is en het resultaat meldt.
 * @param {HTMLButtonElement} knop
 * @param {() => Promise<string | Node | void>} actie geeft de melding bij succes
 */
export async function bezig(knop, actie) {
  const tekst = knop.textContent;
  knop.disabled = true;
  knop.setAttribute('aria-busy', 'true');
  try {
    const bericht = await actie();
    if (bericht) meld(bericht, 'ok');
    return true;
  } catch (e) {
    const redenen = e instanceof ApiFout && Array.isArray(e.data?.redenen) ? e.data.redenen : [];
    meld(h('div', null, h('p', null, e instanceof Error ? e.message : String(e)), redenen.length ? h('ul', null, redenen.map((/** @type {string} */ r) => h('li', null, r))) : null), 'gevaar');
    return false;
  } finally {
    knop.disabled = false;
    knop.removeAttribute('aria-busy');
    knop.textContent = tekst;
  }
}

/** Nummer uit ?nr= in de adresbalk. */
export function nummerUitAdres() {
  const n = new URLSearchParams(location.search).get('nr');
  return n && /^\d+$/.test(n) ? Number(n) : null;
}
