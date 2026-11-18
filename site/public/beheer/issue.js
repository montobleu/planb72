// @ts-check
// Beheer: één issue behandelen (/beheer/issue/?nr=5). Toont de melding met de ingevulde velden,
// vergelijkt een voorgestelde bron met het bronnenregister en biedt de acties: labels, toewijzen,
// reageren, omzetten naar een taak, sluiten of heropenen. Alles via de Worker onder het eigen
// GitHub-account. De DOM wordt alleen met h() en vervang() opgebouwd: de pagina dwingt Trusted Types af.

import { h, vervang, api, start, meld, bevestig, bezig, toonGitHubHtml, tijd, labelEl, nummerUitAdres } from './gemeen.js';

/**
 * @typedef {{ login: string, datum: string, tekst: string, tekstHtml: string, url: string }} Reactie
 * @typedef {{
 *   nummer: number, titel: string, url: string, staat: 'OPEN' | 'CLOSED', reden: string | null,
 *   auteur: string, aangemaakt: string, tekst: string, tekstHtml: string, labels: string[],
 *   soort: string, toegewezen: string[], reacties: Reactie[],
 *   alleLabels: { name: string, description: string | null }[],
 *   toewijsbaar: { login: string, name: string | null }[], ik: string
 * }} Issue
 * @typedef {{ id: string, naam: string, url: string, licentie: string, toestemming: string }} Bron
 */

const container = /** @type {HTMLElement} */ (document.querySelector('[data-issue]'));
const nummer = nummerUitAdres();

/** Bronnenregister: één keer ophalen per pagina. @type {Promise<Bron[]> | null} */
let registerBelofte = null;

const REDEN = /** @type {Record<string, string>} */ ({
  COMPLETED: 'opgelost of verwerkt',
  NOT_PLANNED: 'niet gepland',
  DUPLICATE: 'dubbel',
  REOPENED: 'heropend',
});

const SLUITREDENEN = [
  { waarde: 'completed', tekst: 'Opgelost of verwerkt' },
  { waarde: 'not_planned', tekst: 'Niet gepland' },
  { waarde: 'duplicate', tekst: 'Dubbel' },
];

const STAPPEN = /** @type {Record<string, string[]>} */ ({
  'fout melden': [
    'Officiële bron openen en de melding nagaan',
    'Tekst aanpassen in een pull request, met de bron erbij',
    'Twee nalezers vragen als het inhoud is die levens raakt (docs/nazicht.md)',
  ],
  'bron voorstellen': [
    'Licentie en gebruiksvoorwaarden nagaan',
    'Toestemming vragen als dat nodig is',
    'Bron toevoegen aan data/bronnen/register.json in een pull request',
  ],
});

/* ---------- Hulp ---------- */

/**
 * De body van een issue uit een GitHub-formulier: "### Label" gevolgd door de waarde.
 * Geeft null als er geen enkele kop in staat (vrij geschreven issue).
 * @param {string} tekst
 * @returns {{ label: string, waarde: string | null }[] | null}
 */
function leesVelden(tekst) {
  const regels = String(tekst || '').replace(/\r\n?/g, '\n').split('\n');
  /** @type {{ label: string, waarde: string | null }[]} */
  const velden = [];
  /** @type {{ label: string, regels: string[] } | null} */
  let huidig = null;
  const sluit = () => {
    if (!huidig) return;
    const waarde = huidig.regels.join('\n').trim();
    velden.push({ label: huidig.label, waarde: !waarde || waarde === '_No response_' ? null : waarde });
  };
  for (const regel of regels) {
    const m = /^###\s+(.+?)\s*$/.exec(regel);
    if (m) {
      sluit();
      huidig = { label: m[1], regels: [] };
    } else if (huidig) {
      huidig.regels.push(regel);
    }
  }
  sluit();
  return velden.length ? velden : null;
}

/**
 * Waarde van een formulierveld op label, hoofdletterongevoelig.
 * @param {{ label: string, waarde: string | null }[] | null} velden
 * @param {string} label
 */
function veld(velden, label) {
  const l = label.toLowerCase();
  return velden?.find((v) => v.label.toLowerCase() === l)?.waarde ?? null;
}

/**
 * Een adres als URL, alleen http(s). Zonder schema proberen we https://.
 * Een pad dat met één "/" begint, hoort bij deze site.
 * @param {string | null} tekst
 * @returns {URL | null}
 */
