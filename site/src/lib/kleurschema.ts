// Kleurschema: 'system' (geen opgeslagen waarde), 'light' of 'dark'.
// Volgt Modern Web Guidance (dark-mode-toggle): de keuze staat in localStorage en
// wordt weerspiegeld in <meta name="color-scheme">; de CSS leest die meta.

export type Keuze = 'system' | 'light' | 'dark';
const SLEUTEL = 'pb72-kleurschema';

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

export function huidigeKeuze(): Keuze {
  try {
    const k = localStorage.getItem(SLEUTEL);
    return k === 'light' || k === 'dark' ? k : 'system';
  } catch {
    return 'system';
  }
}

/** Het schema dat nu getekend wordt. */
export function getekendSchema(): 'light' | 'dark' {
  const c = meta()?.content;
  if (c === 'light' || c === 'dark') return c;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function zetKeuze(keuze: Keuze) {
  try {
    if (keuze === 'system') localStorage.removeItem(SLEUTEL);
    else localStorage.setItem(SLEUTEL, keuze);
  } catch {}
  pasToe(keuze);
}

function pasToe(keuze: Keuze) {
  const m = meta();
  if (m) m.content = keuze === 'system' ? 'light dark' : keuze;
  document.dispatchEvent(new CustomEvent('pb72-kleurschema', { detail: getekendSchema() }));
}

/** Blijf synchroon met andere tabbladen en met de systeeminstelling. */
export function volgWijzigingen() {
  addEventListener('storage', (e) => {
    if (e.key === SLEUTEL) pasToe(huidigeKeuze());
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (huidigeKeuze() === 'system') pasToe('system');
  });
}
