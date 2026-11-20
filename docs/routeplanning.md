# Routeplanning zonder internet

De routeplanner (`/app/route/`) berekent een route te voet, met de fiets of met de auto volledig
op het toestel: geen server, geen gps-volging. De gegevens komen uit OpenStreetMap en worden per
regio als routepakket gedownload, net als de kaartpakketten.

## Onderdelen

| Bestand | Wat |
| --- | --- |
| `pipeline/routegraaf.py` | maakt per regio een routenetwerk en een zoekindex (zie `pipeline/README.md`) |
| `site/public/data/routes.json` | overzicht van de routepakketten, hoort bij de kern van de app |
| R2 `planb72-pakketten/route/<regio>.pb72r` | de pakketten; de Worker serveert ze onder `/data/route/` |
| `site/src/lib/routegraaf.ts` | leest het formaat, voegt regio's samen |
| `site/src/lib/route.ts` | aanknopen aan het netwerk, A*, aanwijzingen |
| `site/src/lib/route.worker.ts` | Web Worker: routeren en zoeken buiten de hoofdthread |
| `site/src/lib/routepakketten.ts` | download naar OPFS (hergebruikt `bewaarBestand` uit `kaarten.ts`) |
| `site/src/lib/basiskaart.ts` | gedeelde basiskaart (stapeling van kaartpakketten) |
| `site/src/components/RoutePakketten.astro` | downloaden en verwijderen in Instellingen |
| `site/src/pages/app/route/index.astro` | de pagina |

## Keuzes

- **A\* in plaats van contraction hierarchies.** A* met een snelheidsgrens als schatting is
  snel genoeg (tientallen milliseconden binnen een provincie, zie hieronder), werkt zonder
  voorbewerking per vervoerswijze en laat toe dat regio's in de app worden samengevoegd.
  Contraction hierarchies zouden per vervoerswijze een eigen bestand vragen en het samenvoegen
  van regio's onmogelijk maken. Voor routes door heel België (zes regio's) is A* nog onder 0,3 s.
- **Knopen alleen op kruispunten**, tussenpunten als vorm. Het netwerk van heel België heeft
  1,8 miljoen knopen en 2,4 miljoen segmenten (OpenStreetMap telt er ongeveer 10 miljoen punten).
- **Regio's aan elkaar.** Elke knoop en elk segment heeft een landelijk volgnummer in
  ruimtelijke volgorde. Segmenten die een regio raken zitten volledig in die regio; in de overlap
  herkent de app ze aan hun nummer. Voor een route laadt de Worker alle regio's op het toestel die
  het gebied tussen A en B (plus ongeveer 5 km) raken.
- **Twee delen per pakket.** Het zoekdeel staat apart gecomprimeerd, zodat zoeken in alle regio's
  op het toestel werkt zonder de netwerken uit te pakken.
- **Zoeken**: plaatsen en straten uit de routepakketten, plus de punten uit de kaartlagen
  (ziekenhuizen, schuilplekken, drinkwater, politie, brandweer, apotheken, AED) uit het basispakket.
  Zonder accenten en hoofdletters, op woordbegin, dichtbij het midden van de kaart eerst.
- **Geen gps.** Punten kies je door te zoeken, op de kaart te tikken na "Kies op de kaart", lang
  te drukken of rechts te klikken, of met het midden van de kaart (toetsenbord). De knop "Mijn
  laatst bekende positie" staat standaard uit en vraagt de positie één keer.

## Snelheden en voorkeuren

| Vervoerswijze | Snelheid | Voorkeur |
| --- | --- | --- |
| Te voet | 4,8 km/u, trappen 2 km/u | hoofdwegen zonder voetpadinformatie licht vermeden |
| Fiets | 16 km/u, onverhard 12 km/u | fietspaden en fietsinfrastructuur voor, primaire wegen en N-wegen vermeden |
| Auto | maximumsnelheid (of standaard per wegtype) × 0,7 tot 0,9 | geen; snelwegen alleen aangeknoopt als er niets anders in de buurt is |

De duur is een schatting zonder wachttijden aan lichten of in het verkeer. Afslagverboden
(`restriction`-relaties) zitten nog niet in het netwerk; dat is de belangrijkste beperking voor de auto.

## Metingen (november 2026)

OpenStreetMap-gegevens van 16 november 2026 (Geofabrik). Pijplijn: 2,5 minuten en 2 GB geheugen
op een Apple M3.

### Groottes