function alsUrl(tekst) {
  const s = String(tekst || '').trim().split(/\s+/)[0] || '';
  if (!s) return null;
  /** @type {URL | null} */
  let u = null;
  try {
    if (/^\/(?!\/)/.test(s)) u = new URL(s, location.origin);
    else if (/^[a-z][a-z0-9+.-]*:/i.test(s)) u = new URL(s);
    else u = new URL('https://' + s);
  } catch {
    return null;
  }
  return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
}

/** Vergelijkbare vorm: zonder schema, anker, www. en slash op het einde. @param {URL} u */
function vergelijkbaar(u) {
  return (domein(u) + (u.port ? ':' + u.port : '') + u.pathname.replace(/\/+$/, '') + u.search).toLowerCase();
}

/** @param {URL} u */
function domein(u) {
  return u.hostname.toLowerCase().replace(/^www\./, '');
}

/** Link naar buiten, of de tekst als het geen http(s)-adres is. @param {string | null} tekst */
function linkOfTekst(tekst) {
  if (!tekst) return h('span', { class: 'dempen' }, 'niet ingevuld');
  const u = alsUrl(tekst);
  return u ? h('a', { href: u.href, rel: 'noopener noreferrer', target: '_blank', class: 'mono' }, tekst.trim()) : h('span', { class: 'mono' }, tekst);
}

/** @param {string} id @param {string} tekst */
function kop2(id, tekst) {
  return h('h2', { id, tabindex: '-1' }, tekst);
}

/** @param {Issue} issue */
function redenTekst(issue) {
  if (issue.staat === 'OPEN') return 'open';
  const r = issue.reden && REDEN[issue.reden];
  return r ? `gesloten (${r})` : 'gesloten';
}

/* ---------- Laden ---------- */

/** @returns {Promise<Issue>} */
function haal() {
  return api(`issue/${nummer}`);
}

/**
 * Gegevens opnieuw ophalen en alles hertekenen. Daarna de focus op de kop van de sectie
 * waar de actie gebeurde, of op de titel als die sectie verdwenen is.
 * @param {string} [focusId]
 */
async function laad(focusId) {
  container.setAttribute('aria-busy', 'true');
  try {
    const issue = await haal();
    teken(issue);
    const doel = (focusId && document.getElementById(focusId)) || document.getElementById('issue-titel');
    if (focusId && doel) doel.focus();
  } finally {
    container.removeAttribute('aria-busy');
  }
}

/* ---------- Tekenen ---------- */

/** @param {Issue} issue */
function teken(issue) {
  document.title = `Issue #${issue.nummer}: ${issue.titel} · Beheer · PlanB72`;
  const velden = leesVelden(issue.tekst);
  const open = issue.staat === 'OPEN';

  vervang(container,
    h('h1', { id: 'issue-titel', tabindex: '-1' }, issue.titel),
    h('p', { class: 'metaregel' },
      `#${issue.nummer} · ${issue.soort} · door `, h('strong', null, issue.auteur || 'onbekend'), ' · ',
      tijd(issue.aangemaakt), ' · ', redenTekst(issue), ' · ',
      h('a', { href: issue.url, rel: 'noopener' }, 'Op GitHub'),
    ),
    kern(issue),
    melding(issue, velden),
    issue.soort === 'bron voorstellen' ? bronControle(velden) : null,
    issue.soort === 'fout melden' ? foutControle(velden) : null,
    reacties(issue),
    labelsActie(issue),
    toewijzenActie(issue),
    reagerenActie(issue),
    open && !issue.labels.includes('taak') ? taakActie(issue) : null,
    open ? sluitenActie(issue) : heropenenActie(issue),
  );
}

/** @param {Issue} issue */
function kern(issue) {
  return h('dl', { class: 'kern' },
    h('div', null, h('dt', null, 'Soort'), h('dd', null, issue.soort)),
    h('div', null, h('dt', null, 'Labels'), h('dd', null,
      issue.labels.length ? h('span', { class: 'labels' }, issue.labels.map(labelEl)) : h('span', { class: 'dempen' }, 'geen'))),
    h('div', null, h('dt', null, 'Toegewezen'), h('dd', null,
      issue.toegewezen.length ? issue.toegewezen.join(', ') : h('span', { class: 'dempen' }, 'niemand'))),
  );
}

/**
 * @param {Issue} issue
 * @param {{ label: string, waarde: string | null }[] | null} velden
 */
