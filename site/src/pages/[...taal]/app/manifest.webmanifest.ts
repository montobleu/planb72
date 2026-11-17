// Webmanifest per taal: wie de app installeert vanuit /fr/app/, start ook in het Frans.
// Alle talen delen hetzelfde id, zodat het om één geïnstalleerde app gaat.
import type { APIRoute } from 'astro';
import { pad, taalPaden, type Taal } from '../../../i18n/talen';
import { APP } from '../../../i18n/app';

export const getStaticPaths = taalPaden;

const BESCHRIJVING: Record<Taal, string> = {
  nl: 'Werkt zonder internet: wat nu te doen, noodnummers, offline kaart en nucleaire informatie.',
  fr: "Fonctionne sans internet : que faire, numéros d'urgence, carte hors ligne et informations nucléaires.",
  de: 'Funktioniert ohne Internet: was zu tun ist, Notrufnummern, Offline-Karte und nukleare Informationen.',
  en: 'Works without internet: what to do, emergency numbers, offline map and nuclear information.',
};
const NAAM: Record<Taal, string> = {
  nl: 'PlanB72 — noodbibliotheek',
  fr: "PlanB72 — bibliothèque d'urgence",
  de: 'PlanB72 — Notfallbibliothek',
  en: 'PlanB72 — emergency library',
};

export const GET: APIRoute = ({ props }) => {
  const taal = props.taal as Taal;
  const t = APP[taal];
  const manifest = {
    id: '/app/',
    name: NAAM[taal],
    short_name: 'PlanB72',
    description: BESCHRIJVING[taal],
    lang: taal,
    start_url: pad(taal, '/app/'),
    scope: '/',
    display: 'standalone',
    background_color: '#111417',
    theme_color: '#111417',
    icons: [
      { src: '/icons/icoon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icoon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icoon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icoon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      { name: t.watnu.titel, url: pad(taal, '/app/wat-nu/') },
      { name: t.nummers.titel, url: pad(taal, '/app/noodnummers/') },
      { name: t.kaart.titel, url: pad(taal, '/app/kaart/') },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
};
