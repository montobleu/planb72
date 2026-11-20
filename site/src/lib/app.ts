// Gedeelde logica voor alle app-pagina's. Alles blijft op het toestel.
import { klant, locale } from '../i18n/klant';
import { isTaal, type Taal } from '../i18n/talen';

export function startApp() {
  registreerServiceWorker();
  toonNetstatus();
  taalkeuzeLinks();
}

function registreerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Niet in de ontwikkelserver: daar is er geen gebouwde sw.js.
  if (import.meta.env.DEV) return;
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e) => console.warn('Service worker niet geregistreerd', e));
}

function toonNetstatus() {
  const stip = document.getElementById('netstip');
  const tekst = document.getElementById('nettekst');
  const t = klant().net;
  const zet = () => {
    const online = navigator.onLine;
    stip?.classList.toggle('online', online);
    stip?.classList.toggle('offline', !online);
    if (tekst) tekst.textContent = online ? t.online : t.offline;
    stip?.setAttribute('title', online ? t.titelOnline : t.titelOffline);
  };
  zet();
  addEventListener('online', zet);
  addEventListener('offline', zet);
}

// ---------- Lokale opslag, altijd met try/catch (privévenster, volle schijf) ----------

const VOORVOEGSEL = 'pb72-';

export function lees<T>(sleutel: string, standaard: T): T {
  try {
    const ruw = localStorage.getItem(VOORVOEGSEL + sleutel);
    return ruw === null ? standaard : (JSON.parse(ruw) as T);
  } catch {
    return standaard;
  }
}

export function bewaar(sleutel: string, waarde: unknown): boolean {
  try {
    localStorage.setItem(VOORVOEGSEL + sleutel, JSON.stringify(waarde));
    return true;
  } catch {
    return false;
  }
}

/** Vraagt de browser om de opslag niet automatisch te wissen (belangrijk op iPhone). */
export async function vraagBlijvendeOpslag(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

// ---------- Afstand en richting ----------

const R = 6371.0088;
const rad = (g: number) => (g * Math.PI) / 180;

export function afstandKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function richting(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  const graden = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const windstreken = klant().windstreken;
  return { graden: Math.round(graden), windstreek: windstreken[Math.round(graden / 45) % 8] };
}

export function km(x: number) {
  return x < 1 ? `${Math.round(x * 1000)} m` : `${x.toLocaleString(locale(), { maximumFractionDigits: 1 })} km`;
}

/** Huidige positie, of null. Werkt offline (gps), maar vraagt toestemming. */
export function positie(): Promise<GeolocationPosition | null> {
  return new Promise((ok) => {
    if (!('geolocation' in navigator)) return ok(null);
    navigator.geolocation.getCurrentPosition(ok, () => ok(null), { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  });
}

export function bewaardePositie(): { lat: number; lon: number; naam: string } | null {
  return lees('positie', null);
}

/** Afvinklijsten met [data-lijst] onthouden hun staat op het toestel. */
export function vinklijsten() {
  document.querySelectorAll<HTMLElement>('[data-lijst]').forEach((lijst) => {
    const sleutel = 'lijst-' + lijst.dataset.lijst;
    const staat = lees<Record<string, boolean>>(sleutel, {});
    lijst.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((v) => {
      v.checked = !!staat[v.id];
      v.addEventListener('change', () => {
        staat[v.id] = v.checked;
        bewaar(sleutel, staat);
      });
    });
  });
}

// ---------- Taal ----------

const TAALSLEUTEL = 'pb72-taal';

/** De taal die op dit toestel gekozen werd, of null. Ruw bewaard: het script in App.astro leest hem vóór het tekenen. */
export function gekozenTaal(): Taal | null {
  try {
    const t = localStorage.getItem(TAALSLEUTEL);
    return isTaal(t) ? t : null;
  } catch {
    return null;
  }
}

export function kiesTaal(taal: Taal) {
  try {
    localStorage.setItem(TAALSLEUTEL, taal);
  } catch {}
}

/** Links met [data-taalkeuze] onthouden de gekozen taal voor ze navigeren. */
export function taalkeuzeLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[data-taalkeuze]').forEach((a) => {
    a.addEventListener('click', () => {
      const t = a.dataset.taalkeuze;
      if (isTaal(t)) kiesTaal(t);
    });
  });
}