function melding(issue, velden) {
  const volledig = h('div', { class: 'tekst' });
  toonGitHubHtml(volledig, issue.tekstHtml, issue.tekst);
  return h('section', { 'aria-labelledby': 'kop-melding' },
    kop2('kop-melding', 'Ingevulde velden'),
    velden
      ? h('dl', { class: 'velden' }, velden.map((v) => [
        h('dt', null, v.label),
        h('dd', { class: v.waarde ? 'ruwe-tekst' : 'dempen' }, v.waarde ?? 'niet ingevuld'),
      ]))
      : h('p', { class: 'dempen' }, 'Dit issue komt niet uit een formulier. Lees de volledige tekst.'),
    h('details', { open: velden ? null : true },
      h('summary', null, 'Volledige tekst'),
      volledig,
    ),
  );
}

/** @param {{ label: string, waarde: string | null }[] | null} velden */
function bronControle(velden) {
  const adres = veld(velden, 'Adres van de bron');
  const uitkomst = h('div', { 'aria-live': 'polite' }, h('p', { class: 'dempen' }, 'Register laden…'));
  const sectie = h('section', { 'aria-labelledby': 'kop-register' },
    kop2('kop-register', 'Bron en register'),
    h('p', null, 'Voorgestelde bron: ', linkOfTekst(adres)),
    uitkomst,
    h('p', { class: 'hulptekst' },
      'Ga de licentie en de toestemming na voordat de bron in het register komt. Het register wijzig je in een pull request op ',
      h('code', null, 'data/bronnen/register.json'), '.'),
  );

  const u = alsUrl(adres);
  if (!u) {
    vervang(uitkomst, h('p', null, adres ? 'Het adres is geen geldig http- of https-adres; vergelijken met het register kan niet.' : 'Er is geen adres ingevuld.'));
    return sectie;
  }

  registerBelofte ||= api('register').then((r) => /** @type {Bron[]} */ (r.bronnen || []));
  registerBelofte.then((bronnen) => {
    /** @param {Bron} b */
    const beschrijf = (b) => [h('code', null, b.id), ` (${b.licentie || 'licentie onbekend'}, toestemming: ${b.toestemming || 'onbekend'})`];
    const metUrl = bronnen.map((b) => ({ b, u: alsUrl(b.url) })).filter((x) => x.u);
    const zelfde = metUrl.filter((x) => vergelijkbaar(/** @type {URL} */ (x.u)) === vergelijkbaar(u));
    if (zelfde.length) {
      vervang(uitkomst, h('p', null, h('span', { class: 'status status-bezig' }, 'Al in het register'), ' Staat al in het register als ',
        zelfde.map((x, i) => [i ? ' en ' : '', beschrijf(x.b)]), '.'));
      return;
    }
    const domeinen = metUrl.filter((x) => domein(/** @type {URL} */ (x.u)) === domein(u));
    if (domeinen.length) {
      vervang(uitkomst,
        h('p', null, h('span', { class: 'status status-bezig' }, 'Zelfde domein'), ` Zelfde domein (${domein(u)}) als:`),
        h('ul', { class: 'lijstje' }, domeinen.slice(0, 8).map((x) => h('li', null, beschrijf(x.b), ' ', linkOfTekst(x.b.url)))),
        domeinen.length > 8 ? h('p', { class: 'hulptekst' }, `En nog ${domeinen.length - 8} andere.`) : null,
      );
      return;
    }
    vervang(uitkomst, h('p', null, h('span', { class: 'status status-ok' }, 'Nieuw'), ' Nieuw: nog niet in het register.'));
  }).catch((e) => {
    registerBelofte = null;
    vervang(uitkomst, h('p', { class: 'waarschuwing-tekst' }, 'Het register kon niet geladen worden: ', e instanceof Error ? e.message : String(e)));
  });
  return sectie;
}

/** @param {{ label: string, waarde: string | null }[] | null} velden */
function foutControle(velden) {
  return h('section', { 'aria-labelledby': 'kop-nagaan' },
    kop2('kop-nagaan', 'Melding nagaan'),
    h('dl', { class: 'kern' },
      h('div', null, h('dt', null, 'Pagina'), h('dd', null, linkOfTekst(veld(velden, 'Pagina')))),
      h('div', null, h('dt', null, 'Officiële bron'), h('dd', null, linkOfTekst(veld(velden, 'Officiële bron')))),
    ),
    h('p', { class: 'hulptekst' },
      'Open de officiële bron en vergelijk ze met de pagina. Is de melding terecht, zet het issue dan om naar een taak. ',
      'Is ze dat niet, leg in een reactie uit waarom en sluit het issue als niet gepland.'),
  );
}

