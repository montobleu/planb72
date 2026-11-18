// Gegevens voor het overzicht en de detailpagina's, in één of twee aanroepen per pagina.
// Let op het aantal subrequests per aanvraag (Workers Free: 50): bestandsinhoud wordt per
// bestand apart opgevraagd door de browser, niet hier in bulk.
import { gh, ghql, bestand } from './github.js';
import { beoordeel, telGoedkeuringen, magSamenvoegen, soortVanPad, isInhoudstekst, wijzigtControle } from '../../public/beheer/verschil.js';

// Elke controle met het workflowbestand waaruit ze moet komen. Een run met dezelfde naam uit een
// andere workflow of van een andere app telt niet.
const CONTROLES = { inhoud: '.github/workflows/inhoud.yml', bouwen: '.github/workflows/site.yml' };

const ROLLUP = `statusCheckRollup { contexts(first: 100) { nodes {
  __typename
  ... on CheckRun { name status conclusion detailsUrl startedAt checkSuite { app { slug } workflowRun { file { path } } } }
} } }`;

const REVIEWS = 'reviews(last: 100) { nodes { author { login } authorAssociation commit { oid } state submittedAt';

function splitsRepo(repo) {
  const [owner, name] = repo.split('/');
  return { owner, name };
}

function uitkomst(run) {
  if (!run) return 'niet gestart';
  if (run.status !== 'COMPLETED') return 'bezig';
  return {
    SUCCESS: 'geslaagd', NEUTRAL: 'overgeslagen', SKIPPED: 'overgeslagen',
    FAILURE: 'mislukt', TIMED_OUT: 'mislukt', CANCELLED: 'mislukt', ACTION_REQUIRED: 'mislukt', STARTUP_FAILURE: 'mislukt', STALE: 'mislukt',
  }[run.conclusion] || 'onbekend';
}

/**
 * De controles "inhoud" en "bouwen" van de laatste commit. "inhoud" draait op elke PR en na
 * elke review; de nieuwste run telt. "bouwen" draait alleen als site/ of data/ wijzigt.
 */
