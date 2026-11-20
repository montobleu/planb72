// Maakt teksten functioneel, bij het bouwen en in elke taal:
// 1. Noemt een onderdeel (een ##-sectie) een soort plek die op de kaart staat (schuilplek,
//    ziekenhuis, AED, ...), dan komt onder dat onderdeel een rij knoppen "Op de kaart" die de
//    kaart openen met die laag aan en meteen de dichtstbijzijnde plekken tonen.
// 2. De eerste vermelding van een hulpmiddel uit de app (gezinsnoodplan, noodpakket, kompas, ...)
//    wordt een link naar dat hulpmiddel.
// 3. Noodnummers in de tekst worden aantikbaar (tel:).
// Koppen, bestaande links, verwijsnummers en de bronnenlijst blijven ongemoeid.

const TALEN = ['nl', 'fr', 'de', 'en'];

/** Kaartlagen: id, herkenning per taal, naam per taal. */
const LAGEN = [
  { id: 'schuilplekken', re: {
      nl: /schuil(plaats|plek|kelder|ruimte)|bunker|ondergrondse (parking|garage|parkeergarage)|metrostation/i,
      fr: /\babris?\b|refuge|parking souterrain|station de métro/i,
      de: /schutz(raum|räume|ort)|bunker|tiefgarage|u-bahn/i,
      en: /shelter|bunker|underground car park|metro station/i },
    naam: { nl: 'Mogelijke schuilplekken', fr: 'Abris possibles', de: 'Mögliche Schutzorte', en: 'Possible shelters' } },
  { id: 'ziekenhuizen', re: {
      nl: /ziekenhuis|spoedgevallen|spoeddienst/i, fr: /hôpita(l|ux)|urgences/i, de: /krankenhaus|notaufnahme/i, en: /hospital|emergency department/i },
    naam: { nl: 'Ziekenhuizen', fr: 'Hôpitaux', de: 'Krankenhäuser', en: 'Hospitals' } },
  { id: 'aed', re: { nl: /\bAED\b|defibrillator/, fr: /\bDEA\b|défibrillateur/i, de: /\bAED\b|defibrillator/i, en: /\bAED\b|defibrillator/i },
    naam: { nl: 'AED-toestellen', fr: 'Défibrillateurs (DEA)', de: 'AED-Geräte', en: 'AEDs' } },
  { id: 'apotheken', re: { nl: /apothe(ek|ken|ker)/i, fr: /pharmacie/i, de: /apotheke/i, en: /pharmac(y|ies)/i },
    naam: { nl: 'Apotheken', fr: 'Pharmacies', de: 'Apotheken', en: 'Pharmacies' } },
  { id: 'drinkwater', re: {
      nl: /drinkwater(punt|kraan|fontein)|waterpunt|tappunt/i, fr: /point d['’]eau|fontaine/i, de: /trinkwasser(stelle|brunnen)|wasserstelle|trinkbrunnen/i, en: /drinking[- ]water point|water point|drinking fountain/i },
    naam: { nl: 'Drinkwater', fr: 'Eau potable', de: 'Trinkwasser', en: 'Drinking water' } },
  { id: 'brandweer', re: { nl: /brandweer(kazerne|post)/i, fr: /caserne de pompiers|poste de secours/i, de: /feuerwache|feuerwehrhaus/i, en: /fire station/i },
    naam: { nl: 'Brandweer', fr: 'Pompiers', de: 'Feuerwehr', en: 'Fire service' } },
  { id: 'politie', re: { nl: /politie(kantoor|post)|commissariaat/i, fr: /commissariat|poste de police/i, de: /polizei(wache|dienststelle|revier)/i, en: /police station/i },
    naam: { nl: 'Politie', fr: 'Police', de: 'Polizei', en: 'Police' } },
  { id: 'overheid', re: { nl: /gemeentehuis|stadhuis/i, fr: /maison communale|hôtel de ville|mairie/i, de: /rathaus|gemeindeamt/i, en: /town hall|city hall/i },
    naam: { nl: 'Gemeentehuizen', fr: 'Maisons communales', de: 'Gemeindehäuser', en: 'Town halls' } },
  { id: 'dierenarts', re: { nl: /dierenarts/i, fr: /vétérinaire/i, de: /tierarzt|tierärzt/i, en: /\bvets?\b|veterinar/i },
    naam: { nl: 'Dierenartsen', fr: 'Vétérinaires', de: 'Tierärzte', en: 'Vets' } },
  { id: 'nucleair', re: { nl: /kerncentrale|nucleaire (site|installatie)/i, fr: /centrale nucléaire|site nucléaire/i, de: /kernkraftwerk|kerntechnische anlage/i, en: /nuclear (power plant|site|installation)/i },
    naam: { nl: 'Nucleaire zones', fr: 'Zones nucléaires', de: 'Nukleare Zonen', en: 'Nuclear zones' } },
];

/** Hulpmiddelen in de app; alleen de eerste vermelding per tekst wordt een link. */
const HULPMIDDELEN = [
  { pad: '/app/noodplan/', re: { nl: /gezinsnoodplan/i, fr: /plan d['’]urgence (familial|de la famille)/i, de: /familien-?notfallplan|notfallplan/i, en: /family emergency plan/i } },
  { pad: '/app/checklists/', re: { nl: /noodpakket|vluchttas/i, fr: /kit d['’]urgence|sac d['’](évacuation|urgence)/i, de: /notgepäck|notfallrucksack|fluchtgepäck|notfallset/i, en: /emergency kit|grab bag|go bag/i } },
  { pad: '/app/voorraad/', re: { nl: /noodvoorraad/i, fr: /réserves? d['’]urgence/i, de: /notvorrat/i, en: /emergency supplies/i } },
  { pad: '/app/kompas/', re: { nl: /\bkompas\b/i, fr: /\bboussole\b/i, de: /\bkompass\b/i, en: /\bcompass\b/i } },
  { pad: '/app/signalen/', re: { nl: /\bmorse\b|SOS-signaal/i, fr: /\bmorse\b/i, de: /\bmorse/i, en: /\bmorse\b/i } },
  { pad: '/app/noodnummers/', re: { nl: /noodnummers/i, fr: /numéros d['’]urgence/i, de: /notrufnummern/i, en: /emergency numbers/i } },
  { pad: '/app/info/', re: { nl: /\bBE-Alert\b/, fr: /\bBE-Alert\b/, de: /\bBE-Alert\b/, en: /\bBE-Alert\b/ } },
];

/** Noodnummers die aantikbaar worden (België; aanvullen met de landinfo van andere landen). */
const NUMMERS = /(?<![\d\w.,/])(112|101|1722|1733|1771|1813|1712|070 ?245 ?245|116 ?000|0800 ?32 ?123|0800 ?65 ?0 ?65|0800 ?87 ?087|078 ?35 ?35 ?00)(?![\d\w]|[.,]\d|\.[a-z])/g;

const KNOPTEKST = { nl: 'Op de kaart:', fr: 'Sur la carte :', de: 'Auf der Karte:', en: 'On the map:' };

const isElement = (n, tag) => n && n.type === 'element' && (!tag || n.tagName === tag);
const tekstVan = (n) => (n.type === 'text' ? n.value : (n.children || []).map(tekstVan).join(''));
const klassen = (n) => [].concat(n.properties?.className ?? []);

function taalVan(file) {
  const pad = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
  const t = /\/content\/[^/]+\/(fr|de|en)\//.exec(pad)?.[1];
  return TALEN.includes(t) ? t : 'nl';
}

const appPad = (taal, pad) => (taal === 'nl' || pad.startsWith('/app/route/') ? pad : `/${taal}${pad}`);

/** Tekst zonder links, koppen, verwijsnummers en code, voor de herkenning per sectie. */
function leesbareTekst(n) {
  if (n.type === 'text') return n.value;
  if (n.type !== 'element' || ['a', 'sup', 'code', 'pre'].includes(n.tagName)) return '';
  return (n.children || []).map(leesbareTekst).join(' ');
}

function kaartRij(lagen, taal) {
  const kinderen = [{ type: 'element', tagName: 'span', properties: { className: ['op-kaart-label'] }, children: [{ type: 'text', value: KNOPTEKST[taal] }] }];
  for (const l of lagen) {
    kinderen.push({ type: 'text', value: ' ' });
    kinderen.push({
      type: 'element', tagName: 'a',
      properties: { href: `${appPad(taal, '/app/kaart/')}?laag=${l.id}&dichtstbij=1`, className: ['kaartknop'] },
      children: [{ type: 'text', value: l.naam[taal] }],
    });
  }
  return { type: 'element', tagName: 'p', properties: { className: ['op-kaart', 'niet-afdrukken'] }, children: kinderen };
}

/** Vervangt in tekstknopen de treffers van een regex door links. */
function linkInTekst(ouder, re, maakLink, eenmalig, gedaan) {
  if (!ouder.children) return;
  for (let i = 0; i < ouder.children.length; i++) {
    const n = ouder.children[i];
    if (n.type === 'element') {
      if (/^h[1-6]$/.test(n.tagName) || ['a', 'sup', 'code', 'pre', 'button'].includes(n.tagName)) continue;
      if (klassen(n).some((k) => ['bronvermelding', 'op-kaart'].includes(k))) continue;
      linkInTekst(n, re, maakLink, eenmalig, gedaan);
      if (eenmalig && gedaan.klaar) return;
      continue;
    }
    if (n.type !== 'text') continue;
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const stukken = [];
    let laatste = 0;
    let m;
    while ((m = r.exec(n.value))) {
      stukken.push({ type: 'text', value: n.value.slice(laatste, m.index) });
      stukken.push(maakLink(m[0]));
      laatste = m.index + m[0].length;
      if (eenmalig) { gedaan.klaar = true; break; }
    }
    if (!stukken.length) continue;
    stukken.push({ type: 'text', value: n.value.slice(laatste) });
    ouder.children.splice(i, 1, ...stukken.filter((s) => s.type !== 'text' || s.value));
    i += stukken.length - 1;
    if (eenmalig && gedaan.klaar) return;
  }
}

export default function rehypeFunctioneel() {
  return (tree, file) => {
    const taal = taalVan(file);

    // 1. Knoppen "Op de kaart" per sectie (tussen twee ##-koppen).
    const kids = tree.children;
    let begin = 0;
    const secties = [];
    for (let i = 0; i <= kids.length; i++) {
      const isGrens = i === kids.length || isElement(kids[i], 'h2') || (isElement(kids[i], 'section') && klassen(kids[i]).includes('bronvermelding'));
      if (isGrens) {
        if (i > begin) secties.push([begin, i]);
        begin = i + 1;
        if (i < kids.length && isElement(kids[i], 'section')) break;
      }
    }
    for (const [van, tot] of secties.reverse()) {
      const tekst = kids.slice(van, tot).map(leesbareTekst).join(' ');
      const lagen = LAGEN.filter((l) => l.re[taal].test(tekst));
      if (!lagen.length) continue;
      // Na het laatste element van de sectie, voor witruimte.
      let plek = tot;
      while (plek > van && kids[plek - 1].type === 'text' && !kids[plek - 1].value.trim()) plek--;
      kids.splice(plek, 0, kaartRij(lagen, taal));
    }

    // 2. Hulpmiddelen: eerste vermelding per tekst.
    for (const h of HULPMIDDELEN) {
      linkInTekst(tree, h.re[taal], (woord) => ({
        type: 'element', tagName: 'a', properties: { href: appPad(taal, h.pad), className: ['hulpmiddel'] },
        children: [{ type: 'text', value: woord }],
      }), true, { klaar: false });
    }

    // 3. Noodnummers aantikbaar.
    linkInTekst(tree, NUMMERS, (nr) => ({
      type: 'element', tagName: 'a', properties: { href: `tel:${nr.replace(/\s/g, '')}`, className: ['telnr'] },
      children: [{ type: 'text', value: nr }],
    }), false, { klaar: false });
  };
}
