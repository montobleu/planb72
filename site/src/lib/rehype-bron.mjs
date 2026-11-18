// Bronvermelding zoals op Wikipedia.
// In de Markdown sluit elke sectie af met een regel "Bron: [naam](url) · [naam](url)"
// (of "Source :", "Quelle:", "Source:"). Die regel blijft in het bronbestand staan, zodat de
// inhoudscontrole elke bewering aan een bron kan koppelen. Bij het bouwen:
//   - verdwijnt de regel uit de lopende tekst (geen verwijsnummers in de tekst);
//   - verdwijnt in tabellen een kolom "Bron"/"Source"/"Quelle";
//   - komt onderaan één lijst met alle bronnen, in volgorde van eerste vermelding.
// Keuze van de redactie: de tekst blijft rustig leesbaar; de bronnen staan samen onderaan.

const BRONREGEL = /^\s*(Bron(nen)?|Sources?|Quellen?)\s*:\s*/;
const TITEL = { nl: 'Bronnen', fr: 'Sources', de: 'Quellen', en: 'Sources' };

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

const BRONKOP = /^\s*(Bron(nen)?|Sources?|Quellen?)\s*$/i;

/** Verwijdert in elke tabel de kolom waarvan de kop "Bron" (of Source, Quelle) is. */
function verwijderBronkolommen(n) {
  if (isElement(n, 'table')) {
    const rijen = [];
    const zoek = (x) => { if (isElement(x, 'tr')) rijen.push(x); (x.children || []).forEach(zoek); };
    zoek(n);
    const cellen = (rij) => rij.children.filter((c) => isElement(c, 'th') || isElement(c, 'td'));
    const kop = rijen[0] ? cellen(rijen[0]) : [];
    const index = kop.findIndex((c) => BRONKOP.test(tekstVan(c)));
    if (index >= 0) {
      for (const rij of rijen) {
        const c = cellen(rij)[index];
        if (c) rij.children.splice(rij.children.indexOf(c), 1);
      }
    }
    return;
  }
  (n.children || []).forEach(verwijderBronkolommen);
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
          links(n).forEach(nummer);
          kids.splice(i, 1);
          i--;
        } else if (n.type === 'element') {
          verwerk(n);
        }
      }
    };
    verwerk(tree);
    verwijderBronkolommen(tree);

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
