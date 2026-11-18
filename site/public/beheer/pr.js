// @ts-check
// Beheer, één pull request: leesbare weergave van de inhoudswijziging (oud en nieuw naast elkaar),
// uitgelichte noodnummers, bronnen en registeritems, het nazicht door Claude, en de acties
// goedkeuren, wijzigingen vragen, reageren en samenvoegen, namens de ingelogde nalezer.
import {
  h, vervang, $, api, apiStroom, start, meld, wisMelding, tijd, datum, controleLabel, goedkeuringLabel, labelEl,
  toonGitHubHtml, bevestig, bezig, nummerUitAdres,
} from './gemeen.js';
import {
  regelVerschil, naastElkaar, woordVerschil, bronnenVerschil, getallenVerschil, doseringenUit, landVerschil,
  registerVerschil, urlSleutel,
} from './verschil.js';

const CONTEXT = 3;           // ongewijzigde regels rond een wijziging
const GELIJKTIJDIG = 4;      // bestanden die tegelijk geladen worden
const MAX_BESTANDEN = 40;    // meer bestanden: zie GitHub

const STAAT = { APPROVED: 'goedgekeurd', CHANGES_REQUESTED: 'wijzigingen gevraagd', COMMENTED: 'gereageerd', DISMISSED: 'ingetrokken', PENDING: 'in voorbereiding' };
const kort = (/** @type {string} */ sha) => String(sha || '').slice(0, 7);

/** @type {any} */ let pr = null;
const nummer = nummerUitAdres();

/* ---------- Verschil naast elkaar ---------- */

/**
 * Eén regel als twee cellen (nummer en tekst), met woordmarkering als er een tegenhanger is.
 * @param {import('./verschil.js').RegelOp | undefined} op
 * @param {'links' | 'rechts'} kant
 * @param {{ tekst: string, anders: boolean }[] | null} woorden
 * @param {string} idVoorvoegsel
 */
function cellen(op, kant, woorden, idVoorvoegsel) {
  if (!op) return [h('td', { class: 'nr leeg' }), h('td', { class: 'leeg' })];
  const nr = kant === 'links' ? op.oudNr : op.nieuwNr;
  const tekst = kant === 'links' ? op.oud : op.nieuw;
  const soort = op.soort === 'gelijk' ? '' : kant === 'links' ? 'weg' : 'bij';
  const inhoud = woorden
    ? woorden.map((w) => (w.anders ? h(kant === 'links' ? 'del' : 'ins', null, w.tekst) : w.tekst))
    : [tekst];
  return [
    h('td', { class: 'nr ' + soort, id: kant === 'rechts' && nr ? `${idVoorvoegsel}-${nr}` : null }, String(nr ?? '')),
    h('td', { class: soort },
      soort ? h('span', { class: 'sr-only' }, soort === 'weg' ? 'Verwijderd: ' : 'Toegevoegd: ') : null,
      inhoud),
  ];
}

/** @param {import('./verschil.js').Rij} rij @param {string} idv */
function rijEl(rij, idv) {
  let links = null, rechts = null;
  if (!rij.gelijk && rij.links && rij.rechts) {
    const w = woordVerschil(rij.links.oud ?? '', rij.rechts.nieuw ?? '');
    links = w.oud; rechts = w.nieuw;
  }
  return h('tr', null, cellen(rij.links, 'links', links, idv), cellen(rij.rechts, 'rechts', rechts, idv));
}

/**
 * Tabel met oud links en nieuw rechts. Lange stukken zonder wijziging worden ingeklapt.
 * @param {string} oud @param {string} nieuw @param {string} pad @param {string} idv
 */
function verschilTabel(oud, nieuw, pad, idv) {
  const rijen = naastElkaar(regelVerschil(oud, nieuw));
  if (!rijen.some((r) => !r.gelijk)) return h('p', { class: 'dempen', style: 'padding: 10px 14px; margin: 0' }, 'Geen verschil in de tekst.');
  const tbody = h('tbody');
  let i = 0;
  while (i < rijen.length) {
    if (!rijen[i].gelijk) { tbody.append(rijEl(rijen[i], idv)); i++; continue; }
    let j = i;
    while (j < rijen.length && rijen[j].gelijk) j++;
    const blok = rijen.slice(i, j);
    const voor = i === 0 ? 0 : CONTEXT, na = j === rijen.length ? 0 : CONTEXT;
    if (blok.length <= voor + na + 2) {
      for (const r of blok) tbody.append(rijEl(r, idv));
    } else {
      for (const r of blok.slice(0, voor)) tbody.append(rijEl(r, idv));
      const verborgen = blok.slice(voor, blok.length - na);
      const knop = h('button', { type: 'button' }, `${verborgen.length} ongewijzigde regels tonen`);
      const inklap = h('tr', { class: 'inklap' }, h('td', { colspan: 4 }, knop));
      knop.addEventListener('click', () => {
        inklap.replaceWith(...verborgen.map((r) => rijEl(r, idv)));
      });
      tbody.append(inklap);
      for (const r of blok.slice(blok.length - na)) tbody.append(rijEl(r, idv));
    }
    i = j;
  }
  return h('div', { class: 'verschil-regio', role: 'region', tabindex: 0, 'aria-label': `Verschil in ${pad}` },
    h('table', { class: 'verschil' },
      h('caption', { class: 'sr-only' }, `Verschil in ${pad}: oude versie links, nieuwe versie rechts. Gewijzigde woorden zijn gemarkeerd.`),
      h('colgroup', null, h('col', { class: 'nr' }), h('col'), h('col', { class: 'nr' }), h('col')),
      h('thead', null, h('tr', null,
        h('th', { scope: 'col', colspan: 2 }, `Oud (${kort(pr.basisSha)})`),
        h('th', { scope: 'col', colspan: 2 }, `Nieuw (${kort(pr.kopSha)})`),
      )),
      tbody,
    ));
}