| Regio | Knopen | Segmenten | Zoekitems | Netwerk (gzip) | Zoekindex (gzip) | Pakket | Uitgepakt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| West-Vlaanderen | 246.389 | 320.585 | 24.727 | 4,3 MB | 0,3 MB | 4,6 MB | 14,8 MB |
| Oost-Vlaanderen | 332.388 | 430.892 | 39.908 | 6,0 MB | 0,4 MB | 6,4 MB | 20,2 MB |
| Antwerpen | 272.709 | 371.685 | 29.885 | 4,9 MB | 0,3 MB | 5,2 MB | 16,6 MB |
| Limburg | 251.638 | 339.020 | 23.673 | 4,5 MB | 0,3 MB | 4,7 MB | 15,1 MB |
| Brabant en Brussel | 466.684 | 620.765 | 49.923 | 7,8 MB | 0,6 MB | 8,4 MB | 28,1 MB |
| Henegouwen | 327.045 | 424.953 | 43.034 | 6,3 MB | 0,5 MB | 6,8 MB | 21,0 MB |
| Namen | 207.617 | 267.382 | 30.301 | 4,4 MB | 0,3 MB | 4,8 MB | 13,7 MB |
| Luik | 258.818 | 329.119 | 34.096 | 5,3 MB | 0,4 MB | 5,7 MB | 16,8 MB |
| Luxemburg (provincie) | 143.408 | 181.572 | 16.858 | 3,4 MB | 0,2 MB | 3,6 MB | 10,0 MB |
| **Samen** | | | | | | **50 MB** | |

Ter vergelijking: het kaartpakket op straatniveau van dezelfde regio's weegt 53 tot 98 MB.
In het geheugen neemt een samengevoegd netwerk ongeveer 110 bytes per knoop in (Antwerpen: ongeveer 30 MB).

### Rekentijden

Node 22 op een Apple M3. Uitpakken (netwerk, zoekindex) per regio:

| Regio | Netwerk (ms) | Zoekindex (ms) |
| --- | ---: | ---: |
| West-Vlaanderen | 82 | 5 |
| Oost-Vlaanderen | 63 | 6 |
| Antwerpen | 54 | 6 |
| Limburg | 41 | 7 |
| Brabant en Brussel | 80 | 10 |
| Henegouwen | 59 | 11 |
| Namen | 40 | 7 |
| Luik | 45 | 8 |
| Luxemburg | 26 | 4 |

Routes (afstand, duur, rekentijd van A*). "Samenvoegen" is het eenmalig opbouwen van het netwerk
(regio's samenvoegen, buren en ruimtelijk raster), daarna hergebruikt zolang dezelfde regio's nodig zijn.

| Route | Regio's | Knopen | Samenvoegen (ms) | Te voet | Fiets | Auto |
| --- | ---: | ---: | ---: | --- | --- | --- |
| Antwerpen-Centraal → Grote Markt | 1 | 272.709 | 166 | 1,7 km, 22 min, 2 ms | 1,9 km, 7 min, 2 ms | 2,8 km, 8 min, 3 ms |
| Antwerpen → Mechelen | 1 | 272.709 | 145 | 22,8 km, 285 min, 6 ms | 22,9 km, 86 min, 5 ms | 24,0 km, 21 min, 4 ms |
| Antwerpen → Brussel-Centraal | 2 | 699.248 | 447 | 45,0 km, 563 min, 19 ms | 46,0 km, 173 min, 19 ms | 51,6 km, 41 min, 27 ms |
| Gent → Brugge | 2 | 543.514 | 339 | 41,4 km, 518 min, 6 ms | 42,1 km, 158 min, 10 ms | 46,9 km, 38 min, 10 ms |
| Oostende → Aarlen | 6 | 1.287.292 | 1001 | 307,0 km, 3838 min, 269 ms | 315,2 km, 1194 min, 233 ms | 310,6 km, 186 min, 170 ms |

In Chrome (zelfde toestel, Web Worker, pakketten uit OPFS): eerste route binnen Antwerpen
433 ms inclusief uitpakken en samenvoegen, daarna 6 tot 8 ms per route; Antwerpen → Brussel
490 ms de eerste keer, daarna 27 ms (fiets) en 36 ms (te voet). Op een oude telefoon rekenen we
met 5 tot 10 keer trager: enkele seconden voor de eerste route, daarna onder een halve seconde.
Dat is niet op een echt toestel gemeten.

## Nog te doen

- Afslagverboden en `access:conditional` (bv. schoolstraten) in het netwerk.
- Pontveren (`route=ferry`) en de voetgangers- en fietstunnels als aparte vervoerswijze.
- Buurlanden: `REGIOS` in `routegraaf.py` uitbreiden met de extracten van die landen.
- De kaartpagina (`/app/kaart/`) kan dezelfde basiskaartmodule (`lib/basiskaart.ts`) gebruiken.
- Teksten naar `i18n` zodra de meertalige app is samengevoegd.
