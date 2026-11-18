// Bronvermelding zoals op Wikipedia.
// In de Markdown sluit elke sectie af met een regel "Bron: [naam](url) · [naam](url)"
// (of "Source :", "Quelle:", "Source:"). Die regel blijft in het bronbestand staan, zodat de
// inhoudscontrole elke bewering aan een bron kan koppelen. Bij het bouwen:
//   - verdwijnt de regel uit de lopende tekst;
//   - krijgt het element ervoor (alinea, laatste lijstpunt, tabel) een klein verwijsnummer;
//   - komt onderaan één genummerde lijst met alle bronnen, in volgorde van eerste vermelding.

const BRONREGEL = /^\s*(Bron(nen)?|Sources?|Quellen?)\s*:\s*/;
const TITEL = { nl: 'Bronnen', fr: 'Sources', de: 'Quellen', en: 'Sources' };
const LABEL = { nl: 'Bron', fr: 'Source', de: 'Quelle', en: 'Source' };

const isElement = (n, tag) => n && n.type === 'element' && (!tag || n.tagName === tag);

function isBronregel(n) {
  if (!isElement(n, 'p')) return false;
  const eerste = n.children?.[0];
  return eerste?.type === 'text' && BRONREGEL.test(eerste.value) && n.children.some((c) => isElement(c, 'a'));
}

function tekstVan(n) {
  if (n.type === 'text') return n.value;
  return (n.children || []).map(tekstVan).join('');
}

function links(n, uit = []) {
  if (isElement(n, 'a') && n.properties?.href) uit.push({ url: String(n.properties.href), naam: tekstVan(n).trim() });
  (n.children || []).forEach((c) => links(c, uit));
  return uit;
}

function taalVan(file) {
  const pad = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
  return /\/content\/[^/]+\/(fr|de|en)\//.exec(pad)?.[1] ?? 'nl';
}

/** Het element waar het verwijsnummer achter komt. */
function doelVoor(el) {
  if (isElement(el, 'ul') || isElement(el, 'ol')) {
    const items = el.children.filter((c) => isElement(c, 'li'));
    return items.length ? doelVoor(items[items.length - 1]) : el;
  }
  if (isElement(el, 'li')) {
    const laatste = [...el.children].reverse().find((c) => c.type === 'element' || (c.type === 'text' && c.value.trim()));
    if (isElement(laatste, 'p')) return laatste;
    return el;
  }
  if (isElement(el, 'table')) {
    const rijen = [];
    const zoek = (n) => { if (isElement(n, 'tr')) rijen.push(n); (n.children || []).forEach(zoek); };
    zoek(el);
    const rij = rijen[rijen.length - 1];
    const cellen = rij?.children.filter((c) => isElement(c, 'td') || isElement(c, 'th')) ?? [];
    return cellen[cellen.length - 1] ?? el;
  }
  if (isElement(el, 'blockquote')) {
    const p = [...el.children].reverse().find((c) => isElement(c, 'p'));
    return p ?? el;
  }
  return el;
}

function verwijzing(nummers, taal) {
  const kinderen = [];
  nummers.forEach((nr, i) => {
    if (i > 0) kinderen.push({ type: 'text', value: ', ' });
    kinderen.push({
      type: 'element', tagName: 'a',
      properties: { href: `#bron-${nr}`, ariaLabel: `${LABEL[taal]} ${nr}` },
      children: [{ type: 'text', value: String(nr) }],
    });
  });
  return { type: 'element', tagName: 'sup', properties: { className: ['voetnoot'] }, children: kinderen };
}

export default function rehypeBron() {
  return (tree, file) => {
    const taal = taalVan(file);
    const lijst = [];
    const index = new Map();
    const nummer = ({ url, naam }) => {
      if (!index.has(url)) {
        lijst.push({ url, naam });
        index.set(url, lijst.length);
      }
      return index.get(url);
    };

    const verwerk = (ouder) => {
      const kids = ouder.children;
      if (!kids) return;
      for (let i = 0; i < kids.length; i++) {
        const n = kids[i];
        if (isBronregel(n)) {
          const nummers = [...new Set(links(n).map(nummer))];
          kids.splice(i, 1);
          i--;
          // Het vorige echte element (witruimte overslaan); geen kop.
          let j = i;
          while (j >= 0 && kids[j].type === 'text' && !kids[j].value.trim()) j--;
          const vorig = j >= 0 ? kids[j] : null;
          if (vorig && vorig.type === 'element' && !/^h[1-6]$/.test(vorig.tagName)) {
            doelVoor(vorig).children.push(verwijzing(nummers, taal));
          } else {
            kids.splice(i + 1, 0, { type: 'element', tagName: 'p', properties: { className: ['klein'] }, children: [verwijzing(nummers, taal)] });
            i++;
          }
        } else if (n.type === 'element') {
          verwerk(n);
        }
      }
    };
    verwerk(tree);

    if (!lijst.length) return;
    tree.children.push({
      type: 'element', tagName: 'section',
      properties: { className: ['bronvermelding'], ariaLabelledby: 'bronnen-kop' },
      children: [
        { type: 'element', tagName: 'h2', properties: { id: 'bronnen-kop' }, children: [{ type: 'text', value: TITEL[taal] }] },
        {
          type: 'element', tagName: 'ol', properties: {},
          children: lijst.map((b, i) => ({
            type: 'element', tagName: 'li', properties: { id: `bron-${i + 1}` },
            children: [{ type: 'element', tagName: 'a', properties: { href: b.url }, children: [{ type: 'text', value: b.naam || b.url }] }],
          })),
        },
      ],
    });
  };
}
