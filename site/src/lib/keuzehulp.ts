// Scherm van de keuzehulp (components/Keuzehulp.astro). De keuze zelf rekent lib/selectie.ts
// uit; het downloaden in de app doet lib/downloaden.ts. Op de website wordt niets gedownload:
// daar geeft de keuzehulp een link naar de app en een manifest voor het startprogramma.

import { KEUZE } from '../i18n/keuze';
import { TAALNAMEN, isTaal, type Taal } from '../i18n/talen';
import { bewaar, lees, vraagBlijvendeOpslag } from './app';
import { mb } from './kaarten';
import { kiesLanden } from './landkeuze';
import * as S from './selectie';
import { aanwezigheid, laadCatalogus, verwijderBlok, volledig, Wachtrij, zetTalen, type Aanwezig } from './downloaden';

type Modus = 'app' | 'eerste' | 'site';

const esc = (s: string) => s.replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]!);

async function catalogusOnline(): Promise<S.Catalogus | null> {
  try {
    const r = await fetch('/data/catalogus.json');
    const c = r.ok ? await r.json() : null;
    return S.isCatalogus(c) ? c : null;
  } catch {
    return null;
  }
}

export async function startKeuzehulp(root: HTMLElement) {
  const modus = (root.dataset.modus ?? 'app') as Modus;
  const taal: Taal = isTaal(root.dataset.taal) ? root.dataset.taal : 'nl';
  const t = KEUZE[taal];
  const app = modus !== 'site';
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`);
  const laden = $('kh-laden')!;
  const form = $<HTMLFormElement>('kh-form')!;

  const geladen = app ? await laadCatalogus() : await catalogusOnline();
  if (!geladen) { laden.textContent = t.geenCatalogus; return; }
  const cat: S.Catalogus = geladen;

  const landnaam = (c: string) => cat.landen.find((l) => l.code === c)?.naam[taal] ?? c.toUpperCase();

  // ---------- Vertrekpunt: link, bewaarde keuze of het eigen land ----------
  const vanLink = location.hash.length > 1 ? S.uitLink(cat, location.hash) : null;
  const bewaard = app ? S.geldigeKeuze(cat, lees('keuze', null)) : null;
  const gok = S.raadEigenLand(cat, { opgeslagen: lees<string[] | null>('landen', null), toesteltalen: navigator.languages, paginataal: taal });
  let keuze: S.Keuze = vanLink ?? bewaard ?? S.nieuweKeuze(cat, gok.land, 'eigen', taal);
  // In de app blijft de taal van het scherm altijd op het toestel.
  if (app && !keuze.talen.includes(taal)) keuze = { ...keuze, talen: cat.talen.filter((l) => l === taal || keuze.talen.includes(l)) };
  $('kh-geraden')!.hidden = !!(vanLink || bewaard) || gok.zeker;

  let aanwezig: Aanwezig = new Map();
  let opslag: S.Opslag | null = null;
  const vernieuwToestel = async () => {
    if (!app) return;
    aanwezig = await aanwezigheid(cat);
    opslag = await S.leesOpslag();
  };
  await vernieuwToestel();

  laden.textContent = vanLink && app ? t.uitLink : '';
  laden.hidden = !laden.textContent;
  form.hidden = false;

  // ---------- Vaste velden ----------
  const eigen = $<HTMLSelectElement>('kh-eigen')!;
  eigen.innerHTML = [...cat.landen]
    .sort((a, b) => landnaam(a.code).localeCompare(landnaam(b.code), taal))
    .map((l) => `<option value="${l.code}">${esc(landnaam(l.code))}</option>`).join('');
  const inhoud = (l: string) => cat.blokken.find((b) => b.id === `inhoud-${l}`);
  root.querySelectorAll<HTMLElement>('[data-taal-mb]').forEach((el) => { el.textContent = mb(inhoud(el.dataset.taalMb!)?.bytes ?? 0); });
  const eu7 = cat.blokken.find((b) => b.niveau === 'europa' && !b.zak);
  $('kh-europa-mb')!.textContent = eu7 ? mb(eu7.bytes) : '';

  const open = new Set<string>([keuze.eigen]);
  let resultaat: ReturnType<typeof siteResultaat> | null = null;

  function synchroniseer() {
    eigen.value = keuze.eigen;
    form.querySelectorAll<HTMLInputElement>('input[name="voorstel"]').forEach((r) => (r.checked = r.value === keuze.voorstel));
    const buren = cat.landen.find((l) => l.code === keuze.eigen)?.buren ?? [];
    $('kh-v-buren-uitleg')!.textContent = buren.length ? `${t.voorstellen.buren[1]} ${t.burenZijn(buren.map(landnaam).join(', '))}` : t.voorstellen.buren[1];
    $<HTMLInputElement>('kh-europa')!.checked = keuze.europa;
    form.querySelectorAll<HTMLInputElement>('input[name="taal"]').forEach((c) => {
      c.checked = keuze.talen.includes(c.value);
      c.disabled = app && c.value === taal;
    });
  }

  // ---------- Landen ----------
  const detailNaam = (d: S.Detail) => t.details[d][0];
  function landBlok(l: S.LandKeuze) {
    const c = l.code;
    const opties = [detailNaam(l.detail), l.lagen && t.lagen, l.routes && t.routes].filter(Boolean).join(' · ');
    const bytes = S.bytesPerLand(cat, keuze).get(c) ?? 0;
    const groot = bytes > S.GROOT_LAND;
    const routes = S.heeftRoutes(cat, c);
    const radio = (d: S.Detail) => `
      <div class="kh-optie">
        <input type="radio" name="kh-d-${c}" id="kh-d-${c}-${d}" value="${d}" data-k="detail" data-land="${c}" aria-describedby="kh-d-${c}-${d}-u"${l.detail === d ? ' checked' : ''}>
        <label for="kh-d-${c}-${d}">${esc(detailNaam(d))} <span class="kh-mb">${mb(S.bytesVoorDetail(cat, l, d))}</span></label>
        <span class="klein" id="kh-d-${c}-${d}-u">${esc(t.details[d][1])}</span>
      </div>`;
    const vink = (k: 'lagen' | 'routes', uitleg: string, bytes: number) => `
      <div class="kh-optie">
        <input type="checkbox" id="kh-${k}-${c}" data-k="${k}" data-land="${c}" aria-describedby="kh-${k}-${c}-u"${l[k] ? ' checked' : ''}>
        <label for="kh-${k}-${c}">${esc(t[k])} <span class="kh-mb">${mb(bytes)}</span></label>
        <span class="klein" id="kh-${k}-${c}-u">${esc(uitleg)}</span>
      </div>`;
    const blokBytes = (soort: S.Soort) => cat.blokken.filter((b) => b.land === c && b.soort === soort).reduce((s, b) => s + b.bytes, 0);
    return `
      <details class="kh-land" data-land="${c}"${open.has(c) ? ' open' : ''}>
        <summary><strong>${esc(landnaam(c))}</strong>${c === keuze.eigen ? ` <span class="klein">${esc(t.eigenLabel)}</span>` : ''}
          <span class="klein">${esc(opties)}</span> <span class="kh-mb">${mb(bytes)}</span></summary>
        <div>
          <fieldset><legend>${esc(t.detailTitel)}</legend>${S.DETAILS.map(radio).join('')}</fieldset>
          ${vink('lagen', t.lagenUitleg, blokBytes('lagen'))}
          ${routes ? vink('routes', t.routesUitleg, blokBytes('routes')) : ''}
          ${groot ? `<p class="melding waarschuwing klein">${esc(t.grootLand(landnaam(c), mb(bytes)))}</p>` : ''}
        </div>
      </details>`;
  }

  function toonLanden() {
    const houder = $('kh-landen')!;
    const kies = keuze.voorstel === 'kies'
      ? `<fieldset><legend>${esc(t.landenTitel)}</legend>${cat.landen.map((l) => `
          <div class="kh-optie">
            <input type="checkbox" id="kh-land-${l.code}" data-k="land" value="${l.code}"${keuze.landen.some((x) => x.code === l.code) ? ' checked' : ''}${l.code === keuze.eigen ? ' disabled' : ''}>
            <label for="kh-land-${l.code}">${esc(landnaam(l.code))}${l.code === keuze.eigen ? ` <span class="klein">${esc(t.eigenLabel)}</span>` : ''}</label>
          </div>`).join('')}</fieldset>`
      : '';
    houder.innerHTML = kies + keuze.landen.map(landBlok).join('');
    houder.querySelectorAll<HTMLDetailsElement>('details[data-land]').forEach((d) =>
      d.addEventListener('toggle', () => (d.open ? open.add(d.dataset.land!) : open.delete(d.dataset.land!))));
  }

  // ---------- Samenvatting ----------
  function rekening() {
    const blokken = S.blokkenVoor(cat, keuze);
    const p = S.plan(blokken, volledig(aanwezig), cat);
    // Van een gedeeltelijk binnengehaald blok telt alleen wat nog ontbreekt.
    const te = p.toevoegen.reduce((s, b) => s + b.bytes - (aanwezig.get(b.id)?.bytes ?? 0), 0);
    return { blokken, plan: p, te, totaal: S.downloadBytes(blokken) };
  }

  function toonSamen() {
    const r = rekening();
    const oordeel = S.beoordeel(app ? r.te : r.totaal, app ? opslag : { quota: undefined }, app ? S.leesVerbinding() : {});
    const regels: string[] = [];
    if (app) {
      regels.push(r.plan.toevoegen.length ? t.teDownloaden(mb(r.te), r.plan.toevoegen.length) : t.niets);
      regels.push(t.totaal(mb(r.totaal)));
      if (oordeel.vrij !== undefined) regels.push(t.vrij(mb(oordeel.vrij)));
    } else {
      regels.push(t.totaal(mb(r.totaal)));
    }
    const ws = oordeel.waarschuwingen.filter((w) => app || w === 'groot');
    const soort = (w: S.Waarschuwing) => (w === 'te-weinig' ? 'gevaar' : 'waarschuwing');
    $('kh-samen')!.innerHTML = `<p>${regels.map(esc).join(' ')}</p>` +
      ws.map((w) => `<p class="melding ${soort(w)} klein" data-w="${w}">${esc(t.w[w])}</p>`).join('');
    if (!app) toonResultaat();
    return { ...r, oordeel };
  }

  function toonAlles() {
    synchroniseer();
    const focus = document.activeElement?.id;
    toonLanden();
    if (focus && document.activeElement?.id !== focus) document.getElementById(focus)?.focus();
    toonSamen();
    if (app) toonToestel();
    if (!app) history.replaceState(null, '', `#${S.naarLink(keuze)}`);
  }

  // ---------- Wijzigingen ----------
  form.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    const k = el.dataset.k;
    const was = keuze.voorstel;
    if (el.name === 'eigen') keuze = S.zetEigenLand(cat, keuze, el.value, taal), open.add(el.value), ($('kh-geraden')!.hidden = true);
    else if (el.name === 'voorstel') keuze = S.pasVoorstelToe(cat, keuze, el.value as S.Voorstel);
    else if (k === 'land') keuze = S.zetLand(cat, keuze, el.value, el.checked);
    else if (k === 'detail') keuze = S.wijzigLand(keuze, el.dataset.land!, { detail: el.value as S.Detail });
    else if (k === 'lagen' || k === 'routes') keuze = S.wijzigLand(keuze, el.dataset.land!, { [k]: el.checked });
    else if (el.name === 'europa') keuze = { ...keuze, europa: el.checked };
    else if (el.name === 'taal') {
      const talen = el.checked ? [...keuze.talen, el.value] : keuze.talen.filter((x) => x !== el.value);
      if (!talen.length) { el.checked = true; return; }
      keuze = { ...keuze, talen: cat.talen.filter((x) => talen.includes(x)) };
    } else return;
    // "Alles" aanpassen is niet meer alles.
    if (was === 'alles' && el.name !== 'voorstel' && el.name !== 'eigen') keuze = { ...keuze, voorstel: 'kies' };
    toonAlles();
  });

  if (!app) { toonAlles(); verbindSite(); return; }

  // ---------- App: bewaren en downloaden ----------
  const melding = $('kh-melding')!;
  const pauze = $<HTMLButtonElement>('kh-pauze')!;
  let rij: Wachtrij | null = null;
  const voortgang = new Map<string, number>();

  async function bewaarKeuze() {
    bewaar('keuze', keuze);
    kiesLanden(keuze.landen.map((l) => l.code));
    melding.textContent = t.talenBezig;
    await zetTalen(keuze.talen);
    melding.textContent = '';
  }

  $('kh-bewaar')!.addEventListener('click', async () => {
    await bewaarKeuze();
    melding.textContent = t.bewaard;
    toonToestel();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = toonSamen();
    if (!s.oordeel.past) { $('kh-samen')!.querySelector<HTMLElement>('[data-w="te-weinig"]')?.scrollIntoView({ block: 'center' }); return; }
    if (s.plan.toevoegen.length && !navigator.onLine) { melding.textContent = t.geenVerbinding; $('kh-toestel')!.hidden = false; return; }
    const zwaar = s.oordeel.waarschuwingen.filter((w) => w === 'groot' || w === 'mobiel');
    if (zwaar.length && !confirm(`${zwaar.map((w) => t.w[w]).join('\n')}\n\n${t.doorgaan}`)) return;
    await bewaarKeuze();
    await vraagBlijvendeOpslag();
    start(s.plan.toevoegen);
  });

  function start(blokken: S.Blok[]) {
    voortgang.clear();
    rij = new Wachtrij(blokken, {
      voortgang: (b, n) => { voortgang.set(b.id, n); werkBalk(b); },
      klaar: async (b) => { aanwezig.set(b.id, { delen: b.bestanden.length, van: b.bestanden.length, bytes: b.bytes }); toonToestel(); },
      fout: () => toonToestel(),
      staat: (st) => toonStaat(st),
    });
    $('kh-toestel')!.hidden = false;
    toonToestel();
    $('kh-toestel')!.scrollIntoView({ block: 'start' });
    rij.start();
  }

  pauze.addEventListener('click', () => {
    if (!rij) return;
    if (rij.staat === 'bezig') rij.pauzeer();
    else if (navigator.onLine) rij.start();
    else melding.textContent = t.geenVerbinding;
  });

  async function toonStaat(st: string) {
    pauze.hidden = st === 'klaar';
    pauze.textContent = st === 'bezig' ? t.pauzeren : t.hervatten;
    form.querySelector<HTMLButtonElement>('#kh-download')!.disabled = st === 'bezig';
    if (st === 'gepauzeerd') melding.textContent = rij!.fouten.size && !navigator.onLine ? t.geenVerbinding : t.gepauzeerd(rij!.resterend.length);
    if (st === 'klaar') {
      await vernieuwToestel();
      melding.textContent = rij!.fouten.size ? t.mislukt(rij!.fouten.size) : t.klaar;
      const naarApp = $('kh-naar-app');
      if (naarApp) naarApp.hidden = false;
      toonSamen();
      toonToestel();
    }
    if (st === 'bezig') werkMelding();
  }

  function werkMelding() {
    const b = rij?.huidigBlok;
    if (b) melding.textContent = t.bezig(bloknaam(b, true), rij!.positie + 1, rij!.blokken.length);
  }

  function werkBalk(b: S.Blok) {
    const balk = root.querySelector<HTMLProgressElement>(`progress[data-blok="${b.id}"]`);
    if (balk) balk.value = Math.min(1, (voortgang.get(b.id) ?? 0) / (b.bytes || 1));
    werkMelding();
  }

  // ---------- App: wat staat er op dit toestel ----------
  function bloknaam(b: S.Blok, metLand = false) {
    const land = b.land && metLand ? `${landnaam(b.land)}: ` : '';
    if (b.soort === 'inhoud') return TAALNAMEN[b.taal as Taal] ?? b.taal!;
    if (b.niveau === 'europa') return b.zak ? `${t.europaGroep}: ${detailNaam('overzicht')}` : t.europa;
    if (b.soort === 'lagen') return land + t.lagen;
    if (b.soort === 'routes') return land + t.routes;
    return land + detailNaam(b.niveau as S.Detail);
  }

  function blokRij(b: S.Blok, inKeuze: boolean, metLand = false) {
    const a = aanwezig.get(b.id);
    const bezig = rij?.huidigBlok?.id === b.id;
    const fout = rij?.fouten.has(b.id);
    let staat: string;
    let label = '';
    if (b.kern) staat = t.staat.app, label = 'officieel';
    else if (bezig) staat = t.staat.bezig;
    else if (a && a.delen === a.van) staat = t.staat.op, label = 'officieel';
    else if (fout) staat = t.staat.fout, label = 'onbevestigd';
    else if (a) staat = t.delen(a.delen, a.van), label = 'onbevestigd';
    else staat = t.staat.mist, label = 'onbevestigd';
    const naam = bloknaam(b, metLand);
    const knop = !b.kern && a && !bezig
      ? `<button type="button" class="knop gevaar" data-verwijder="${b.id}" aria-label="${esc(`${t.verwijderen}: ${bloknaam(b, true)}`)}">${esc(t.verwijderen)}</button>` : '';
    const balk = bezig || (inKeuze && rij?.staat === 'gepauzeerd' && rij.resterend.includes(b))
      ? `<progress max="1" value="${Math.min(1, (voortgang.get(b.id) ?? a?.bytes ?? 0) / (b.bytes || 1))}" data-blok="${b.id}" aria-label="${esc(bloknaam(b, true))}"></progress>` : '';
    return `<div class="kh-blok"><div><strong>${esc(naam)}</strong> <span class="kh-mb">${mb(b.bytes)}</span><br>
      <span class="label ${label}">${esc(staat)}</span></div><div>${knop}</div>${balk}</div>`;
  }

  function toonToestel() {
    const sectie = $('kh-toestel')!;
    const gewenst = S.blokkenVoor(cat, keuze);
    const ids = new Set(gewenst.map((b) => b.id));
    const extra = cat.blokken.filter((b) => !b.kern && aanwezig.has(b.id) && !ids.has(b.id));
    sectie.hidden = !bewaard && !rij && !aanwezig.size && !lees('keuze', null);
    const groepen: [string, S.Blok[]][] = [
      [t.europaGroep, gewenst.filter((b) => b.niveau === 'europa')],
      ...keuze.landen.map((l): [string, S.Blok[]] => [landnaam(l.code), gewenst.filter((b) => b.land === l.code)]),
      [t.talenGroep, gewenst.filter((b) => b.kern)],
    ];
    $('kh-blokken')!.innerHTML = groepen.filter(([, l]) => l.length).map(([titel, lijst]) => {
      const op = lijst.filter((b) => b.kern || volledig(aanwezig).has(b.id));
      const som = lijst.every((b) => b.kern) ? `${op.length}/${lijst.length}` : t.groep(op.length, lijst.length, mb(S.downloadBytes(lijst)));
      return `<h3>${esc(titel)} <span class="kh-mb">${esc(som)}</span></h3>${lijst.map((b) => blokRij(b, true)).join('')}`;
    }).join('');
    const bytesExtra = extra.reduce((s, b) => s + (aanwezig.get(b.id)?.bytes ?? 0), 0);
    $('kh-extra')!.innerHTML = extra.length
      ? `<h3>${esc(t.extraOpToestel)}</h3>${extra.map((b) => blokRij(b, false, true)).join('')}
         <div class="knoppen"><button type="button" class="knop gevaar" id="kh-opruimen">${esc(t.opruimen(mb(bytesExtra)))}</button></div>`
      : '';
    root.querySelectorAll<HTMLButtonElement>('[data-verwijder]').forEach((k) => k.addEventListener('click', async () => {
      const b = cat.blokken.find((x) => x.id === k.dataset.verwijder)!;
      if (!confirm(t.verwijderVraag(bloknaam(b, true)))) return;
      await verwijderBlok(b);
      await vernieuwToestel();
      toonSamen(); toonToestel();
    }));
    $('kh-opruimen')?.addEventListener('click', async () => {
      if (!confirm(t.opruimenVraag(extra.length, mb(bytesExtra)))) return;
      for (const b of extra) await verwijderBlok(b);
      await vernieuwToestel();
      toonSamen(); toonToestel();
    });
  }

  addEventListener('online', () => toonSamen());
  addEventListener('offline', () => toonSamen());
  toonAlles();

  // ---------- Website: meenemen naar de app, of manifest voor het startprogramma ----------
  function toonResultaat() { resultaat = siteResultaat(root, cat, keuze, taal); }
  function verbindSite() {
    const bewaarBestand = (naam: string, inhoud: string, type: string) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([inhoud], { type }));
      a.download = naam;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    };
    $('kh-manifest')!.addEventListener('click', () => {
      if (resultaat) bewaarBestand('planb72-pakketten.json', JSON.stringify(resultaat.manifest, null, 2), 'application/json');
    });
    $('kh-links-txt')!.addEventListener('click', () => {
      if (resultaat) bewaarBestand('planb72-links.txt', resultaat.manifest.bestanden.map((f) => `${f.url}\t${f.pad}`).join('\n') + '\n', 'text/plain');
    });
    $('kh-kopieer')!.addEventListener('click', async () => {
      if (!resultaat) return;
      const url = new URL(resultaat.appUrl, location.href).href;
      try { await navigator.clipboard.writeText(url); $('kh-kopie-staat')!.textContent = t.site.gekopieerd; } catch { $('kh-kopie-staat')!.textContent = url; }
    });
  }
}

// De website-kant staat apart, zodat ze de app-code niet nodig heeft.
export function siteResultaat(root: HTMLElement, cat: S.Catalogus, keuze: S.Keuze, taal: Taal) {
  const t = KEUZE[taal];
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const link = S.naarLink(keuze);
  const appUrl = `${root.dataset.kiezen}#${link}`;
  $('kh-open-app').setAttribute('href', appUrl);
  const m = S.maakManifest(cat, keuze, location.origin.startsWith('http://localhost') ? location.origin : cat.bron);
  $('kh-links-titel').textContent = `${t.site.links(m.bestanden.length)} (${mb(m.bytes)})`;
  $('kh-links').innerHTML = m.bestanden.map((f) => `<li><a href="${esc(f.url)}" download>${esc(f.pad)}</a> <span class="kh-mb">${mb(f.bytes)}</span></li>`).join('');
  $('kh-resultaat').hidden = false;
  return { appUrl, manifest: m };
}
