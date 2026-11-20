// Zoeken in site en app met Pagefind (zie scripts/zoekindex.mjs). Twee indexen, elk per taal:
//   /pagefind/       de app; zit in de offline kern van de service worker.
//   /pagefind-site/  de websitepagina's; alleen online, en dan met de app-index samengevoegd.
// Pagefind kiest zelf de taal van <html lang>, dus je zoekt altijd in de taal van de pagina.
import { zoektekst, type Soort, type Zoektekst } from '../i18n/zoeken';

const PER_KEER = 10;

type Data = { url: string; excerpt: string; meta: Record<string, string> };
type Resultaat = { id: string; data: () => Promise<Data> };
type Pagefind = {
  options: (o: Record<string, unknown>) => Promise<void>;
  mergeIndex: (pad: string, o?: Record<string, unknown>) => Promise<void>;
  debouncedSearch: (term: string, o?: Record<string, unknown>, ms?: number) => Promise<{ results: Resultaat[] } | null>;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * De opmaak van een zoekpaneel. Wordt op de server gebruikt (Zoekpaneel.astro, /app/zoeken/) en in
 * de browser (zoekvenster). Het <search>-element maakt er een zoek-landmark van; het aantal
 * resultaten staat in een statusregio, zodat een schermlezer het meldt zonder de lijst voor te lezen.
 */
export function paneelHTML(id: string, t: Zoektekst, autofocus = false): string {
  return `<search class="zoekpaneel" data-zoekpaneel aria-label="${esc(t.titel)}">` +
    `<label for="${id}-veld">${esc(t.label)}</label>` +
    `<input id="${id}-veld" class="zoekveld" type="search" name="q" placeholder="${esc(t.voorbeeld)}" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-describedby="${id}-status" aria-controls="${id}-lijst"${autofocus ? ' autofocus' : ''} data-zoekveld>` +
    `<p id="${id}-status" class="klein zoekstatus" role="status" data-zoekstatus></p>` +
    `<ol id="${id}-lijst" class="zoekresultaten" aria-label="${esc(t.resultaten)}" data-zoeklijst></ol>` +
    `<button type="button" class="knop zoekmeer" hidden data-zoekmeer>${esc(t.meer)}</button>` +
    `</search>`;
}

// ---------- Pagefind laden ----------

let laden: Promise<Pagefind | null> | null = null;

async function laadPagefind(metWebsite: boolean): Promise<Pagefind | null> {
  // Een tweede, aparte kopie (?alleen-app) als de website-index onderweg wegvalt; de service
  // worker vindt dat bestand offline ook (hij negeert de zoekparameter als het moet).
  const pad = metWebsite ? '/pagefind/pagefind.js' : '/pagefind/pagefind.js?alleen-app';
  try {
    const pf: Pagefind = await import(/* @vite-ignore */ pad);
    await pf.options({ excerptLength: 18 });
    if (metWebsite) {
      // Alleen samenvoegen als de website-index bereikbaar is (offline in de app: niet).
      const r = await fetch('/pagefind-site/pagefind-entry.json').catch(() => null);
      // Lager gewicht: wie zoekt, zoekt meestal noodinformatie, niet de pagina's over het project.
      if (r?.ok) await pf.mergeIndex('/pagefind-site/', { indexWeight: 0.4 }).catch(() => {});
    }
    return pf;
  } catch {
    // In de ontwikkelserver bestaat de index niet.
    return null;
  }
}

function pagefind(): Promise<Pagefind | null> {
  laden ??= laadPagefind(true);
  return laden;
}

// ---------- Een zoekpaneel ----------

function startPaneel(paneel: HTMLElement) {
  paneel.dataset.klaar = '';
  const t = zoektekst();
  const veld = paneel.querySelector<HTMLInputElement>('[data-zoekveld]')!;
  const status = paneel.querySelector<HTMLElement>('[data-zoekstatus]')!;
  const lijst = paneel.querySelector<HTMLOListElement>('[data-zoeklijst]')!;
  const meer = paneel.querySelector<HTMLButtonElement>('[data-zoekmeer]')!;
  let volgnummer = 0;
  let alle: Resultaat[] = [];

  const links = () => [...lijst.querySelectorAll<HTMLAnchorElement>(':scope > li > a')];

  async function toon(aantal: number) {
    const begin = lijst.children.length;
    const data = await Promise.all(alle.slice(begin, begin + aantal).map((r) => r.data()));
    const offline = !navigator.onLine;
    for (const d of data) {
      const soort: Soort = d.meta?.soort && d.meta.soort in t.soort ? (d.meta.soort as Soort) : 'app';
      // Websitepagina's staan niet in de offline kern van de app.
      const label = soort === 'website' && offline ? `${t.soort.website} (${t.alleenOnline})` : t.soort[soort];
      const li = document.createElement('li');
      li.className = `zoekresultaat soort-${soort}`;
      // Het fragment komt van Pagefind: tekst uit de eigen pagina's, al ontsnapt, met <mark> rond de treffer.
      li.innerHTML =
        `<a href="${esc(d.url)}"><span class="zoeksoort">${esc(label)}<span class="sr-only">: </span></span>` +
        `<span class="zoektitel">${esc(d.meta?.title ?? d.url)}</span></a>` +
        `<p class="zoekfragment">${d.excerpt}</p>`;
      lijst.append(li);
    }
    meer.hidden = lijst.children.length >= alle.length;
    return begin;
  }

  async function zoek(opnieuw = false): Promise<void> {
    const nr = ++volgnummer;
    const term = veld.value.trim();
    if (term.length < 2) {
      alle = [];
      lijst.replaceChildren();
      meer.hidden = true;
      status.textContent = term ? t.hint : '';
      return;
    }
    const pf = await pagefind();
    if (nr !== volgnummer) return;
    if (!pf) { status.textContent = t.nietBeschikbaar; return; }
    try {
      const r = await pf.debouncedSearch(term, {}, 150);
      // null: een nieuwere zoekopdracht heeft deze vervangen.
      if (!r || nr !== volgnummer) return;
      alle = r.results;
      lijst.replaceChildren();
      await toon(PER_KEER);
    } catch {
      // Meestal: de website-index viel weg (verbinding verbroken). Dan alleen in de app zoeken.
      if (opnieuw) { status.textContent = t.nietBeschikbaar; return; }
      laden = laadPagefind(false);
      return zoek(true);
    }
    if (nr !== volgnummer) return;
    status.textContent = alle.length
      ? t.aantal(alle.length, term) + (alle.length > PER_KEER ? ' ' + t.getoond(PER_KEER) : '')
      : t.niets(term);
  }

  veld.addEventListener('input', () => void zoek());
  // De index alvast laden zodra iemand in het veld komt.
  veld.addEventListener('focus', () => void pagefind(), { once: true });

  // Pijltje omlaag naar de resultaten, Enter opent het eerste resultaat.
  veld.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    const eerste = links()[0];
    if (e.key === 'ArrowDown' && eerste) { e.preventDefault(); eerste.focus(); }
    else if (e.key === 'Enter' && eerste) { e.preventDefault(); eerste.click(); }
  });
  // Pijltjes tussen de resultaten; omhoog vanaf het eerste terug naar het veld.
  lijst.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const l = links();
    const i = l.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowDown') l[Math.min(i + 1, l.length - 1)].focus();
    else if (i === 0) veld.focus();
    else l[i - 1].focus();
  });

  meer.addEventListener('click', async () => {
    const begin = await toon(PER_KEER);
    // De focus naar het eerste nieuwe resultaat: de knop zelf kan net verdwenen zijn.
    links()[begin]?.focus();
  });

  // Op de zoekpagina: meteen in het veld, en /app/zoeken/?q=water zoekt meteen.
  if (!paneel.closest('dialog')) {
    const q = new URLSearchParams(location.search).get('q');
    if (q) { veld.value = q; void zoek(); }
    veld.focus();
  }
}