/** @param {Issue} issue */
function reacties(issue) {
  return h('section', { 'aria-labelledby': 'kop-reacties' },
    kop2('kop-reacties', `Reacties (${issue.reacties.length})`),
    issue.reacties.length
      ? h('ol', { class: 'tijdlijn' }, issue.reacties.map((r) => {
        const tekst = h('div', { class: 'tekst' });
        toonGitHubHtml(tekst, r.tekstHtml, r.tekst);
        return h('li', null,
          h('p', { class: 'wie' }, h('strong', null, r.login || 'onbekend'), ' · ', tijd(r.datum),
            r.url ? [' · ', h('a', { href: r.url, rel: 'noopener' }, 'Op GitHub')] : null),
          tekst,
        );
      }))
      : h('p', { class: 'dempen' }, 'Nog geen reacties.'),
  );
}

/* ---------- Acties ---------- */

/**
 * Een formulier waarvan de submit-knop via bezig() de actie uitvoert. `vooraf` (optioneel) loopt
 * eerst, buiten bezig(): geeft die false, dan gebeurt er niets (bijvoorbeeld een bevestiging).
 * @param {HTMLButtonElement} knop
 * @param {() => Promise<string | void>} actie
 * @param {(() => Promise<boolean>) | null} vooraf
 * @param {...any} inhoud
 */
function formulier(knop, actie, vooraf, ...inhoud) {
  const form = /** @type {HTMLFormElement} */ (h('form', null, ...inhoud));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (knop.disabled) return;
    if (vooraf && !(await vooraf())) return;
    await bezig(knop, actie);
  });
  return form;
}

/** @param {string} tekst @param {string} [klasse] */
function verzendknop(tekst, klasse = 'knop hoofd') {
  return /** @type {HTMLButtonElement} */ (h('button', { type: 'submit', class: klasse }, tekst));
}

/** @param {Issue} issue */
function labelsActie(issue) {
  // Labels die het issue heeft maar niet in de lijst staan (meer dan 100 labels) toch tonen.
  const alle = [...issue.alleLabels];
  for (const l of issue.labels) if (!alle.some((a) => a.name === l)) alle.push({ name: l, description: null });
  const knop = verzendknop('Labels opslaan');
  const vinkjes = alle.map((l, i) => {
    const id = `label-${i}`;
    const uitleg = l.description ? `label-${i}-uitleg` : null;
    return {
      naam: l.name,
      invoer: /** @type {HTMLInputElement} */ (h('input', { type: 'checkbox', id, value: l.name, checked: issue.labels.includes(l.name), 'aria-describedby': uitleg })),
      uitleg,
      beschrijving: l.description,
    };
  });
  return h('section', { class: 'actie', 'aria-labelledby': 'kop-labels' },
    kop2('kop-labels', 'Labels'),
    alle.length
      ? formulier(knop, async () => {
        const labels = vinkjes.filter((v) => v.invoer.checked).map((v) => v.naam);
        await api(`issue/${issue.nummer}/labels`, { method: 'POST', body: { labels } });
        await laad('kop-labels');
        return 'Labels opgeslagen.';
      }, null,
      h('fieldset', null,
        h('legend', null, 'Labels van dit issue'),
        h('ul', { class: 'vinkraster' }, vinkjes.map((v) => h('li', null,
          h('label', { for: v.invoer.id }, v.invoer, h('span', null, v.naam)),
          v.uitleg ? h('p', { class: 'hulptekst', id: v.uitleg }, v.beschrijving) : null,
        ))),
      ),
      h('div', { class: 'knoppen' }, knop))
      : h('p', { class: 'dempen' }, 'Deze repository heeft geen labels.'),
  );
}

