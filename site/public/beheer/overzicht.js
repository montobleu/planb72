// @ts-check
// Beheer, overzicht: open pull requests en issues, met soort, goedkeuringen en controles.
import { h, vervang, $, api, start, meld, tijd, controleLabel, goedkeuringLabel, labelEl } from './gemeen.js';

/** @type {any} */ let gegevens = null;
/** @type {string} */ let ik = '';

function prTabel() {
  const kritiek = /** @type {HTMLInputElement} */ ($('[data-filter="kritiek"]')).checked;
  const voorMij = /** @type {HTMLInputElement} */ ($('[data-filter="voor-mij"]')).checked;
  const prs = gegevens.prs.filter((/** @type {any} */ pr) =>
    (!kritiek || pr.kritiek) &&
    (!voorMij || (pr.auteur !== ik && !pr.concept && pr.goedkeuringen.perNalezer[ik] !== 'APPROVED')));
  const doel = $('[data-prs-tabel]');
  if (!prs.length) {
    vervang(doel, h('p', { class: 'dempen' }, gegevens.prs.length ? 'Geen pull requests voor deze filter.' : 'Er zijn geen open pull requests.'));
    return;
  }
  vervang(doel, h('table', { class: 'overzicht' },
    h('caption', null, `${prs.length} van ${gegevens.prsTotaal} open pull request(s), laatst bijgewerkt eerst`),
    h('thead', null, h('tr', null,
      h('th', { scope: 'col' }, 'Pull request'),
      h('th', { scope: 'col' }, 'Soort'),
      h('th', { scope: 'col' }, 'Goedkeuringen'),
      h('th', { scope: 'col' }, 'Controles'),
      h('th', { scope: 'col' }, 'Auteur'),
      h('th', { scope: 'col' }, 'Bijgewerkt'),
    )),
    h('tbody', null, prs.map((/** @type {any} */ pr) => {
      const mijn = pr.goedkeuringen.perNalezer[ik];
      return h('tr', { class: pr.kritiek ? 'kritiek' : null },
        h('th', { scope: 'row' },
          h('span', { class: 'nr' }, `#${pr.nummer} `),
          h('a', { href: `/beheer/pr/?nr=${pr.nummer}` }, pr.titel),
          pr.concept ? [' ', h('span', { class: 'label' }, 'concept')] : null,
          h('div', { class: 'klein' }, `${pr.kop} naar ${pr.basis} · ${pr.aantalBestanden} bestand(en), +${pr.bij} −${pr.weg}`),
        ),
        h('td', { 'data-label': 'Soort' }, h('div', { class: 'labels' }, (pr.soorten.length ? pr.soorten : ['overig']).map(labelEl)),
          pr.aantalBestanden > 100 ? h('div', { class: 'klein' }, 'Op basis van de eerste 100 bestanden; zie de detailpagina.') : null),
        h('td', { 'data-label': 'Goedkeuringen' },
          goedkeuringLabel(pr.goedkeuringen.aantal, pr.nodig),
          pr.goedkeuringen.wijzigingen.length ? h('div', { class: 'klein waarschuwing-tekst' }, 'Wijzigingen gevraagd') : null,
          mijn ? h('div', { class: 'klein' }, 'Jij: ' + (/** @type {Record<string, string>} */ ({ APPROVED: 'goedgekeurd', CHANGES_REQUESTED: 'wijzigingen gevraagd', COMMENTED: 'gereageerd', DISMISSED: 'ingetrokken' })[mijn] || mijn)) : null,
        ),
        h('td', { 'data-label': 'Controles' }, h('div', { class: 'statussen' }, pr.controles.map(controleLabel))),
        h('td', { 'data-label': 'Auteur' }, pr.auteur === ik ? `${pr.auteur} (jij)` : pr.auteur),
        h('td', { 'data-label': 'Bijgewerkt' }, tijd(pr.bijgewerkt)),
      );
    })),
  ));
}

function issueTabel() {
  const soort = /** @type {HTMLSelectElement} */ ($('[data-filter-soort]')).value;
  const issues = gegevens.issues.filter((/** @type {any} */ i) => !soort || i.soort === soort);
  const doel = $('[data-issues-tabel]');
  if (!issues.length) {
    vervang(doel, h('p', { class: 'dempen' }, gegevens.issues.length ? 'Geen issues van deze soort.' : 'Er zijn geen open issues.'));
    return;
  }
  vervang(doel, h('table', { class: 'overzicht' },
    h('caption', null, `${issues.length} van ${gegevens.issuesTotaal} open issue(s), laatst bijgewerkt eerst`),
    h('thead', null, h('tr', null,
      h('th', { scope: 'col' }, 'Issue'),
      h('th', { scope: 'col' }, 'Soort'),
      h('th', { scope: 'col' }, 'Labels'),
      h('th', { scope: 'col' }, 'Toegewezen'),
      h('th', { scope: 'col' }, 'Reacties'),
      h('th', { scope: 'col' }, 'Bijgewerkt'),
    )),
    h('tbody', null, issues.map((/** @type {any} */ i) => h('tr', null,
      h('th', { scope: 'row' },
        h('span', { class: 'nr' }, `#${i.nummer} `),
        h('a', { href: `/beheer/issue/?nr=${i.nummer}` }, i.titel),
        h('div', { class: 'klein' }, `door ${i.auteur}`),
      ),
      h('td', { 'data-label': 'Soort' }, i.soort),
      h('td', { 'data-label': 'Labels' }, h('div', { class: 'labels' }, i.labels.map(labelEl))),
      h('td', { 'data-label': 'Toegewezen' }, i.toegewezen.join(', ') || h('span', { class: 'dempen' }, 'niemand')),
      h('td', { 'data-label': 'Reacties' }, String(i.reacties)),
      h('td', { 'data-label': 'Bijgewerkt' }, tijd(i.bijgewerkt)),
    ))),
  ));
}

async function laad() {
  const status = await start();
  if (!status.gebruiker || status.ontbreekt.length) return;
  ik = status.gebruiker.login;
  try {
    gegevens = await api('overzicht');
  } catch (e) {
    meld(e instanceof Error ? e.message : String(e), 'gevaar');
    return;
  }
  $('[data-prs]').hidden = false;
  $('[data-issues]').hidden = false;
  prTabel();
  issueTabel();
  for (const f of document.querySelectorAll('[data-filter]')) f.addEventListener('change', prTabel);
  $('[data-filter-soort]').addEventListener('change', issueTabel);
}

laad().catch((e) => meld(e instanceof Error ? e.message : String(e), 'gevaar'));
