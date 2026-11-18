// Kleurschema: 'dark' (standaard) of 'light'. Er is bewust geen "zoals het toestel":
// PlanB72 start donker, zuinig op de batterij; wie licht wil, kiest dat zelf.
// De keuze staat in localStorage en wordt weerspiegeld in <meta name="color-scheme">.

export type Keuze = 'light' | 'dark';
const SLEUTEL = 'pb72-kleurschema';

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

export function huidigeKeuze(): Keuze {
  try {
    return localStorage.getItem(SLEUTEL) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Het schema dat nu getekend wordt. */
export function getekendSchema(): Keuze {
  return meta()?.content === 'light' ? 'light' : 'dark';
}

export function zetKeuze(keuze: Keuze) {
  try {
    if (keuze === 'dark') localStorage.removeItem(SLEUTEL);
    else localStorage.setItem(SLEUTEL, 'light');
  } catch {}
  pasToe(keuze);
}

export function wissel() {
  zetKeuze(getekendSchema() === 'light' ? 'dark' : 'light');
}

function pasToe(keuze: Keuze) {
  const m = meta();
  if (m) m.content = keuze;
  document.dispatchEvent(new CustomEvent('pb72-kleurschema', { detail: keuze }));
}

/** Blijf synchroon met andere tabbladen. */
export function volgWijzigingen() {
  addEventListener('storage', (e) => {
    if (e.key === SLEUTEL) pasToe(huidigeKeuze());
  });
}