/** Een veld uit de frontmatter. @param {string} tekst @param {string} veld */
function veld(tekst, veld) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(tekst.replace(/\r\n/g, '\n'));
  const m = fm && new RegExp(`^${veld}:\\s*(.*)$`, 'm').exec(fm[1]);
  return m ? m[1].trim().replace(/^"|"$/g, '') : '';
}

/** Samenvatting boven het verschil van een inhoudstekst. @param {any} b @param {string} idv */
function inhoudSamenvatting(b, idv) {
  const delen = [];
  const statusOud = veld(b.oud, 'status'), statusNieuw = veld(b.nieuw, 'status');
  if (statusOud !== statusNieuw) {
    delen.push(h('p', null, h('strong', null, 'Status: '), `${statusOud || '(geen)'} wordt ${statusNieuw || '(geen)'}`,
      statusNieuw === 'nagekeken' || statusNieuw === 'officieel'
        ? [' · nagekeken door: ', veld(b.nieuw, 'nagekeken_door') || h('span', { class: 'waarschuwing-tekst' }, 'niet vermeld')]
        : null));
  }
  const doseringen = doseringenUit(b.nieuw);
  if (doseringen.length) {
    delen.push(h('p', { class: 'waarschuwing-tekst' }, 'Mogelijke doseringen (niet toegelaten): ',
      doseringen.map((d, i) => [i ? ', ' : '', h('a', { href: `#${idv}-${d.regel}` }, `regel ${d.regel}: ${d.tekst}`)])));
  }
  const g = getallenVerschil(b.oud, b.nieuw);
  if (g.weg.length || g.bij.length) {
    delen.push(h('p', null, h('strong', null, 'Getallen en nummers: '),
      g.bij.length ? ['nieuw ', h('span', { class: 'mono' }, g.bij.join(', '))] : null,
      g.bij.length && g.weg.length ? '; ' : null,
      g.weg.length ? ['verdwenen ', h('span', { class: 'mono' }, g.weg.join(', '))] : null));
  }
  const br = bronnenVerschil(b.oud, b.nieuw);
  if (br.bij.length || br.weg.length) {
    delen.push(h('p', null, h('strong', null, 'Bronnen: '), `${br.bij.length} nieuw, ${br.weg.length} verdwenen (details hierboven).`));
  }
  return delen.length ? h('div', { class: 'samenvatting' }, delen) : null;
}

/* ---------- Uitgelicht: noodnummers, bronnen, register ---------- */

