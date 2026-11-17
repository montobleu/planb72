# PlanB72

Gratis, open-source noodbibliotheek voor Europa die volledig werkt zonder internet: wat je moet doen bij een ramp, de noodnummers, een offline kaart met hulpposten en mogelijke schuilplekken, routeplanning op het toestel, en de nucleaire zones per land. De naam verwijst naar het Europese advies om 72 uur zelfredzaam te zijn.

**Website:** [planb72.org](https://planb72.org) · **App:** [planb72.org/app](https://planb72.org/app/)

> PlanB72 is geen officiële dienst van de EU of van een overheid en vervangt de hulpdiensten niet. Bel 112 als dat kan.

## Stand van zaken

Fase 0–1: een werkende eerste versie voor **België**.

| Onderdeel | Stand |
| --- | --- |
| Website (start, download, meehelpen, bronnen, status, doneren, over) | gebouwd |
| Web-app, installeerbaar en offline (service worker) | gebouwd |
| Wat nu? — 16 scenariokaarten | concept, wacht op nazicht en toestemming |
| Noodnummers en officiële kanalen België | gebouwd, bronnen gelinkt |
| Kaart: basiskaart België (PMTiles, tot zoom 9) en tien lagen uit OpenStreetMap | gebouwd |
| Routeplanning te voet, fiets en auto, zonder internet (9 regio's) | gebouwd, zie [docs/routeplanning.md](docs/routeplanning.md) |
| Nucleair: sites, zones, afstand en richting | gebouwd; coördinaten te controleren |
| Schuilen: keuzehulp, checklist eigen huis, mogelijke schuilplekken | gebouwd |
| Hulpmiddelen: voorraad, checklists, noodplan, SOS-lamp, morse, kompas, notities | gebouwd |
| Eerste hulp | bewust leeg tot er toestemming en een medisch nalezer is |
| Startprogramma voor Linux, Mac, Windows | gebouwd, nog niet ondertekend |
| Bronnenregister en nachtelijke bronnenronde | gebouwd |
| Website in vier talen (nl, fr, de, en) | gebouwd; vertalingen na te lezen |
| App in vier talen (nl, fr, de, en) | gebouwd; inhoud automatisch vertaald, na te lezen (zie [docs/vertalen.md](docs/vertalen.md)) |

Wat er niet in zit en waarom: alles waarvoor nog toestemming nodig is (officiële teksten, eerste-hulprichtlijnen, schuilplaatsdata van andere landen) staat met status `na te zien` in het bronnenregister.

## Opbouw

```
data/        landdata (be.json) en het bronnenregister
pipeline/    Python-scripts: kaartlagen uit OpenStreetMap, schuilplekken, nucleaire zones, basiskaart, routepakketten, bronnenronde
site/        Astro-site: website op / en de offline web-app op /app/
  worker/    kleine Cloudflare Worker die de basiskaart uit R2 serveert (met Range-aanvragen)
launcher/    startprogramma in Go: lokale webserver voor de download en de USB-stick, ook als hotspot
docs/        metingen en documentatie
```

## Lokaal draaien

```bash
cd site && npm install && npm run build && npx wrangler dev
```

De basiskaart staat niet in git. Maak ze met de pijplijn (zie [pipeline/README.md](pipeline/README.md)) en zet ze lokaal in R2:

```bash
npx wrangler r2 object put planb72-pakketten/be/basis.pmtiles --file public/data/be/basis.pmtiles --local
```

## Regels die niet onderhandelbaar zijn

1. **Geen eigen noodadvies.** Elke inhoudelijke zin over gezondheid, water, straling of chemie komt uit een bron in het register.
2. **Alleen erkende bronnen**, met bron, datum en licentie op elke pagina.
3. **Twee paar ogen** op alles wat levens raakt, waarvan één met vakkennis.
4. **Offline is de norm.** De app laadt niets van andere servers, behalve het statistiekscript van Nvivio (afgedwongen met een Content-Security-Policy).
5. **Geen account, geen reclame, geen cookies.** Alleen anonieme, cookieloze bezoekersstatistiek via [Nvivio](https://nvivio.com).

## Licenties

- Eigen teksten en illustraties: CC BY-SA 4.0.
- Overgenomen inhoud behoudt de licentie van de bron (zie `data/bronnen/register.json`).
- Kaartdata © OpenStreetMap-bijdragers, ODbL.
- Code: nog te kiezen (AGPL-3.0 of Apache-2.0), zie de open beslissingen in het plan.