// ---------- Het zoekvenster in de kop ----------

function maakVenster(): HTMLDialogElement {
  const t = zoektekst();
  const venster = document.createElement('dialog');
  venster.id = 'zoekvenster';
  venster.className = 'zoekvenster';
  venster.setAttribute('aria-labelledby', 'zoekvenster-titel');
  // Klik buiten het venster sluit het (Esc en de terug-gebaren sluiten een modaal venster altijd).
  venster.setAttribute('closedby', 'any');
  venster.innerHTML =
    `<div class="zoekvenster-kop"><h2 id="zoekvenster-titel">${esc(t.titel)}</h2>` +
    `<button type="button" class="themaknop" commandfor="zoekvenster" command="close" data-zoeksluit>` +
    `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>` +
    `<span class="sr-only">${esc(t.sluiten)}</span></button></div>` +
    paneelHTML('zoekvenster', t, true);
  document.body.append(venster);
  return venster;
}

function startZoekvenster() {
  if (!document.querySelector('[data-zoekknop]') || document.getElementById('zoekvenster')) return;
  const venster = maakVenster();
  const veld = venster.querySelector<HTMLInputElement>('[data-zoekveld]')!;

  const open = () => {
    if (!venster.open) venster.showModal();
    veld.focus();
    veld.select();
  };
  // Bij openen de vorige zoekterm selecteren, zodat je meteen een nieuwe kunt typen.
  venster.addEventListener('command', (e) => { if ((e as Event & { command: string }).command === 'show-modal') requestAnimationFrame(() => veld.select()); });

  // Browsers zonder Invoker Commands (command/commandfor): dezelfde knoppen met een klik-handler.
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    document.querySelectorAll('[data-zoekknop]').forEach((k) => k.addEventListener('click', open));
    venster.querySelector('[data-zoeksluit]')?.addEventListener('click', () => venster.close());
  }

  // Klik buiten het venster, ook waar closedby="any" nog niet bestaat (Safari). De positie
  // telt, niet het doel: het venster zelf is ook het doel voor klikken op zijn binnenrand.
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const buiten = (e: PointerEvent) => {
      const r = venster.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let buitenGedrukt = false;
    venster.addEventListener('pointerdown', (e) => { buitenGedrukt = buiten(e); });
    venster.addEventListener('pointerup', (e) => { if (buitenGedrukt && buiten(e)) venster.close(); });
  }

  // Sneltoetsen: / (niet tijdens het typen in een veld) en Ctrl+K of Cmd+K.
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.isComposing || e.altKey) return;
    const typen = (e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !typen;
    const k = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k';
    if (!slash && !k) return;
    e.preventDefault();
    // Op de zoekpagina zelf naar het veld van de pagina; elders het zoekvenster.
    const paginaveld = document.querySelector<HTMLInputElement>('main [data-zoekveld]');
    if (paginaveld && !venster.open) { paginaveld.focus(); paginaveld.select(); }
    else open();
  });
}

/** Zet het zoekvenster en elk zoekpaneel op de pagina op (één keer). */
export function startZoeken() {
  startZoekvenster();
  document.querySelectorAll<HTMLElement>('[data-zoekpaneel]:not([data-klaar])').forEach(startPaneel);
}
