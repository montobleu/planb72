// @ts-check
// PlanB72 beheer: gedeelde, zuivere functies voor de Worker en de browser.
// - welke paden hoeveel goedkeuringen vragen (zelfde regels als pipeline/controleer_inhoud.py)
// - goedkeuringen tellen zoals de workflow "inhoud" dat doet
// - verschillen tussen twee teksten, per regel en per woord
// - bronnen, noodnummers, getallen en het bronnenregister uit een wijziging halen
// Geen afhankelijkheden, geen DOM.

/* ---------- Nazichtregels (docs/nazicht.md) ---------- */

/** Paden die twee goedkeuringen vragen. Houd gelijk met KRITIEK in pipeline/controleer_inhoud.py. */
export const KRITIEK = [
  [/^site\/src\/content\/scenarios\//, 'inhoud: handelingsrichtlijnen'],
  [/^site\/src\/content\/eerstehulp\//, 'inhoud: medisch'],
  [/^site\/src\/content\/gidsen\//, 'inhoud: gidsen'],
  [/^site\/src\/pages\/app\/eerste-hulp\//, 'inhoud: medisch'],
  [/^site\/src\/pages\/app\/nucleair\//, 'inhoud: nucleair'],
  [/^site\/src\/pages\/app\/schuilen\//, 'inhoud: schuilen'],
  [/^data\/landen\//, 'inhoud: landinfo'],
];
/** Paden met één goedkeuring. Houd gelijk met GEWOON in pipeline/controleer_inhoud.py. */
export const GEWOON = [
  [/^data\/bronnen\/register\.json$/, 'bronnenregister'],
  [/^site\/src\/i18n\//, 'vertaling'],
  [/^(site|launcher|pipeline|\.github)\//, 'code'],
];

/**
 * Hoeveel goedkeuringen en welke labels een wijziging vraagt.
 * @param {string[]} paden
 */
export function beoordeel(paden) {
  const labels = new Set();
  let kritiek = false;
  for (const pad of paden) {
    for (const [patroon, label] of KRITIEK) if (/** @type {RegExp} */ (patroon).test(pad)) { labels.add(label); kritiek = true; }
    for (const [patroon, label] of GEWOON) if (/** @type {RegExp} */ (patroon).test(pad)) labels.add(label);
  }
  if (kritiek) labels.add('twee nalezers');
  return { nodig: kritiek ? 2 : 1, kritiek, labels: [...labels].sort() };
}

/** Het label van één pad, voor de lijst met bestanden. */
export function soortVanPad(/** @type {string} */ pad) {
  for (const [patroon, label] of KRITIEK) if (/** @type {RegExp} */ (patroon).test(pad)) return { label, kritiek: true };
  for (const [patroon, label] of GEWOON) if (/** @type {RegExp} */ (patroon).test(pad)) return { label, kritiek: false };
  return { label: 'overig', kritiek: false };
}

/** Wie een goedkeuring mag geven: eigenaar, lid of medewerker (schrijfrechten). */
export const NALEZERS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/**
 * Goedkeuringen tellen. Zoals .github/workflows/inhoud.yml telt per nalezer (niet de auteur) de
 * laatste review. Strenger dan die workflow telt een goedkeuring hier alleen als ze komt van
 * iemand met schrijfrechten (eigenaar, lid, medewerker) en gegeven is op de laatste commit:
 * zo tellen sokpopaccounts niet mee en vervalt een goedkeuring als er daarna iets gewijzigd wordt.
 * @param {{ login: string, state: string, datum?: string, rol?: string, commit?: string }[]} reviews in volgorde van indienen
 * @param {string} auteur
 * @param {string} [kopSha] laatste commit; zonder waarde telt elke commit
 */
export function telGoedkeuringen(reviews, auteur, kopSha) {
  /** @type {Map<string, { state: string, rol?: string, commit?: string }>} */
  const laatste = new Map();
  for (const r of reviews) if (r.login && r.login !== auteur && r.state !== 'PENDING') laatste.set(r.login, r);
  const geldig = (/** @type {{ rol?: string, commit?: string }} */ r) =>
    (r.rol === undefined || NALEZERS.includes(r.rol)) && (!kopSha || !r.commit || r.commit === kopSha);
  const goedgekeurd = [...laatste].filter(([, r]) => r.state === 'APPROVED' && geldig(r)).map(([l]) => l);
  const verouderd = [...laatste].filter(([, r]) => r.state === 'APPROVED' && kopSha && r.commit && r.commit !== kopSha).map(([l]) => l);
  const zonderRechten = [...laatste].filter(([, r]) => r.state === 'APPROVED' && r.rol !== undefined && !NALEZERS.includes(r.rol)).map(([l]) => l);
  const wijzigingen = [...laatste].filter(([, r]) => r.state === 'CHANGES_REQUESTED').map(([l]) => l);
  return {
    aantal: goedgekeurd.length, goedgekeurd, wijzigingen, verouderd, zonderRechten,
    perNalezer: Object.fromEntries([...laatste].map(([l, r]) => [l, r.state])),
  };
}

/**
 * Mag dit samengevoegd worden volgens de regels van PlanB72?
 * @param {{ nodig: number, aantal: number, wijzigingen: string[], controles: { naam: string, uitkomst: string }[], concept: boolean, mergeable?: string, onvolledig?: boolean, wijzigtControle?: string[] }} p
 */
export function magSamenvoegen(p) {
  const redenen = [];
  if (p.onvolledig) redenen.push('Niet alle gewijzigde bestanden konden gelezen worden; voeg samen op GitHub na volledig nazicht.');
  if (p.wijzigtControle?.length) {
    redenen.push(`Deze pull request wijzigt de controle zelf (${p.wijzigtControle.join(', ')}); de uitkomst van "inhoud" is dan niet te vertrouwen. Laat de wijziging apart nakijken en voeg samen op GitHub.`);
  }
  if (p.concept) redenen.push('De pull request is nog een concept (draft).');
  if (p.aantal < p.nodig) redenen.push(`Er zijn ${p.aantal} van de ${p.nodig} vereiste goedkeuringen.`);
  if (p.wijzigingen.length) redenen.push(`Wijzigingen gevraagd door ${p.wijzigingen.join(', ')}.`);
  const inhoud = p.controles.find((c) => c.naam === 'inhoud');
  if (!inhoud) redenen.push('De controle "inhoud" is niet gevonden.');
  for (const c of p.controles) {
    if (c.uitkomst !== 'geslaagd' && c.uitkomst !== 'overgeslagen') redenen.push(`Controle "${c.naam}": ${c.uitkomst}.`);
  }
  if (p.mergeable === 'dirty') redenen.push('Er zijn conflicten met de doelbranch.');
  if (p.mergeable === 'behind') redenen.push('De branch loopt achter op de doelbranch.');
  return { mag: redenen.length === 0, redenen };
}

/* ---------- Verschillen tussen teksten ---------- */

/**
 * @typedef {{ soort: 'gelijk' | 'weg' | 'bij', oud?: string, nieuw?: string, oudNr?: number, nieuwNr?: number }} RegelOp
 */

/**
 * Langste gemeenschappelijke deelrij op regels. Begin en einde die gelijk zijn, worden eerst
 * afgesplitst, zodat ook lange teksten met een kleine wijziging snel gaan.
 * @param {string} oud
 * @param {string} nieuw
 * @returns {RegelOp[]}
 */
export function regelVerschil(oud, nieuw) {
  const a = oud === '' ? [] : oud.replace(/\r\n/g, '\n').split('\n');
  const b = nieuw === '' ? [] : nieuw.replace(/\r\n/g, '\n').split('\n');
  let begin = 0;
  while (begin < a.length && begin < b.length && a[begin] === b[begin]) begin++;
  let eindA = a.length, eindB = b.length;
  while (eindA > begin && eindB > begin && a[eindA - 1] === b[eindB - 1]) { eindA--; eindB--; }

  /** @type {RegelOp[]} */
  const ops = [];
  for (let i = 0; i < begin; i++) ops.push({ soort: 'gelijk', oud: a[i], nieuw: b[i], oudNr: i + 1, nieuwNr: i + 1 });

  const n = eindA - begin, m = eindB - begin;
  if (n * m > 4_000_000) {
    // Te groot voor een volledige vergelijking: alles weg en alles bij.
    for (let i = begin; i < eindA; i++) ops.push({ soort: 'weg', oud: a[i], oudNr: i + 1 });
    for (let j = begin; j < eindB; j++) ops.push({ soort: 'bij', nieuw: b[j], nieuwNr: j + 1 });
  } else {
    // Tabel van achteren naar voren: lengte[i][j] = LGD van a[i..] en b[j..].
    const breedte = m + 1;
    const lengte = new Uint32Array((n + 1) * breedte);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lengte[i * breedte + j] = a[begin + i] === b[begin + j]
          ? lengte[(i + 1) * breedte + j + 1] + 1
          : Math.max(lengte[(i + 1) * breedte + j], lengte[i * breedte + j + 1]);
      }
    }
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[begin + i] === b[begin + j]) {
        ops.push({ soort: 'gelijk', oud: a[begin + i], nieuw: b[begin + j], oudNr: begin + i + 1, nieuwNr: begin + j + 1 }); i++; j++;
      } else if (i < n && (j >= m || lengte[(i + 1) * breedte + j] >= lengte[i * breedte + j + 1])) {
        // Bij gelijke stand eerst "weg", zodat een gewijzigde regel als weg+bij tegenover elkaar komt.
        ops.push({ soort: 'weg', oud: a[begin + i], oudNr: begin + i + 1 }); i++;
      } else {
        ops.push({ soort: 'bij', nieuw: b[begin + j], nieuwNr: begin + j + 1 }); j++;
      }
    }
  }
  for (let k = 0; k < a.length - eindA; k++) {
    ops.push({ soort: 'gelijk', oud: a[eindA + k], nieuw: b[eindB + k], oudNr: eindA + k + 1, nieuwNr: eindB + k + 1 });
  }
  return ops;
}

/**
 * @typedef {{ links?: RegelOp, rechts?: RegelOp, gelijk: boolean }} Rij
 */

/**
 * Zet regelbewerkingen om in rijen voor een weergave naast elkaar: een blok "weg" gevolgd door
 * een blok "bij" komt op dezelfde rijen, zodat gewijzigde regels tegenover elkaar staan.
 * @param {RegelOp[]} ops
 * @returns {Rij[]}
 */
export function naastElkaar(ops) {
  /** @type {Rij[]} */
  const rijen = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].soort === 'gelijk') { rijen.push({ links: ops[k], rechts: ops[k], gelijk: true }); k++; continue; }
    /** @type {RegelOp[]} */ const weg = [];
    /** @type {RegelOp[]} */ const bij = [];
    while (k < ops.length && ops[k].soort !== 'gelijk') (ops[k].soort === 'weg' ? weg : bij).push(ops[k++]);
    for (let x = 0; x < Math.max(weg.length, bij.length); x++) rijen.push({ links: weg[x], rechts: bij[x], gelijk: false });
  }
  return rijen;
}

/**
 * Verschil per woord tussen twee regels, voor het markeren binnen een gewijzigde regel.
 * @param {string} oud
 * @param {string} nieuw
 * @returns {{ oud: { tekst: string, anders: boolean }[], nieuw: { tekst: string, anders: boolean }[] }}
 */
export function woordVerschil(oud, nieuw) {
  const splits = (/** @type {string} */ s) => s.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
  const a = splits(oud), b = splits(nieuw);
  if (a.length * b.length > 250_000) return { oud: [{ tekst: oud, anders: true }], nieuw: [{ tekst: nieuw, anders: true }] };
  const ops = regelVerschil(a.join('\n'), b.join('\n'));
  /** @type {{ tekst: string, anders: boolean }[]} */ const links = [];
  /** @type {{ tekst: string, anders: boolean }[]} */ const rechts = [];
  const voeg = (/** @type {typeof links} */ lijst, /** @type {string} */ tekst, /** @type {boolean} */ anders) => {
    const vorige = lijst.at(-1);
    if (vorige && vorige.anders === anders) vorige.tekst += tekst; else lijst.push({ tekst, anders });
  };
  // Witruimte die verdwijnt of bij komt, markeren we niet.
  for (const op of ops) {
    if (op.soort === 'gelijk') { voeg(links, op.oud ?? '', false); voeg(rechts, op.nieuw ?? '', false); }
    else if (op.soort === 'weg') voeg(links, op.oud ?? '', !/^\s*$/.test(op.oud ?? ''));
    else voeg(rechts, op.nieuw ?? '', !/^\s*$/.test(op.nieuw ?? ''));
  }
  return { oud: links, nieuw: rechts };
}

/** Unified diff in tekst, voor Claude en voor PR-commentaar. */
export function unifiedDiff(/** @type {string} */ oud, /** @type {string} */ nieuw, context = 3) {
  const ops = regelVerschil(oud, nieuw);
  const toon = new Array(ops.length).fill(false);
  ops.forEach((op, i) => {
    if (op.soort !== 'gelijk') for (let k = Math.max(0, i - context); k <= Math.min(ops.length - 1, i + context); k++) toon[k] = true;
  });
  /** @type {string[]} */ const uit = [];
  let vorige = -2;
  ops.forEach((op, i) => {
    if (!toon[i]) return;
    if (i !== vorige + 1) uit.push(`@@ oud ${op.oudNr ?? '-'} / nieuw ${op.nieuwNr ?? '-'} @@`);
    uit.push((op.soort === 'gelijk' ? ' ' : op.soort === 'weg' ? '-' : '+') + (op.soort === 'weg' ? op.oud : op.nieuw));
    vorige = i;
  });
  return uit.join('\n');
}

/* ---------- Bronnen, getallen en doseringen ---------- */

/** Adres zonder anker en zonder slash op het einde, zoals url_sleutel in controleer_inhoud.py. */
export function urlSleutel(/** @type {string} */ url) {
  const u = url.split('#', 1)[0].trim();
  return u.endsWith('/') ? u.slice(0, -1) : u;
}

/**
 * Alle bronnen in een Markdown-bestand: het veld `bronnen` in de frontmatter en elke link in de tekst.
 * @param {string} tekst
 * @returns {{ naam: string, url: string, waar: 'frontmatter' | 'tekst' }[]}
 */
export function bronnenUit(tekst) {
  /** @type {{ naam: string, url: string, waar: 'frontmatter' | 'tekst' }[]} */
  const uit = [];
  const fm = /^---\n([\s\S]*?)\n---/.exec(tekst.replace(/\r\n/g, '\n'));
  if (fm) {
    let naam = '';
    for (const regel of fm[1].split('\n')) {
      const n = /^\s+- naam:\s*(.*)$/.exec(regel);
      if (n) { naam = n[1].trim().replace(/^"|"$/g, ''); continue; }
      const u = /^\s+url:\s*(.*)$/.exec(regel);
      if (u) uit.push({ naam, url: u[1].trim().replace(/^"|"$/g, ''), waar: 'frontmatter' });
    }
  }
  const lichaam = fm ? tekst.slice(fm[0].length) : tekst;
  for (const m of lichaam.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)) uit.push({ naam: m[1], url: m[2], waar: 'tekst' });
  return uit;
}

/**
 * Wat er aan bronnen bij kwam en verdween.
 * @param {string} oud
 * @param {string} nieuw
 */
export function bronnenVerschil(oud, nieuw) {
  const sleutels = (/** @type {string} */ t) => {
    /** @type {Map<string, { naam: string, url: string }>} */ const m = new Map();
    for (const b of bronnenUit(t)) if (!m.has(urlSleutel(b.url))) m.set(urlSleutel(b.url), { naam: b.naam, url: b.url });
    return m;
  };
  const a = sleutels(oud), b = sleutels(nieuw);
  return {
    bij: [...b].filter(([k]) => !a.has(k)).map(([, v]) => v),
    weg: [...a].filter(([k]) => !b.has(k)).map(([, v]) => v),
  };
}

const DOSERING = /\b\d+(?:[.,]\d+)?\s?(?:mg|µg|mcg|microgram|milligram)\b/gi;

/** Mogelijke doseringen (zelfde patroon als controleer_inhoud.py), met regelnummer. */
export function doseringenUit(/** @type {string} */ tekst) {
  /** @type {{ regel: number, tekst: string }[]} */ const uit = [];
  tekst.split('\n').forEach((r, i) => { for (const m of r.matchAll(DOSERING)) uit.push({ regel: i + 1, tekst: m[0] }); });
  return uit;
}

/**
 * Getallen, telefoonnummers, uren en frequenties in een tekst, als multiset.
 * Telefoonnummers met spaties (070 245 245) worden één getal. Adressen en de frontmatter-velden
 * datum en volgorde tellen niet mee.
 * @param {string} tekst
 */
export function getallenUit(tekst) {
  let t = tekst.replace(/\r\n/g, '\n')
    .replace(/^(datum|volgorde|origineel_datum):.*$/gm, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ');
  // Groepen van twee of drie cijfers na een spatie horen bij het vorige getal (telefoonnummers).
  let vorig = '';
  while (vorig !== t) { vorig = t; t = t.replace(/(\d)[   ](\d{2,3})(?!\d)/g, '$1$2'); }
  /** @type {Map<string, number>} */ const tel = new Map();
  for (const m of t.matchAll(/\d+(?:[.,:]\d+)*(?:\s?(?:mSv|µSv|Sv|MHz|kHz|GHz|Hz|km\/h|km|cm|mm|ml|cl|dl|kg|mg|µg|°C|%|liter|l|m|g|uur|u|h|minuten|min|dagen|dag))?(?![\p{L}])/gu)) {
    const g = m[0].replace(/\s+/g, ' ');
    tel.set(g, (tel.get(g) ?? 0) + 1);
  }
  return tel;
}

/** Getallen die verdwenen of bij kwamen tussen twee versies. */
export function getallenVerschil(/** @type {string} */ oud, /** @type {string} */ nieuw) {
  const a = getallenUit(oud), b = getallenUit(nieuw);
  const weg = [], bij = [];
  for (const [g, n] of a) for (let i = 0; i < n - (b.get(g) ?? 0); i++) weg.push(g);
  for (const [g, n] of b) for (let i = 0; i < n - (a.get(g) ?? 0); i++) bij.push(g);
  return { weg, bij };
}

/* ---------- Landinfo en bronnenregister ---------- */

/** @param {string} tekst */
function leesJson(tekst) {
  if (!tekst) return null;
  try { return JSON.parse(tekst); } catch { return undefined; }
}

/**
 * Lijsten met records vergelijken op een sleutel.
 * @template T
 * @param {T[]} oud
 * @param {T[]} nieuw
 * @param {(r: T) => string} sleutel
 */
function vergelijkLijst(oud, nieuw, sleutel) {
  const a = new Map(oud.map((r) => [sleutel(r), r]));
  const b = new Map(nieuw.map((r) => [sleutel(r), r]));
  const bij = [], weg = [], anders = [];
  for (const [k, r] of b) {
    if (!a.has(k)) { bij.push(r); continue; }
    const o = /** @type {any} */ (a.get(k));
    const velden = [...new Set([...Object.keys(o), ...Object.keys(/** @type {any} */ (r))])]
      .filter((v) => JSON.stringify(o[v]) !== JSON.stringify(/** @type {any} */ (r)[v]))
      .map((v) => ({ veld: v, oud: o[v], nieuw: /** @type {any} */ (r)[v] }));
    if (velden.length) anders.push({ sleutel: k, oud: o, nieuw: r, velden });
  }
  for (const [k, r] of a) if (!b.has(k)) weg.push(r);
  return { bij, weg, anders };
}

/**
 * Noodnummers en kanalen in data/landen/<land>.json.
 * @param {string} oud
 * @param {string} nieuw
 */
export function landVerschil(oud, nieuw) {
  const a = leesJson(oud) ?? {}, b = leesJson(nieuw);
  if (b === undefined) return { fout: 'Het nieuwe bestand is geen geldige JSON.' };
  return {
    noodnummers: vergelijkLijst(a.noodnummers ?? [], b?.noodnummers ?? [], (/** @type {any} */ n) => String(n.nummer)),
    kanalen: vergelijkLijst(a.kanalen ?? [], b?.kanalen ?? [], (/** @type {any} */ k) => String(k.naam)),
    blokken: ['nucleair', 'schuilen', 'voorraad', 'status', 'bijgewerkt']
      .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b?.[k]))
      .map((k) => ({ blok: k, oud: a[k], nieuw: b?.[k] })),
  };
}