/** @param {Issue} issue */
function toewijzenActie(issue) {
  const personen = [...issue.toewijsbaar];
  for (const l of issue.toegewezen) if (!personen.some((p) => p.login === l)) personen.push({ login: l, name: null });
  const knop = verzendknop('Toewijzing opslaan');
  const vinkjes = personen.map((p, i) => ({
    login: p.login,
    naam: p.name,
    invoer: /** @type {HTMLInputElement} */ (h('input', { type: 'checkbox', id: `toewijs-${i}`, value: p.login, checked: issue.toegewezen.includes(p.login) })),
  }));
  /** @param {string[]} logins */
  const bewaar = async (logins) => {
    await api(`issue/${issue.nummer}/toewijzen`, { method: 'POST', body: { logins } });
    await laad('kop-toewijzen');
    return logins.length ? `Toegewezen aan ${logins.join(', ')}.` : 'Niemand meer toegewezen.';
  };
  const kanIk = issue.toewijsbaar.some((p) => p.login === issue.ik) && !issue.toegewezen.includes(issue.ik);
  const mij = kanIk
    ? /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'knop' }, 'Wijs mij toe'))
    : null;
  mij?.addEventListener('click', () => bezig(mij, () => bewaar([...issue.toegewezen, issue.ik])));

  return h('section', { class: 'actie', 'aria-labelledby': 'kop-toewijzen' },
    kop2('kop-toewijzen', 'Toewijzen'),
    personen.length
      ? formulier(knop, async () => {
        const logins = vinkjes.filter((v) => v.invoer.checked).map((v) => v.login);
        if (logins.length > 10) throw new Error('Wijs hoogstens 10 personen toe.');
        return bewaar(logins);
      }, null,
      h('fieldset', null,
        h('legend', null, 'Wie werkt hieraan'),
        h('ul', { class: 'vinkraster' }, vinkjes.map((v) => h('li', null,
          h('label', { for: v.invoer.id }, v.invoer,
            h('span', null, h('span', { class: 'mono' }, v.login), v.naam ? ` (${v.naam})` : '', v.login === issue.ik ? ' (jij)' : '')),
        ))),
      ),
      h('div', { class: 'knoppen' }, knop, mij))
      : h('p', { class: 'dempen' }, 'Niemand kan in deze repository toegewezen worden.'),
  );
}

/** @param {Issue} issue */
function reagerenActie(issue) {
  const veldEl = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: 'reactie-tekst', rows: '6', required: true, maxlength: '60000', 'aria-describedby': 'reactie-hulp' }));
  const knop = verzendknop('Reactie plaatsen');
  return h('section', { class: 'actie', 'aria-labelledby': 'kop-reageren' },
    kop2('kop-reageren', 'Reageren'),
    formulier(knop, async () => {
      const tekst = veldEl.value.trim();
      if (!tekst) throw new Error('Schrijf eerst een reactie.');
      await api(`issue/${issue.nummer}/commentaar`, { method: 'POST', body: { tekst } });
      await laad('kop-reacties');
      return 'Reactie geplaatst.';
    }, null,
    h('label', { for: 'reactie-tekst' }, 'Reactie'),
    veldEl,
    h('p', { class: 'hulptekst', id: 'reactie-hulp' }, 'Markdown zoals op GitHub. De reactie verschijnt onder je eigen account.'),
    h('div', { class: 'knoppen' }, knop)),
  );
}

/** @param {Issue} issue */
function taakActie(issue) {
  const stappenEl = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: 'taak-stappen', rows: '5', required: true, 'aria-describedby': 'taak-stappen-hulp' }));
  stappenEl.value = (STAPPEN[issue.soort] || []).join('\n');
  const ikToewijsbaar = issue.toewijsbaar.some((p) => p.login === issue.ik);
  const wieEl = /** @type {HTMLSelectElement} */ (h('select', { id: 'taak-wie' },
    h('option', { value: '' }, 'Niemand'),
    ikToewijsbaar ? h('option', { value: issue.ik }, `${issue.ik} (jij)`) : null,
    issue.toewijsbaar.filter((p) => p.login !== issue.ik).map((p) => h('option', { value: p.login }, p.name ? `${p.login} (${p.name})` : p.login)),
  ));
  const notitieEl = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: 'taak-notitie', rows: '3', maxlength: '5000' }));
  const knop = verzendknop('Omzetten naar taak');

  return h('section', { class: 'actie', 'aria-labelledby': 'kop-taak' },
    kop2('kop-taak', 'Omzetten naar een taak'),
    h('p', { class: 'hulptekst' }, 'Zet het label taak, haalt te beoordelen weg en plaatst de stappen als checklist in een reactie.'),
    formulier(knop, async () => {
      const stappen = stappenEl.value.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!stappen.length) throw new Error('Geef minstens één stap.');
      if (stappen.length > 20) throw new Error('Hoogstens 20 stappen.');
      if (stappen.some((s) => s.length > 300)) throw new Error('Een stap is hoogstens 300 tekens lang.');
      /** @type {{ stappen: string[], toewijzen?: string, notitie?: string }} */
      const body = { stappen };
      if (wieEl.value) body.toewijzen = wieEl.value;
      if (notitieEl.value.trim()) body.notitie = notitieEl.value.trim();
      await api(`issue/${issue.nummer}/taak`, { method: 'POST', body });
      await laad('kop-reacties');
      return 'Omgezet naar een taak.';
    }, null,
    h('label', { for: 'taak-stappen' }, 'Stappen, één per regel'),
    stappenEl,
    h('p', { class: 'hulptekst', id: 'taak-stappen-hulp' }, 'Hoogstens 20 stappen van elk 300 tekens.'),
    h('label', { for: 'taak-wie' }, 'Toewijzen aan'),
    wieEl,
    h('label', { for: 'taak-notitie' }, 'Notitie (optioneel)'),
    notitieEl,
    h('div', { class: 'knoppen' }, knop)),
  );
}