/** @param {any} v */
const toonWaarde = (v) => (v === undefined || v === null ? '(leeg)' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/**
 * Tabel van records die bij kwamen, verdwenen of wijzigden.
 * @param {string} titel @param {any} v @param {(r: any) => string} naam @param {string[]} kolommen
 */
function recordTabel(titel, v, naam, kolommen) {
  if (!v || (!v.bij.length && !v.weg.length && !v.anders.length)) return null;
  const rijen = [
    ...v.bij.map((/** @type {any} */ r) => h('tr', null, h('th', { scope: 'row' }, naam(r)), h('td', null, h('span', { class: 'status status-ok' }, 'nieuw')),
      h('td', null, h('ul', { class: 'lijstje' }, kolommen.filter((k) => r[k] !== undefined).map((k) => h('li', null, `${k}: `, bronOfTekst(r[k]))))))),
    ...v.anders.map((/** @type {any} */ a) => h('tr', null, h('th', { scope: 'row' }, naam(a.nieuw)), h('td', null, h('span', { class: 'status status-bezig' }, 'gewijzigd')),
      h('td', null, h('ul', { class: 'lijstje' }, a.velden.map((/** @type {any} */ f) => h('li', null, `${f.veld}: `,
        h('del', null, toonWaarde(f.oud)), ' wordt ', h('ins', null, toonWaarde(f.nieuw)))))))),
    ...v.weg.map((/** @type {any} */ r) => h('tr', null, h('th', { scope: 'row' }, naam(r)), h('td', null, h('span', { class: 'status status-fout' }, 'verwijderd')), h('td', null, ''))),
  ];
  return [h('h3', null, titel), h('div', { class: 'tabel-regio', role: 'region', 'aria-label': titel, tabindex: 0 },
    h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Wat'), h('th', { scope: 'col' }, 'Wijziging'), h('th', { scope: 'col' }, 'Velden'))), h('tbody', null, rijen)))];
}

/** Een URL als link (alleen http/https), anders tekst. @param {any} w */
function bronOfTekst(w) {
  const s = toonWaarde(w);
  return /^https?:\/\//.test(s) ? h('a', { href: s, rel: 'noopener noreferrer', target: '_blank', class: 'mono' }, s) : s;
}

/**
 * @param {any[]} geladen bestanden met oud en nieuw
 * @param {{ id: string, url: string, licentie?: string, toestemming?: string }[]} register register na de wijziging
 */
function uitgelicht(geladen, register) {
  const sectie = $('[data-uitgelicht]');
  const delen = [];

  // Noodnummers en kanalen.
  for (const b of geladen.filter((x) => x.landinfo)) {
    const v = landVerschil(b.oud, b.nieuw);
    if ('fout' in v) { delen.push(h('p', { class: 'melding gevaar' }, `${b.pad}: ${v.fout}`)); continue; }
    const land = b.pad.match(/([a-z]{2})\.json$/)?.[1]?.toUpperCase();
    delen.push(recordTabel(`Noodnummers ${land}`, v.noodnummers, (r) => r.nummer, ['wat', 'dringend', 'bron']));
    delen.push(recordTabel(`Informatiekanalen ${land}`, v.kanalen, (r) => r.naam, ['soort', 'wat', 'url', 'bron']));
    if (v.blokken?.length) {
      delen.push(h('h3', null, `Andere landinfo ${land}`), h('ul', { class: 'lijstje' }, v.blokken.map((x) => h('li', null, h('strong', null, x.blok), ' gewijzigd (zie het verschil hieronder)'))));
    }
  }

  // Bronnen in de teksten, met of ze in het register staan.
  const inRegister = new Map(register.map((r) => [urlSleutel(r.url), r]));
  const domein = (/** @type {string} */ u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const domeinen = new Set(register.map((r) => domein(r.url)));
  const bij = [], weg = [];
  for (const b of geladen.filter((x) => x.inhoud)) {
    const v = bronnenVerschil(b.oud, b.nieuw);
    bij.push(...v.bij.map((x) => ({ ...x, pad: b.pad })));
    weg.push(...v.weg.map((x) => ({ ...x, pad: b.pad })));
  }
  if (bij.length || weg.length) {
    delen.push(h('h3', null, 'Bronnen in de tekst'),
      h('div', { class: 'tabel-regio', role: 'region', 'aria-label': 'Bronnen in de tekst', tabindex: 0 }, h('table', null,
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Bron'), h('th', { scope: 'col' }, 'Wijziging'), h('th', { scope: 'col' }, 'Bronnenregister'), h('th', { scope: 'col' }, 'Bestand'))),
        h('tbody', null,
          ...bij.map((x) => {
            const r = inRegister.get(urlSleutel(x.url));
            const reg = r ? h('span', { class: 'status status-ok' }, `in register: ${r.id}`)
              : domeinen.has(domein(x.url)) ? h('span', { class: 'status status-bezig' }, 'domein bekend, pagina niet')
              : h('span', { class: 'status status-fout' }, 'niet in register');
            return h('tr', null, h('th', { scope: 'row' }, x.naam || '', h('div', null, bronOfTekst(x.url))), h('td', null, 'nieuw'), h('td', null, reg, r ? h('div', { class: 'klein' }, `${r.licentie || 'licentie onbekend'} · ${r.toestemming || 'toestemming onbekend'}`) : null), h('td', { class: 'mono' }, x.pad));
          }),
          ...weg.map((x) => h('tr', null, h('th', { scope: 'row' }, x.naam || '', h('div', null, bronOfTekst(x.url))), h('td', null, 'verdwenen'), h('td', null, ''), h('td', { class: 'mono' }, x.pad))),
        ))));
  }

  // Bronnenregister.
  for (const b of geladen.filter((x) => x.register)) {
    const v = registerVerschil(b.oud, b.nieuw);
    if ('fout' in v) { delen.push(h('p', { class: 'melding gevaar' }, v.fout)); continue; }
    if (v.bij.length) {
      delen.push(h('h3', null, `Nieuw in het bronnenregister (${v.bij.length})`),
        h('div', { class: 'tabel-regio', role: 'region', 'aria-label': 'Nieuw in het bronnenregister', tabindex: 0 }, h('table', null,
          h('thead', null, h('tr', null, ['Bron', 'Eigenaar', 'Licentie', 'Toestemming', 'Gebruikt in'].map((k) => h('th', { scope: 'col' }, k)))),
          h('tbody', null, v.bij.map((/** @type {any} */ r) => h('tr', null,
            h('th', { scope: 'row' }, h('span', { class: 'mono' }, r.id), h('div', null, r.naam), h('div', null, bronOfTekst(r.url))),
            h('td', null, r.eigenaar || ''),
            h('td', null, r.licentie || h('span', { class: 'waarschuwing-tekst' }, 'niet vermeld'), r.licentie_kenmerk ? h('div', { class: 'klein' }, r.licentie_kenmerk) : null),
            h('td', null, h('span', { class: `status status-${r.toestemming === 'vrij' || r.toestemming === 'gekregen' ? 'ok' : 'bezig'}` }, r.toestemming || 'niet vermeld'), r.opmerking ? h('div', { class: 'klein' }, r.opmerking) : null),
            h('td', null, (r.gebruikt_in || []).join(', ')),
          ))),
        )));
    }
    delen.push(recordTabel('Gewijzigd of verwijderd in het bronnenregister', { bij: [], anders: v.anders, weg: v.weg }, (r) => r.id, []));
  }

  const inhoud = delen.flat().filter(Boolean);
  if (!inhoud.length) { sectie.hidden = true; return; }
  sectie.hidden = false;
  vervang(/** @type {HTMLElement} */ (sectie.querySelector('[data-uitgelicht-inhoud]')), inhoud);
}

/* ---------- Bestanden laden ---------- */

/** Voer taken uit met hooguit `n` tegelijk. @template T @param {(() => Promise<T>)[]} taken @param {number} n */
async function beperkt(taken, n) {
  /** @type {T[]} */ const uit = new Array(taken.length);
  let volgende = 0;
  await Promise.all(Array.from({ length: Math.min(n, taken.length) }, async () => {
    while (volgende < taken.length) { const i = volgende++; uit[i] = await taken[i](); }
  }));
  return uit;
}

async function laadBestanden() {
  const doel = $('[data-bestanden]');
  const teTonen = pr.bestanden.filter((/** @type {any} */ b) => b.inhoud || b.landinfo || b.register);
  const gekozen = teTonen.slice(0, MAX_BESTANDEN);
  if (!gekozen.length) {
    vervang(doel, h('p', { class: 'dempen' }, 'Deze pull request wijzigt geen inhoudsteksten, landinfo of het bronnenregister.'));
    $('[data-uitgelicht]').hidden = true;
    return;
  }
  vervang(doel, h('p', { class: 'dempen' }, `${gekozen.length} bestand(en) laden…`));
  const geladen = await beperkt(gekozen.map((/** @type {any} */ b) => async () => {
    const q = new URLSearchParams({ pad: b.pad, basis: pr.basisSha, kop: pr.kopSha, status: b.status });
    if (b.vorigPad) q.set('vorig', b.vorigPad);
    try {
      const r = await api(`pr/${pr.nummer}/bestand?${q}`);
      return { ...b, oud: r.oud, nieuw: r.nieuw };
    } catch (e) {
      return { ...b, fout: e instanceof Error ? e.message : String(e), oud: '', nieuw: '' };
    }
  }), GELIJKTIJDIG);

  vervang(doel, geladen.map((b, i) => {
    const idv = `b${i}`;
    return h('article', { class: 'bestand', id: `bestand-${i}`, dataset: { pad: b.pad } },
      h('header', null,
        h('h3', null, b.pad),
        labelEl(b.label),
        h('span', { class: 'klein' }, /** @type {Record<string, string>} */ ({ added: 'nieuw bestand', removed: 'verwijderd', renamed: `hernoemd van ${b.vorigPad}`, modified: 'gewijzigd' })[b.status] || b.status, ` · +${b.bij} −${b.weg}`),
      ),
      b.fout ? h('p', { class: 'melding gevaar', style: 'margin: 10px 14px' }, b.fout) : [
        b.inhoud ? inhoudSamenvatting(b, idv) : null,
        verschilTabel(b.oud, b.nieuw, b.pad, idv),
      ],
    );
  }), teTonen.length > gekozen.length ? h('p', { class: 'melding' }, `Nog ${teTonen.length - gekozen.length} bestand(en): bekijk ze op GitHub.`) : null);

  // Het register na de wijziging: uit de PR als die het register wijzigt, anders van de kop van de PR.
  const reg = geladen.find((b) => b.register && !b.fout);
  /** @type {any[]} */ let register = [];
  try {
    if (reg) {
      const lijst = JSON.parse(reg.nieuw || '[]');
      register = Array.isArray(lijst) ? lijst : lijst.bronnen || [];
    } else if (geladen.some((b) => b.inhoud)) {
      register = (await api(`register?ref=${pr.kopSha}`)).bronnen;
    }
  } catch { /* het register is hulp bij het lezen; zonder blijft de rest bruikbaar */ }
  uitgelicht(geladen.filter((b) => !b.fout), register);
  pr.geladen = geladen;
}

/* ---------- Claude ---------- */

const ERNST_VOLGORDE = { hoog: 0, middel: 1, laag: 2 };

/** Link naar de regel in het verschil, als die op deze pagina staat. @param {any} b */
function plekLink(b) {
  if (!b.bestand) return null;
  const tekst = b.regel ? `${b.bestand}:${b.regel}` : b.bestand;
  const i = (pr.geladen || []).findIndex((/** @type {any} */ g) => g.pad === b.bestand);
  if (i < 0) return h('span', { class: 'mono' }, tekst);
  const doel = b.regel && document.getElementById(`b${i}-${b.regel}`) ? `#b${i}-${b.regel}` : `#bestand-${i}`;
  return h('a', { href: doel, class: 'mono' }, tekst);
}

/** @param {any} uit */
function toonClaude(uit) {
  const r = uit.resultaat;
  const bevindingen = [...r.bevindingen].sort((/** @type {any} */ a, /** @type {any} */ b) => ERNST_VOLGORDE[/** @type {'hoog'} */ (a.ernst)] - ERNST_VOLGORDE[/** @type {'hoog'} */ (b.ernst)]);
  const telling = ['hoog', 'middel', 'laag'].map((e) => `${bevindingen.filter((b) => b.ernst === e).length} ${e}`).join(', ');
  const plaats = h('button', { type: 'button', class: 'knop' }, 'Plaatsen als commentaar op de pull request');
  plaats.addEventListener('click', () => bezig(/** @type {HTMLButtonElement} */ (plaats), async () => {
    const res = await api(`pr/${pr.nummer}/claude/plaatsen`, { method: 'POST', body: { resultaatTekst: uit.resultaatTekst, kopSha: uit.kopSha, model: uit.model, tijd: uit.tijd, handtekening: uit.handtekening } });
    await herlaadTijdlijn();
    return h('span', null, 'Geplaatst als commentaar, gemarkeerd als hulp van Claude. ', h('a', { href: res.url, rel: 'noopener' }, 'Bekijk op GitHub'));
  }));
  vervang($('[data-claude-resultaat]'),
    h('h3', null, `Oordeel van Claude: ${r.oordeel}`),
    h('p', null, r.samenvatting),
    h('p', { class: 'klein' }, `${bevindingen.length} bevinding(en): ${telling}. Commit ${kort(uit.kopSha)}${uit.kopSha !== pr.kopSha ? ' (intussen zijn er nieuwe commits)' : ''}.`),
    bevindingen.length ? h('ol', { class: 'bevindingen' }, bevindingen.map((b) => h('li', { class: `bevinding ${b.ernst}` },
      h('div', { class: 'kopregel' }, h('span', { class: 'ernst' }, b.ernst), h('span', null, b.soort), plekLink(b)),
      b.citaat ? h('blockquote', null, b.citaat) : null,
      h('p', null, b.uitleg),
      b.voorstel ? h('p', null, h('strong', null, 'Voorstel: '), b.voorstel) : null,
      b.regelverwijzing ? h('p', { class: 'klein' }, 'Regel: ', b.regelverwijzing) : null,
      b.bron ? h('p', { class: 'klein' }, 'Bron: ', bronOfTekst(b.bron)) : null,
    ))) : h('p', null, 'Claude vond niets te melden. Dat is geen goedkeuring: kijk zelf na.'),
    r.niet_gecontroleerd?.length ? [h('h4', null, 'Niet gecontroleerd'), h('ul', { class: 'lijstje' }, r.niet_gecontroleerd.map((/** @type {string} */ n) => h('li', null, n)))] : null,
    h('details', null, h('summary', null, `Bronpagina's (${uit.bronnen.filter((/** @type {any} */ b) => b.gelukt).length} van ${uit.bronnen.length} geladen) en verbruik`),
      h('ul', { class: 'lijstje' }, uit.bronnen.map((/** @type {any} */ b) => h('li', null, bronOfTekst(b.url), ': ', b.gelukt ? (b.ingekort ? 'geladen, ingekort' : 'geladen') : h('span', { class: 'waarschuwing-tekst' }, `niet geladen (${b.reden})`)))),
      uit.nietMeegestuurd?.length ? h('p', { class: 'klein' }, 'Niet meegestuurd: ', uit.nietMeegestuurd.join(', ')) : null,
      h('p', { class: 'klein' }, `Model ${uit.model}, ${uit.seconden} s. Tokens: ${uit.gebruik.invoer} invoer, ${uit.gebruik.cacheGelezen} uit cache, ${uit.gebruik.uitvoer} uitvoer.`),
    ),
    h('div', { class: 'knoppen' }, plaats),
    h('p', { class: 'hulptekst' }, 'Het commentaar vermeldt dat het hulp van Claude is, door wie het opgevraagd werd en dat het niet telt als goedkeuring.'),
  );
}

function claudeSectie() {
  const sectie = $('[data-claude]');
  if (!pr.claude) {
    vervang(/** @type {HTMLElement} */ (sectie.querySelector('.knoppen')), h('p', { class: 'melding waarschuwing' }, 'Het nazicht door Claude is niet ingesteld: de Worker mist ANTHROPIC_API_KEY (zie docs/beheer.md).'));
    return;
  }
  const knop = /** @type {HTMLButtonElement} */ (sectie.querySelector('[data-claude-knop]'));
  const voortgang = $('[data-claude-voortgang]');
  knop.addEventListener('click', async () => {
    knop.disabled = true;
    knop.setAttribute('aria-busy', 'true');
    vervang(voortgang);
    vervang($('[data-claude-resultaat]'));
    wisMelding();
    try {
      await apiStroom(`pr/${pr.nummer}/claude`, {}, (regel) => {
        if (regel.stap) voortgang.append(h('li', null, regel.stap));
        if (regel.fout) meld(`Nazicht door Claude mislukt: ${regel.fout}`, 'gevaar');
        if (regel.klaar) { voortgang.append(h('li', null, `Klaar na ${regel.seconden} s.`)); toonClaude(regel); }
      });
    } catch (e) {
      meld(`Nazicht door Claude mislukt: ${e instanceof Error ? e.message : e}`, 'gevaar');
    } finally {
      knop.disabled = false;
      knop.removeAttribute('aria-busy');
    }
  });
}

/* ---------- Tijdlijn, beoordeling, samenvoegen ---------- */

function tijdlijn() {
  const items = [
    ...pr.reviews.map((/** @type {any} */ r) => ({ ...r, soort: 'review' })),
    ...pr.reacties.map((/** @type {any} */ r) => ({ ...r, soort: 'reactie' })),
  ].filter((x) => x.soort === 'reactie' || x.tekst || x.state !== 'COMMENTED').sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  if (!items.length) return h('p', { class: 'dempen' }, 'Nog geen reviews of reacties.');
  return h('ol', { class: 'tijdlijn' }, items.map((x) => {
    const tekst = h('div', { class: 'tekst' });
    if (x.tekst || x.tekstHtml) toonGitHubHtml(tekst, x.tekstHtml, x.tekst);
    return h('li', null,
      h('p', { class: 'wie' }, h('strong', null, x.login), ' ',
        x.soort === 'review' ? h('span', { class: `status status-${x.state === 'APPROVED' ? 'ok' : x.state === 'CHANGES_REQUESTED' ? 'fout' : 'neutraal'}` }, STAAT[/** @type {'APPROVED'} */ (x.state)] || x.state) : 'reageerde',
        ' · ', tijd(x.datum), x.url ? [' · ', h('a', { href: x.url, rel: 'noopener' }, 'op GitHub')] : null),
      x.tekst || x.tekstHtml ? tekst : null);
  }));
}

async function herlaadTijdlijn() {
  pr = { ...pr, ...(await api(`pr/${pr.nummer}`)), geladen: pr.geladen };
  vervang($('[data-tijdlijn]'), tijdlijn());
  vervang($('[data-kern]'), kern());
  samenvoegenSectie();
}

/** Kerngegevens: soort, goedkeuringen, controles, samenvoegen. */
function kern() {
  const g = pr.goedkeuringen;
  return h('dl', { class: 'kern' },
    h('div', null, h('dt', null, 'Soort'), h('dd', null, h('div', { class: 'labels' }, (pr.soorten.length ? pr.soorten : ['overig']).map(labelEl))),
      pr.labels.length ? h('dd', { class: 'klein' }, 'Labels op GitHub: ', pr.labels.join(', ')) : null),
    h('div', null, h('dt', null, 'Goedkeuringen'), h('dd', null, goedkeuringLabel(g.aantal, pr.nodig), pr.kritiek ? ' · inhoud die levens raakt' : ''),
      Object.keys(g.perNalezer).length ? h('dd', null, h('ul', null, Object.entries(g.perNalezer).map(([l, s]) => h('li', null, `${l}: ${STAAT[/** @type {'APPROVED'} */ (s)] || s}`)))) : null,
      g.verouderd?.length ? h('dd', { class: 'klein waarschuwing-tekst' }, `Telt niet, gegeven op een oudere commit: ${g.verouderd.join(', ')}.`) : null,
      g.zonderRechten?.length ? h('dd', { class: 'klein waarschuwing-tekst' }, `Telt niet, geen schrijfrechten: ${g.zonderRechten.join(', ')}.`) : null,
      h('dd', { class: 'klein' }, 'Telt de laatste review per nalezer, alleen van medewerkers en op de laatste commit. De auteur telt niet.')),
    h('div', null, h('dt', null, 'Controles'), h('dd', null, h('div', { class: 'statussen' }, pr.controles.map(controleLabel)))),
    h('div', null, h('dt', null, 'Samenvoegen'), h('dd', null, pr.regels.mag ? h('span', { class: 'status status-ok' }, 'kan') : h('span', { class: 'status status-bezig' }, 'nog niet')),
      pr.regels.redenen.length ? h('dd', null, h('ul', null, pr.regels.redenen.map((/** @type {string} */ r) => h('li', null, r)))) : null),
  );
}

function beoordelingSectie() {
  const sectie = $('[data-beoordeling]');
  const auteur = pr.auteur === pr.ik;
  const veld = h('textarea', { id: 'beoordeling-tekst', 'aria-describedby': 'beoordeling-hulp' });
  const goed = h('button', { type: 'button', class: 'knop hoofd', disabled: auteur || pr.concept }, 'Goedkeuren');
  const anders = h('button', { type: 'button', class: 'knop gevaar', disabled: auteur }, 'Wijzigingen vragen');
  const reageer = h('button', { type: 'button', class: 'knop' }, 'Alleen reageren');
  vervang(sectie,
    h('h2', { id: 'kop-beoordeling' }, 'Jouw beoordeling'),
    auteur ? h('p', { class: 'melding waarschuwing' }, 'Je bent de auteur van deze pull request. Je kunt reageren, maar je telt niet als nalezer.') : null,
    pr.concept && !auteur ? h('p', { class: 'melding waarschuwing' }, 'Deze pull request is nog een concept. Goedkeuren kan pas als de auteur ze klaar zet.') : null,
    h('label', { for: 'beoordeling-tekst' }, 'Toelichting'),
    h('p', { class: 'hulptekst', id: 'beoordeling-hulp' }, 'Verplicht bij "Wijzigingen vragen". Een reactie is gewoon commentaar en verandert de telling van goedkeuringen niet.'),
    veld,
    h('div', { class: 'knoppen' }, goed, anders, reageer),
  );
  const tekst = () => /** @type {HTMLTextAreaElement} */ (veld).value.trim();

  goed.addEventListener('click', async () => {
    const vinkjes = pr.kritiek ? [
      'Ik heb elke inhoudelijke bewering vergeleken met de vermelde bron.',
      'Getallen, telefoonnummers, frequenties en eenheden zijn gelijk aan de bron.',
      'Er staan geen doseringen van geneesmiddelen in.',
      'Ik weet welke vakkennis docs/nazicht.md voor deze soort vraagt, en of ik of de andere nalezer die heeft.',
    ] : [];
    const ok = await bevestig({
      titel: `Pull request #${pr.nummer} goedkeuren`,
      knop: 'Goedkeuren',
      inhoud: [
        h('p', null, `Je keurt commit ${kort(pr.kopSha)} goed als ${pr.ik}. Dit telt als ${pr.kritiek ? 'een van de twee' : 'de'} vereiste goedkeuring(en).`),
        vinkjes.length ? h('fieldset', null, h('legend', null, 'Inhoud die levens raakt'),
          vinkjes.map((v, i) => h('label', { class: 'vinkregel' }, h('input', { type: 'checkbox', required: true, id: `vink-${i}` }), v))) : null,
        h('p', { class: 'hulptekst' }, 'Een beoordeling door Claude telt nooit als goedkeuring.'),
      ],
    });
    if (!ok) return;
    const gelukt = await bezig(/** @type {HTMLButtonElement} */ (goed), async () => {
      await api(`pr/${pr.nummer}/review`, { method: 'POST', body: { soort: 'goedkeuren', tekst: tekst(), kopSha: pr.kopSha } });
      return 'Goedgekeurd. De controle "inhoud" telt opnieuw; dat kan een minuut duren.';
    });
    if (gelukt) { /** @type {HTMLTextAreaElement} */ (veld).value = ''; await herlaadTijdlijn(); }
  });

  anders.addEventListener('click', async () => {
    if (!tekst()) { meld('Schrijf in de toelichting wat er moet veranderen.', 'gevaar'); veld.focus(); return; }
    const gelukt = await bezig(/** @type {HTMLButtonElement} */ (anders), async () => {
      await api(`pr/${pr.nummer}/review`, { method: 'POST', body: { soort: 'wijzigingen', tekst: tekst(), kopSha: pr.kopSha } });
      return 'Wijzigingen gevraagd.';
    });
    if (gelukt) { /** @type {HTMLTextAreaElement} */ (veld).value = ''; await herlaadTijdlijn(); }
  });

  reageer.addEventListener('click', async () => {
    if (!tekst()) { meld('Schrijf eerst een reactie.', 'gevaar'); veld.focus(); return; }
    const gelukt = await bezig(/** @type {HTMLButtonElement} */ (reageer), async () => {
      const r = await api(`pr/${pr.nummer}/commentaar`, { method: 'POST', body: { tekst: tekst() } });
      return h('span', null, 'Reactie geplaatst. ', h('a', { href: r.url, rel: 'noopener' }, 'Bekijk op GitHub'));
    });
    if (gelukt) { /** @type {HTMLTextAreaElement} */ (veld).value = ''; await herlaadTijdlijn(); }
  });
}

function samenvoegenSectie() {
  const sectie = $('[data-samenvoegen]');
  if (pr.staat !== 'OPEN') {
    vervang(sectie, h('h2', null, 'Samenvoegen'), h('p', null, pr.staat === 'MERGED' ? 'Deze pull request is samengevoegd.' : 'Deze pull request is gesloten.'));
    return;
  }
  const toegelaten = pr.methodes ? ['merge', 'squash', 'rebase'].filter((m) => pr.methodes[m]) : ['merge', 'squash', 'rebase'];
  const namen = { merge: 'Samenvoegcommit', squash: 'Samenpersen tot één commit', rebase: 'Rebasen' };
  const keuze = h('select', { id: 'samenvoeg-wijze' }, toegelaten.map((m) => h('option', { value: m }, namen[/** @type {'merge'} */ (m)])));
  const knop = h('button', { type: 'button', class: 'knop hoofd', disabled: !pr.regels.mag, 'aria-describedby': 'samenvoeg-uitleg' }, 'Samenvoegen');
  vervang(sectie,
    h('h2', null, 'Samenvoegen'),
    h('p', { id: 'samenvoeg-uitleg', class: 'hulptekst' }, pr.regels.mag
      ? `Alle regels zijn voldaan: ${pr.goedkeuringen.aantal} van ${pr.nodig} goedkeuringen, controles in orde. GitHub past daarbovenop de branch protection toe.`
      : 'Samenvoegen kan pas als alle regels voldaan zijn: ' + pr.regels.redenen.join(' ')),
    h('label', { for: 'samenvoeg-wijze' }, 'Manier'),
    keuze,
    h('div', { class: 'knoppen' }, knop),
  );
  knop.addEventListener('click', async () => {
    const wijze = /** @type {HTMLSelectElement} */ (keuze).value;
    const ok = await bevestig({
      titel: `Pull request #${pr.nummer} samenvoegen`,
      gevaar: true,
      knop: 'Samenvoegen',
      inhoud: h('p', null, `"${pr.titel}" wordt samengevoegd in ${pr.basis} (${namen[/** @type {'merge'} */ (wijze)]}), onder jouw account. Dit kan je niet ongedaan maken zonder een nieuwe pull request.`),
    });
    if (!ok) return;
    const gelukt = await bezig(/** @type {HTMLButtonElement} */ (knop), async () => {
      const r = await api(`pr/${pr.nummer}/samenvoegen`, { method: 'POST', body: { methode: wijze, kopSha: pr.kopSha } });
      return `Samengevoegd (${kort(r.sha)}).`;
    });
    if (gelukt) await herlaadTijdlijn();
  });
}

/* ---------- Pagina ---------- */

function teken() {
  document.title = `#${pr.nummer} ${pr.titel} · Beheer · PlanB72`;
  const beschrijving = h('div', { class: 'tekst' });
  toonGitHubHtml(beschrijving, pr.tekstHtml, pr.tekst);
  const andere = pr.bestanden.filter((/** @type {any} */ b) => !(b.inhoud || b.landinfo || b.register));
  const container = $('[data-pr]');
  vervang(container,
    h('h1', null, pr.titel, ' ', h('span', { class: 'dempen' }, `#${pr.nummer}`)),
    h('p', { class: 'metaregel' },
      pr.staat === 'OPEN' ? (pr.concept ? 'Concept' : 'Open') : pr.staat === 'MERGED' ? 'Samengevoegd' : 'Gesloten',
      ` · door ${pr.auteur} · `, h('code', null, pr.kop), ' naar ', h('code', null, pr.basis),
      ` · aangemaakt ${datum(pr.aangemaakt)} · `, h('a', { href: pr.url, rel: 'noopener' }, 'Op GitHub'),
      ' · ', h('button', { type: 'button', class: 'themaknop', onclick: () => location.reload() }, 'Opnieuw laden')),
    h('div', { 'data-kern': '' }, kern()),
    h('section', { 'aria-labelledby': 'kop-beschrijving' }, h('h2', { id: 'kop-beschrijving' }, 'Beschrijving'), beschrijving),
    h('section', { 'aria-labelledby': 'kop-uitgelicht', 'data-uitgelicht': '', hidden: true },
      h('h2', { id: 'kop-uitgelicht' }, 'Noodnummers, bronnen en register'),
      h('p', { class: 'hulptekst' }, 'Wat in deze wijziging aan noodnummers, kanalen en bronnen verandert, apart gezet om het makkelijk na te gaan.'),
      h('div', { 'data-uitgelicht-inhoud': '' })),
    h('section', { 'aria-labelledby': 'kop-inhoud' },
      h('h2', { id: 'kop-inhoud' }, 'Inhoud: oud en nieuw'),
      h('div', { 'data-bestanden': '' })),
    andere.length ? h('section', { 'aria-labelledby': 'kop-andere' },
      h('h2', { id: 'kop-andere' }, `Andere bestanden (${andere.length})`),
      h('ul', { class: 'lijstje' }, andere.map((/** @type {any} */ b) => h('li', null,
        h('span', { class: 'mono' }, b.pad), ' ', labelEl(b.label), h('span', { class: 'klein' }, ` ${b.status}, +${b.bij} −${b.weg}`),
        b.patch ? h('details', null, h('summary', null, 'Verschil'), h('pre', { class: 'patch' }, b.patch)) : null)))) : null,
    pr.bestandenTotaal >= 300 ? h('p', { class: 'melding' }, 'GitHub toont hier hooguit 300 bestanden; bekijk de rest op GitHub.') : null,
    h('section', { class: 'claude', 'aria-labelledby': 'kop-claude', 'data-claude': '' },
      h('h2', { id: 'kop-claude' }, 'Laat Claude nakijken'),
      h('p', null, 'Claude vergelijkt de wijziging met de schrijfwijzer, de nazichtregels en de bronpagina\'s (die worden opgehaald en meegestuurd): bronnen, doseringen, getallen, telefoonnummers en frequenties, het Belgische advies en de toon. Dat duurt meestal één tot drie minuten.'),
      h('p', { class: 'hulptekst' }, 'Dit is hulp bij het nazicht. Het telt nooit als goedkeuring. De wijziging en de bronpagina\'s gaan daarvoor naar de Anthropic API.'),
      h('div', { class: 'knoppen' }, h('button', { type: 'button', class: 'knop hoofd', 'data-claude-knop': '' }, 'Laat Claude nakijken')),
      h('ul', { class: 'voortgang', 'data-claude-voortgang': '', 'aria-live': 'polite' }),
      h('div', { 'data-claude-resultaat': '' })),
    h('section', { 'aria-labelledby': 'kop-tijdlijn' }, h('h2', { id: 'kop-tijdlijn' }, 'Reviews en reacties'), h('div', { 'data-tijdlijn': '' }, tijdlijn())),
    h('section', { class: 'actie', 'aria-labelledby': 'kop-beoordeling', 'data-beoordeling': '' }),
    h('section', { class: 'actie', 'data-samenvoegen': '' }),
  );
  container.removeAttribute('aria-busy');
  claudeSectie();
  beoordelingSectie();
  samenvoegenSectie();
}

async function laad() {
  const status = await start();
  const container = $('[data-pr]');
  if (!status.gebruiker || status.ontbreekt.length) { vervang(container); container.removeAttribute('aria-busy'); return; }
  if (!nummer) { vervang(container, h('p', { class: 'melding gevaar' }, 'Geen nummer van een pull request in het adres (?nr=).')); return; }
  try {
    pr = await api(`pr/${nummer}`);
  } catch (e) {
    vervang(container, h('p', { class: 'melding gevaar' }, e instanceof Error ? e.message : String(e)));
    container.removeAttribute('aria-busy');
    return;
  }
  teken();
  await laadBestanden();
}

laad().catch((e) => meld(e instanceof Error ? e.message : String(e), 'gevaar'));