function controles(commit, paden) {
  const nodes = commit?.statusCheckRollup?.contexts?.nodes || [];
  const bouwenVerwacht = paden.some((p) => /^(site|data)\//.test(p));
  return Object.entries(CONTROLES).filter(([naam]) => naam !== 'bouwen' || bouwenVerwacht).map(([naam, workflow]) => {
    const runs = nodes
      .filter((n) => n.__typename === 'CheckRun' && n.name === naam
        && n.checkSuite?.app?.slug === 'github-actions' && n.checkSuite?.workflowRun?.file?.path === workflow)
      .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
    const laatste = runs.at(-1);
    return { naam, uitkomst: uitkomst(laatste), url: laatste?.detailsUrl || null };
  });
}

const login = (a) => a?.login || '(verwijderd account)';

function reviewsVan(pr) {
  return (pr.reviews?.nodes || []).map((r) => ({ login: login(r.author), state: r.state, datum: r.submittedAt, rol: r.authorAssociation, commit: r.commit?.oid }));
}

/** Samenvatting van een PR voor het overzicht en de detailpagina. */
function vatPrSamen(pr, paden) {
  const oordeel = beoordeel(paden);
  // Niet alle bestanden gezien: ga uit van inhoud die levens raakt (twee nalezers).
  const onvolledig = (pr.changedFiles ?? 0) > paden.length;
  if (onvolledig && !oordeel.kritiek) { oordeel.nodig = 2; oordeel.kritiek = true; }
  const kopSha = pr.headRefOid || pr.commits?.nodes?.[0]?.commit?.oid;
  const tel = telGoedkeuringen(reviewsVan(pr), login(pr.author), kopSha);
  const ctrl = controles(pr.commits?.nodes?.[0]?.commit, paden);
  return {
    nummer: pr.number,
    titel: pr.title,
    url: pr.url,
    auteur: login(pr.author),
    concept: pr.isDraft,
    basis: pr.baseRefName,
    kop: pr.headRefName,
    aangemaakt: pr.createdAt,
    bijgewerkt: pr.updatedAt,
    labels: (pr.labels?.nodes || []).map((l) => l.name),
    soorten: oordeel.labels,
    kritiek: oordeel.kritiek,
    nodig: oordeel.nodig,
    goedkeuringen: tel,
    onvolledig,
    controles: ctrl,
    aantalBestanden: pr.changedFiles ?? paden.length,
    bij: pr.additions,
    weg: pr.deletions,
  };
}

export async function overzicht(token, repo) {
  const { owner, name } = splitsRepo(repo);
  const data = await ghql(token, `query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: OPEN, first: 50, orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        nodes {
          number title url isDraft createdAt updatedAt baseRefName headRefName additions deletions changedFiles
          author { login }
          labels(first: 20) { nodes { name } }
          files(first: 100) { nodes { path } }
          ${REVIEWS} } }
          commits(last: 1) { nodes { commit { oid ${ROLLUP} } } }
        }
      }
      issues(states: OPEN, first: 50, orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        nodes {
          number title url createdAt updatedAt
          author { login }
          labels(first: 20) { nodes { name } }
          assignees(first: 10) { nodes { login } }
          comments { totalCount }
        }
      }
    }
  }`, { owner, name });
  const r = data.repository;
  return {
    prs: r.pullRequests.nodes.map((pr) => vatPrSamen(pr, (pr.files?.nodes || []).map((f) => f.path))),
    prsTotaal: r.pullRequests.totalCount,
    issues: r.issues.nodes.map((i) => ({
      nummer: i.number,
      titel: i.title,
      url: i.url,
      auteur: login(i.author),
      aangemaakt: i.createdAt,
      bijgewerkt: i.updatedAt,
      labels: (i.labels?.nodes || []).map((l) => l.name),
      toegewezen: (i.assignees?.nodes || []).map((a) => a.login),
      reacties: i.comments.totalCount,
      soort: soortIssue((i.labels?.nodes || []).map((l) => l.name)),
    })),
    issuesTotaal: r.issues.totalCount,
  };
}

/** Uit de labels van de issuesjablonen (.github/ISSUE_TEMPLATE). */
export function soortIssue(labels) {
  if (labels.includes('taak')) return 'taak';
  if (labels.includes('bronnenregister')) return 'bron voorstellen';
  if (labels.includes('te beoordelen') || labels.includes('inhoud')) return 'fout melden';
  return 'overig';
}

/** Alles voor de detailpagina van een PR, behalve de bestandsinhoud. */
export async function prDetail(token, repo, nummer) {
  const { owner, name } = splitsRepo(repo);
  const [data, rest] = await Promise.all([
    ghql(token, `query($owner: String!, $name: String!, $nr: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $nr) {
          number title url isDraft state body bodyHTML createdAt updatedAt baseRefName headRefName baseRefOid headRefOid
          additions deletions changedFiles
          author { login }
          labels(first: 20) { nodes { name } }
          files(first: 100) { nodes { path } }
          ${REVIEWS} body bodyHTML url } }
          comments(last: 50) { nodes { author { login } body bodyHTML createdAt url } }
          commits(last: 1) { nodes { commit { oid ${ROLLUP} } } }
        }
      }
    }`, { owner, name, nr: nummer }),
    gh(token, `/repos/${repo}/pulls/${nummer}`),
  ]);
  const pr = data.repository.pullRequest;
  if (!pr) return null;
  // Bestanden met hun status tegenover de merge-basis (zoals GitHub ze in de PR toont).
  const vergelijk = await gh(token, `/repos/${repo}/compare/${pr.baseRefOid}...${pr.headRefOid}`);
  const bestanden = (vergelijk.files || []).map((f) => ({
    pad: f.filename,
    vorigPad: f.previous_filename || null,
    status: f.status,
    bij: f.additions,
    weg: f.deletions,
    patch: f.patch ?? null,
    ...soortVanPad(f.filename),
    inhoud: isInhoudstekst(f.filename),
    landinfo: /^data\/landen\/[a-z]{2}\.json$/.test(f.filename),
    register: f.filename === 'data/bronnen/register.json',
  }));
  const samenvatting = vatPrSamen(pr, bestanden.map((b) => b.pad));
  const regels = magSamenvoegen({
    nodig: samenvatting.nodig,
    aantal: samenvatting.goedkeuringen.aantal,
    wijzigingen: samenvatting.goedkeuringen.wijzigingen,
    controles: samenvatting.controles,
    concept: pr.isDraft,
    mergeable: rest.mergeable_state,
    onvolledig: samenvatting.onvolledig,
    wijzigtControle: wijzigtControle(bestanden.map((b) => b.pad)),
  });
  return {
    ...samenvatting,
    staat: pr.state,
    tekst: pr.body,
    tekstHtml: pr.bodyHTML,
    basisSha: vergelijk.merge_base_commit?.sha || pr.baseRefOid,
    basisTipSha: pr.baseRefOid,
    kopSha: pr.headRefOid,
    samenvoegbaar: rest.mergeable,
    samenvoegStaat: rest.mergeable_state,
    regels,
    bestanden,
    bestandenTotaal: vergelijk.files?.length ?? 0,
    reviews: (pr.reviews?.nodes || []).map((r) => ({ login: login(r.author), state: r.state, datum: r.submittedAt, rol: r.authorAssociation, commit: r.commit?.oid, tekst: r.body, tekstHtml: r.bodyHTML, url: r.url })),
    reacties: (pr.comments?.nodes || []).map((c) => ({ login: login(c.author), datum: c.createdAt, tekst: c.body, tekstHtml: c.bodyHTML, url: c.url })),
  };
}

/** Oude en nieuwe inhoud van één bestand in een PR. */
export async function prBestand(token, repo, { pad, vorigPad, basis, kop, status }) {
  const [oud, nieuw] = await Promise.all([
    status === 'added' ? '' : bestand(token, repo, vorigPad || pad, basis),
    status === 'removed' ? '' : bestand(token, repo, pad, kop),
  ]);
  return { pad, oud: typeof oud === 'string' ? oud : JSON.stringify(oud, null, 2), nieuw: typeof nieuw === 'string' ? nieuw : JSON.stringify(nieuw, null, 2) };
}

export async function issueDetail(token, repo, nummer) {
  const { owner, name } = splitsRepo(repo);
  const data = await ghql(token, `query($owner: String!, $name: String!, $nr: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $nr) {
        number title url state stateReason body bodyHTML createdAt updatedAt
        author { login }
        labels(first: 30) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        comments(last: 50) { nodes { author { login } body bodyHTML createdAt url } }
      }
      labels(first: 100, orderBy: { field: NAME, direction: ASC }) { nodes { name description } }
      assignableUsers(first: 100) { nodes { login name } }
    }
  }`, { owner, name, nr: nummer });
  const i = data.repository.issue;
  if (!i) return null;
  const labels = (i.labels?.nodes || []).map((l) => l.name);
  return {
    nummer: i.number,
    titel: i.title,
    url: i.url,
    staat: i.state,
    reden: i.stateReason,
    auteur: login(i.author),
    aangemaakt: i.createdAt,
    tekst: i.body,
    tekstHtml: i.bodyHTML,
    labels,
    soort: soortIssue(labels),
    toegewezen: (i.assignees?.nodes || []).map((a) => a.login),
    reacties: (i.comments?.nodes || []).map((c) => ({ login: login(c.author), datum: c.createdAt, tekst: c.body, tekstHtml: c.bodyHTML, url: c.url })),
    alleLabels: data.repository.labels.nodes,
    toewijsbaar: data.repository.assignableUsers.nodes,
  };
}

/** Het bronnenregister op de standaardbranch, om voorgestelde bronnen te vergelijken. */
export async function register(token, repo, ref) {
  const tekst = await bestand(token, repo, 'data/bronnen/register.json', ref);
  const lijst = typeof tekst === 'string' ? JSON.parse(tekst || '[]') : tekst;
  return (Array.isArray(lijst) ? lijst : lijst.bronnen || []).map((b) => ({ id: b.id, naam: b.naam, url: b.url, licentie: b.licentie, toestemming: b.toestemming }));
}