/** @param {Issue} issue */
function sluitenActie(issue) {
  const radios = SLUITREDENEN.map((r, i) => ({
    ...r,
    invoer: /** @type {HTMLInputElement} */ (h('input', { type: 'radio', name: 'sluit-reden', id: `sluit-reden-${r.waarde}`, value: r.waarde, checked: i === 0 })),
  }));
  const tekstEl = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: 'sluit-tekst', rows: '4', maxlength: '60000', 'aria-describedby': 'sluit-hulp' }));
  const knop = verzendknop('Issue sluiten', 'knop gevaar');

  const gekozen = () => radios.find((r) => r.invoer.checked) || radios[0];
  const form = formulier(knop, async () => {
    const keuze = gekozen();
    const tekst = tekstEl.value.trim();
    await api(`issue/${issue.nummer}/sluiten`, { method: 'POST', body: { reden: keuze.waarde, ...(tekst ? { tekst } : {}) } });
    await laad('kop-heropenen');
    return `Issue gesloten: ${keuze.tekst.toLowerCase()}.`;
  },
  () => bevestig({
    titel: `Issue #${issue.nummer} sluiten`,
    inhoud: h('p', null, `Het issue wordt gesloten als "${gekozen().tekst.toLowerCase()}".`,
      tekstEl.value.trim() ? ' Je reactie wordt eerst geplaatst.' : ''),
    knop: 'Issue sluiten',
    gevaar: true,
  }),
  h('fieldset', null,
    h('legend', null, 'Reden'),
    radios.map((r) => h('label', { class: 'vinkregel', for: r.invoer.id }, r.invoer, h('span', null, r.tekst))),
  ),
  h('label', { for: 'sluit-tekst' }, 'Reactie (optioneel)'),
  tekstEl,
  h('p', { class: 'hulptekst', id: 'sluit-hulp' }, 'Leg kort uit waarom. Bij een dubbel issue: vermeld naar welk issue het verwijst, bijvoorbeeld #12.'),
  h('div', { class: 'knoppen' }, knop));

  return h('section', { class: 'actie', 'aria-labelledby': 'kop-sluiten' },
    kop2('kop-sluiten', 'Sluiten'),
    form,
  );
}

/** @param {Issue} issue */
function heropenenActie(issue) {
  const knop = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'knop' }, 'Heropenen'));
  knop.addEventListener('click', () => bezig(knop, async () => {
    await api(`issue/${issue.nummer}/heropenen`, { method: 'POST', body: {} });
    await laad('kop-sluiten');
    return 'Issue heropend.';
  }));
  return h('section', { class: 'actie', 'aria-labelledby': 'kop-heropenen' },
    kop2('kop-heropenen', 'Heropenen'),
    h('p', null, `Dit issue is ${redenTekst(issue)}.`),
    h('div', { class: 'knoppen' }, knop),
  );
}

/* ---------- Start ---------- */

async function begin() {
  let status;
  try {
    status = await start();
  } catch (e) {
    meld(e instanceof Error ? e.message : String(e), 'gevaar');
    vervang(container);
    container.removeAttribute('aria-busy');
    return;
  }
  if (status.ontbreekt.length || !status.gebruiker) {
    vervang(container, status.ontbreekt.length ? null : h('p', { class: 'dempen' }, 'Meld je aan om dit issue te behandelen.'));
    container.removeAttribute('aria-busy');
    return;
  }
  if (nummer === null) {
    meld('Geen issuenummer in het adres. Open een issue vanuit het overzicht.', 'gevaar');
    vervang(container);
    container.removeAttribute('aria-busy');
    return;
  }
  try {
    await laad();
  } catch (e) {
    meld(e instanceof Error ? e.message : String(e), 'gevaar');
    vervang(container, h('p', { class: 'dempen' }, `Issue #${nummer} kon niet geladen worden.`));
  }
}

begin();