/**
 * Bronnenregister: nieuwe, verwijderde en gewijzigde bronnen (op id).
 * @param {string} oud
 * @param {string} nieuw
 */
export function registerVerschil(oud, nieuw) {
  const a = leesJson(oud) ?? [], b = leesJson(nieuw);
  if (b === undefined) return { fout: 'Het nieuwe register is geen geldige JSON.' };
  const lijst = (/** @type {any} */ r) => (Array.isArray(r) ? r : r?.bronnen ?? []);
  return vergelijkLijst(lijst(a), lijst(b), (/** @type {any} */ r) => String(r.id ?? r.url));
}

/** Teksten die we als inhoud tonen (naast elkaar, met bronnen en getallen). */
/** Bestanden die bepalen hoe de controles werken: wijzigt een PR die, dan vertrouwen we de uitkomst niet. */
export function wijzigtControle(/** @type {string[]} */ paden) {
  return paden.filter((p) => /^\.github\/workflows\//.test(p) || /^pipeline\/controleer_inhoud\.py$/.test(p) || p === '.github/CODEOWNERS');
}

export function isInhoudstekst(/** @type {string} */ pad) {
  return /^site\/src\/content\/.*\.mdx?$/.test(pad) || /^site\/src\/pages\/app\/(eerste-hulp|nucleair|schuilen)\//.test(pad);
}
