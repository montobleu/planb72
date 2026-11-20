# Metingen

## Een inschrijving is geen praktijk: registers maken geen punten meer (20 november 2026)

Nieuwe regel voor alle lagen en landen (zie [kaartdata.md](kaartdata.md#dierenartsen-en-artsen-een-inschrijving-is-geen-praktijk)): een ondernemingsregister (VKBO, SIRENE, BrightQuery in Overture) maakt nooit zelf een punt. Het bevestigt alleen een plek uit OpenStreetMap, het plaatsendeel van Overture of een officiële lijst van locaties, en vult daar een ontbrekende naam (alleen als die een zaak aanduidt) of een ontbrekend adres aan. `python3 pipeline/verrijken.py <land>` voor de vijf landen; "voor" is de gepubliceerde stand na PR 13 en 15.

### Per land

| Land | Alle lagen voor | Na | Dierenartsen voor | Na | Apotheken voor | Na | Wat wegviel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| BE | 19.720 | 17.741 | 3.198 | 1.501 | 4.252 | 3.970 | punten uit de VKBO (1.804) en plekken die Overture alleen van BrightQuery kende |
| NL | 16.173 | 15.748 | 1.581 | 1.244 | 1.961 | 1.873 | plekken alleen van BrightQuery |
| LU | 1.163 | 1.163 | 65 | 65 | 109 | 109 | niets |
| FR | 156.410 | 148.864 | 12.993 | 5.447 | 19.660 | 19.660 | punten uit SIRENE (11.113) |
| DE | 144.974 | 143.291 | 8.811 | 7.128 | 17.336 | 17.336 | plekken alleen van BrightQuery |

De andere lagen (ziekenhuizen, medische posten, politie, brandweer, AED, drinkwater, gemeentehuizen) veranderen niet: daar voegde geen register punten toe. Medische posten: Overture kende in België 9.205, in Frankrijk 8.913 en in Duitsland 6.039 plekken alleen via BrightQuery (vooral vennootschappen van één arts); die kwamen ook voordien niet op de kaart en blijven weg.

### Wat de registers nog doen

| Land | Inschrijvingen (dierenartsen) | Bevestigen een plek op de kaart | Zonder plek (`register_zonder_plek`) |
| --- | ---: | ---: | ---: |
| BE (VKBO, Vlaanderen) | 1.815 | 474 | 1.330 |
| FR (SIRENE) | 11.113 | 3.267 | 7.846 |

De inschrijvingen zonder plek staan in `pipeline/out/<land>-verschillen.csv`: een werklijst voor wie ter plaatse kan nagaan of er een praktijk is (en ze dan in OpenStreetMap of `data/eigen/` toevoegt).

### Dierenartsen, België, per provincie

"Voor" is de stand na PR 13 en 15 (3.198 punten). Tegenover de laag van alleen OpenStreetMap (846 punten, 214 gemeenten zonder dierenarts) blijft er winst: 1.501 punten en 97 gemeenten zonder dierenarts.

| Provincie | Gemeenten | Zonder punt voor | Zonder punt na | Voor | Na | Officieel | OSM | Open bron | Bevestigd | Waarvan onzeker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Antwerpen | 67 | 0 | 3 | 617 | 204 | 0 | 113 | 91 | 183 | 3 |
| Brussels Hoofdstedelijk Gewest | 19 | 2 | 2 | 90 | 69 | 0 | 47 | 22 | 55 | 3 |
| Henegouwen | 69 | 6 | 10 | 254 | 177 | 0 | 129 | 48 | 120 | 10 |
| Limburg | 38 | 2 | 7 | 316 | 114 | 0 | 47 | 67 | 108 | 2 |
| Luik | 84 | 17 | 26 | 200 | 142 | 0 | 84 | 58 | 108 | 13 |
| Luxemburg | 43 | 14 | 21 | 76 | 60 | 0 | 47 | 13 | 39 | 3 |
| Namen | 38 | 6 | 8 | 108 | 78 | 0 | 43 | 35 | 59 | 7 |
| Oost-Vlaanderen | 55 | 0 | 5 | 562 | 232 | 0 | 106 | 126 | 209 | 10 |
| Vlaams-Brabant | 63 | 3 | 9 | 380 | 167 | 0 | 95 | 72 | 143 | 4 |
| Waals-Brabant | 27 | 1 | 2 | 96 | 69 | 0 | 50 | 19 | 49 | 5 |
| West-Vlaanderen | 62 | 0 | 4 | 499 | 189 | 0 | 85 | 104 | 161 | 7 |
| **totaal** | **565** | **51** | **97** | **3198** | **1501** | **0** | **846** | **655** | **1234** | **67** |

### Steekproef: Tremelo

| Praktijk | Adres | Voor | Na | Bron van de plek |
| --- | --- | --- | --- | --- |
| Dierenartsenpraktijk Heideberg | Heidebergstraat 14 | op de kaart (VKBO, bevestigd) | blijft, bevestigd | Meta (Overture), bevestigd door de VKBO |
| Dierenartsenpraktijk De Sphynx | Pastoriestraat 7 | op de kaart | blijft, bevestigd | Meta, bevestigd door BrightQuery en de VKBO |
| Gastmans Pascale | Hilstraat 6 | op de kaart (VKBO) | blijft, bevestigd, zonder naam | Meta; de naam is die van de dierenarts zelf en komt niet op de kaart |
| DAP Nagels | Grote Bollostraat 75 | op de kaart (VKBO) | **valt weg** | alleen in de VKBO en bij BrightQuery, dus alleen als inschrijving; staat als `register_zonder_plek` in de verschillenlijst |
| Dierenarts Aurelie De Roover | Veldonkstraat 429 | open ring (VKBO) | valt weg | alleen een inschrijving |

Twee van de drie praktijken die de gebruiker kent (Heideberg en Gastmans) staan op de kaart; Nagels niet, omdat geen enkele bron van plaatsen ze kent. Wie ze kent, voegt ze toe in OpenStreetMap of als nagekeken aanvulling in `data/eigen/be/dierenarts.json`.

## Open bronnen: Overture Maps Places (18 november 2026)

Overture Maps Places, release 2026-11-18.0 (CDLA-Permissive-2.0, Foursquare-deel Apache-2.0), als extra bron voor alle negen lagen in de vijf landen. Aanpak, licentie en regels: [kaartdata.md](kaartdata.md#open-bronnen-van-plekken-overture-maps-en-foursquare). `python3 pipeline/verrijken.py <land>` voor BE, NL, LU, FR en DE; "voor" is de laag zoals ze op deze branch stond (OpenStreetMap, plus VKBO en SIRENE voor de dierenartsen en de officiële bronnen in België), bewaard in `pipeline/out/voor/<land>/`.

- Uitsnede: 14,7 MB (gzip), 2 minuten met duckdb, 20 categorieën. In België 28.703 plekken in die categorieën, in Luxemburg maar 445 (alleen Meta, Microsoft en Foursquare; BrightQuery heeft er geen).
- Rekentijd van verrijken.py: België 3,5 minuten (vooral het adressenbestand), Frankrijk en Duitsland ongeveer 25 seconden.

### Per land

| Land | Punten voor | Punten na | Nieuw, bevestigd | Nieuw, onzeker (open ring) | Bestaande punten nu bevestigd | Registerpunt van onzeker naar praktijk | Volgens Overture gesloten (nakijken) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BE | 18.157 | 19.720 | 739 | 824 | 6.052 | 121 | 157 |
| NL | 14.941 | 16.173 | 580 | 652 | 4.521 | 0 | 104 |
| LU | 1.153 | 1.163 | 0 | 10 | 234 | 0 | 0 |
| FR | 155.448 | 156.410 | 962 | 0 | 39.107 | 311 | 613 |
| DE | 140.914 | 144.974 | 1.929 | 2.131 | 38.315 | 0 | 570 |

"Bestaande punten nu bevestigd": punten uit OpenStreetMap of een officiële bron die ook in Overture staan, bij een leverancier uit een andere familie. Ze krijgen `zekerheid: "bevestigd"`; de kaart toont "Gevonden in twee onafhankelijke bronnen".

### Per laag

Alleen de lagen die veranderen. AED en drinkwater: Overture heeft geen categorie voor AED's en één drinkwaterpunt in Duitsland. Ziekenhuizen en gemeentehuizen: alleen bevestiging (geen nieuwe punten).

| Land | Laag | Voor | Na | Nieuw, bevestigd | Nieuw, onzeker | Bestaand bevestigd | Ontbrak (verzadiging) | kB voor | kB na |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BE | ziekenhuizen | 293 | 293 | 0 | 0 | 234 |  | 81 | 87 |
| BE | medisch | 3.049 | 3.148 | 99 | 0 | 1.097 | 57% | 688 | 751 |
| BE | politie | 712 | 713 | 1 | 0 | 284 | 8% | 160 | 167 |
| BE | brandweer | 330 | 330 | 0 | 0 | 220 | 0% | 75 | 80 |
| BE | apotheken | 3.564 | 4.252 | 305 | 383 | 2.909 | 24% | 802 | 1129 |
| BE | overheid | 776 | 776 | 0 | 0 | 395 |  | 184 | 194 |
| BE | dierenarts | 2.423 | 3.198 | 334 | 441 | 913 | 42% | 708 | 999 |
| NL | ziekenhuizen | 167 | 167 | 0 | 0 | 132 |  | 38 | 41 |
| NL | medisch | 3.198 | 3.308 | 110 | 0 | 1.579 | 36% | 793 | 874 |
| NL | politie | 459 | 460 | 1 | 0 | 264 | 8% | 116 | 123 |
| NL | brandweer | 1.012 | 1.012 | 0 | 0 | 502 | 0% | 232 | 244 |
| NL | apotheken | 1.690 | 1.961 | 75 | 196 | 1.172 | 23% | 424 | 552 |
| NL | overheid | 462 | 462 | 0 | 0 | 277 |  | 119 | 126 |
| NL | dierenarts | 731 | 1.581 | 394 | 456 | 595 | 58% | 178 | 501 |
| LU | ziekenhuizen | 15 | 15 | 0 | 0 | 13 |  | 3 | 3 |
| LU | medisch | 230 | 230 | 0 | 0 | 13 | 0% | 54 | 54 |
| LU | politie | 58 | 58 | 0 | 0 | 38 | 0% | 15 | 16 |
| LU | brandweer | 144 | 144 | 0 | 0 | 53 | 0% | 29 | 30 |
| LU | apotheken | 108 | 109 | 0 | 1 | 52 | 0% | 29 | 30 |
| LU | overheid | 115 | 115 | 0 | 0 | 40 |  | 26 | 27 |
| LU | dierenarts | 56 | 65 | 0 | 9 | 25 | 0% | 11 | 15 |
| FR | ziekenhuizen | 2.481 | 2.481 | 0 | 0 | 1.558 |  | 552 | 589 |
| FR | medisch | 15.962 | 16.084 | 122 | 0 | 2.724 | 59% | 3544 | 3656 |
| FR | politie | 5.953 | 5.959 | 6 | 0 | 2.078 | 12% | 1448 | 1501 |
| FR | brandweer | 6.108 | 6.110 | 2 | 0 | 1.045 | 11% | 1360 | 1386 |
| FR | apotheken | 19.092 | 19.660 | 568 | 0 | 15.075 | 12% | 4575 | 5159 |
| FR | overheid | 37.146 | 37.146 | 0 | 0 | 12.630 |  | 9744 | 10047 |
| FR | dierenarts | 12.729 | 12.993 | 264 | 0 | 3.997 | 13% | 4074 | 4269 |
| DE | ziekenhuizen | 2.334 | 2.334 | 0 | 0 | 1.667 |  | 552 | 592 |
| DE | medisch | 42.904 | 43.293 | 389 | 0 | 5.667 | 38% | 11803 | 12087 |
| DE | politie | 3.865 | 3.876 | 11 | 0 | 1.543 | 14% | 874 | 915 |
| DE | brandweer | 29.183 | 29.206 | 23 | 0 | 9.689 | 6% | 6398 | 6640 |
| DE | apotheken | 17.092 | 17.336 | 244 | 0 | 13.043 | 6% | 4585 | 4992 |
| DE | drinkwater | 9.899 | 9.900 | 1 | 0 | 23 | 100% | 1755 | 1755 |
| DE | overheid | 8.710 | 8.710 | 0 | 0 | 2.418 |  | 2102 | 2160 |
| DE | dierenarts | 5.419 | 8.811 | 1.261 | 2.131 | 4.265 | 45% | 1401 | 2730 |

"Ontbrak" is de verzadigingsmaat: het deel van de plekken die Overture zelf in twee families heeft, dat nog niet in de laag stond. Onder 20% komen er geen plekken uit één bron bij (Frankrijk: apotheken en dierenartsen; Duitsland: apotheken). Luxemburg heeft te weinig bevestigde plekken om het te meten.

### Wat Overture aanbood en wat ermee gebeurde

| Land | Laag | Plekken in Overture | Dubbels in Overture | Bevestigt een bestaand punt | Waarvan alleen op afstand (≤ 50 m) | Vermoedelijke zetel | Niet gebruikt (te zwak, geen vakwoord) | Niet gebruikt (laag verzadigd) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BE | ziekenhuizen | 4.300 | 1.648 | 298 | 80 | 0 | 2.306 | 0 |
| BE | medisch | 12.965 | 1.098 | 1.151 | 285 | 0 | 9.323 | 0 |
| BE | politie | 501 | 23 | 297 | 59 | 0 | 162 | 0 |
| BE | brandweer | 341 | 33 | 228 | 27 | 0 | 58 | 0 |
| BE | apotheken | 6.043 | 520 | 3.042 | 407 | 23 | 1.466 | 0 |
| BE | overheid | 689 | 43 | 425 | 79 | 0 | 216 | 0 |
| BE | dierenarts | 3.864 | 257 | 1.284 | 87 | 30 | 1.280 | 0 |
| NL | ziekenhuizen | 2.670 | 319 | 190 | 65 | 0 | 2.106 | 0 |
| NL | medisch | 5.370 | 928 | 1.652 | 188 | 0 | 2.321 | 0 |
| NL | politie | 432 | 34 | 270 | 22 | 0 | 120 | 0 |
| NL | brandweer | 806 | 38 | 506 | 57 | 0 | 84 | 0 |
| NL | apotheken | 4.868 | 519 | 1.223 | 109 | 7 | 2.652 | 0 |
| NL | overheid | 657 | 45 | 285 | 29 | 0 | 322 | 0 |
| NL | dierenarts | 2.532 | 244 | 600 | 27 | 10 | 702 | 0 |
| LU | ziekenhuizen | 69 | 5 | 18 | 7 | 0 | 46 | 0 |
| LU | medisch | 46 | 3 | 13 | 6 | 0 | 28 | 0 |
| LU | politie | 46 | 2 | 40 | 5 | 0 | 4 | 0 |
| LU | brandweer | 78 | 3 | 53 | 8 | 0 | 18 | 0 |
| LU | apotheken | 76 | 0 | 53 | 4 | 0 | 18 | 0 |
| LU | overheid | 63 | 1 | 42 | 8 | 0 | 19 | 0 |
| LU | dierenarts | 67 | 2 | 25 | 5 | 0 | 27 | 0 |
| FR | ziekenhuizen | 10.918 | 1.078 | 1.798 | 392 | 0 | 7.849 | 0 |
| FR | medisch | 17.399 | 3.879 | 2.849 | 1.143 | 0 | 9.255 | 0 |
| FR | politie | 3.284 | 89 | 2.109 | 356 | 0 | 991 | 0 |
| FR | brandweer | 1.859 | 61 | 1.087 | 362 | 0 | 505 | 0 |
| FR | apotheken | 24.475 | 1.399 | 15.409 | 2.595 | 128 | 4.080 | 1.721 |
| FR | overheid | 18.894 | 408 | 12.939 | 1.729 | 0 | 4.483 | 0 |
| FR | dierenarts | 8.959 | 1.219 | 5.228 | 581 | 49 | 1.259 | 536 |
| DE | ziekenhuizen | 11.855 | 2.336 | 1.836 | 240 | 0 | 7.387 | 0 |
| DE | medisch | 14.672 | 979 | 5.713 | 721 | 0 | 6.505 | 0 |
| DE | politie | 2.409 | 125 | 1.560 | 132 | 0 | 646 | 0 |
| DE | brandweer | 13.984 | 657 | 9.807 | 1.268 | 0 | 2.058 | 0 |
| DE | apotheken | 22.795 | 1.205 | 13.345 | 1.342 | 65 | 6.065 | 706 |
| DE | drinkwater | 25 | 0 | 23 | 3 | 0 | 1 | 0 |
| DE | overheid | 3.803 | 280 | 2.523 | 413 | 0 | 888 | 0 |
| DE | dierenarts | 13.386 | 1.182 | 4.342 | 360 | 24 | 3.702 | 0 |

### Dierenartsen, België, per provincie

`python3 pipeline/dekking.py BE dierenarts --voor pipeline/out/voor/be`. "Voor" is de laag met VKBO (2.423 punten), "onzeker" telt `praktijk: "onzeker"` (VKBO) en `zekerheid: "onzeker"` (één open bron) samen.

| Provincie | Gemeenten | Zonder punt voor | Zonder punt na | Voor | Na | Officieel | OSM | Open bron | Bevestigd | Waarvan onzeker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Antwerpen | 67 | 1 | 0 | 559 | 617 | 514 | 45 | 58 | 182 | 339 |
| Brussels Hoofdstedelijk Gewest | 19 | 2 | 2 | 47 | 90 | 0 | 47 | 43 | 55 | 24 |
| Henegouwen | 69 | 19 | 6 | 129 | 254 | 0 | 129 | 125 | 120 | 87 |
| Limburg | 38 | 3 | 2 | 267 | 316 | 250 | 17 | 49 | 111 | 140 |
| Luik | 84 | 48 | 17 | 84 | 200 | 0 | 84 | 116 | 108 | 71 |
| Luxemburg | 43 | 26 | 14 | 47 | 76 | 0 | 47 | 29 | 39 | 19 |
| Namen | 38 | 18 | 6 | 43 | 108 | 0 | 43 | 65 | 59 | 37 |
| Oost-Vlaanderen | 55 | 0 | 0 | 456 | 562 | 402 | 54 | 106 | 212 | 279 |
| Vlaams-Brabant | 63 | 4 | 3 | 322 | 380 | 267 | 55 | 58 | 142 | 171 |
| Waals-Brabant | 27 | 3 | 1 | 50 | 96 | 0 | 50 | 46 | 49 | 32 |
| West-Vlaanderen | 62 | 0 | 0 | 419 | 499 | 371 | 48 | 80 | 170 | 261 |
| **totaal** | **565** | **124** | **51** | **2.423** | **3.198** | **1.804** | **619** | **775** | **1.247** | **1.460** |

Het grootste effect is in Wallonië en Brussel, waar geen open register is: Luik van 84 naar 200 punten, Henegouwen van 129 naar 254, gemeenten zonder dierenarts in heel België van 124 naar 51. Veel nieuwe punten in Wallonië hebben geen naam op de kaart: de bron heeft alleen de naam van de dierenarts zelf (eenmanszaak), en die tonen we niet. 121 VKBO-inschrijvingen zonder handelsnaam gingen van "onzeker" naar "praktijk", omdat ze ook een eigen pagina hebben (Meta) of in Foursquare staan (bv. "DAP De Kleine Helden", Hasselt; "Animedix", Poperinge).

### Steekproef: Tremelo

De drie bekende dierenartsen in Tremelo, met `--gemeenten Tremelo`:

| Praktijk | Adres | Voor (VKBO) | Overture | Na |
| --- | --- | --- | --- | --- |
| Dierenartsenpraktijk Heideberg | Heidebergstraat 14 | officieel, praktijk | Meta (confidence 0,92) | officieel, praktijk, **bevestigd** |
| DAP Nagels | Grote Bollostraat 75 | officieel, praktijk | BrightQuery, als "Dierenartsenpraktijk Bolloheide" | officieel, praktijk; niet bevestigd, want BrightQuery is hetzelfde register (KBO) |
| Gastmans Pascale | Hilstraat 6 | officieel, praktijk | Meta en BrightQuery (confidence 1,0) | officieel, praktijk, **bevestigd** |

Ook "DierenArtsPraktijk De Sphynx" (Pastoriestraat 7, Meta) is nu bevestigd. In Tremelo komt er geen punt bij; de VKBO had ze al. Twee fouten kwamen in de steekproef boven en zijn verholpen met een regel: de zetel van Heideberg in Keerbergen (Lindenstraat 28, alleen BrightQuery) zou een tweede punt "Heideberg" geworden zijn (regel "vermoedelijke zetel"), en "Lance Medical" in Parijs als dierenarts (regel "vakwoord").

### Apotheken tegenover het officiële aantal

| Land | Voor (OSM) | Na | Officieel aantal | Bron van het aantal |
| --- | ---: | ---: | ---: | --- |
| België | 3.564 | 4.252 | 4.801 | FAGG-kadaster (zie hoger) |
| Nederland | 1.690 | 1.961 | ongeveer 2.000 | SFK: 1.994 openbare apotheken eind 2016; recenter cijfer niet gevonden |
| Frankrijk (zonder overzee) | 19.092 | 19.660 | 19.627 | Ordre national des pharmaciens, officines in 2024 |
| Duitsland | 17.092 | 17.336 | 16.444 | ABDA, eind september 2026 |

De verzadigingsregel doet hier zijn werk: zonder die regel kwamen er in Frankrijk 1.721 en in Duitsland 706 apotheken uit één bron bij (samen 21.381 en 18.042), vooral dubbels en gesloten zaken. In Duitsland heeft OpenStreetMap al meer apotheken dan er zijn: sluitingen (502 in 2025 volgens de ABDA) komen niet altijd in OSM. De 135 Duitse apotheken die volgens Overture gesloten zijn, staan in de verschillenlijst.

### Dierenartsen, Nederland, per provincie

`python3 pipeline/dekking_regio.py NL --laag dierenarts` (provincie = kleinste kader uit `pipeline/regios.json`):

| Provincie | Voor | Na | Open bron (nieuw) | Bevestigd | Onzeker |
| --- | ---: | ---: | ---: | ---: | ---: |
| Drenthe | 45 | 94 | 49 | 60 | 26 |
| Flevoland | 36 | 75 | 39 | 48 | 21 |
| Fryslân | 20 | 53 | 33 | 33 | 15 |
| Gelderland | 49 | 110 | 61 | 71 | 30 |
| Groningen | 17 | 27 | 10 | 21 | 6 |
| Limburg | 48 | 153 | 105 | 84 | 59 |
| Noord-Brabant | 91 | 198 | 107 | 119 | 61 |
| Noord-Holland | 77 | 162 | 85 | 109 | 45 |
| Overijssel | 70 | 141 | 71 | 87 | 37 |
| Utrecht | 102 | 224 | 122 | 142 | 69 |
| Zeeland | 20 | 48 | 28 | 31 | 16 |
| Zuid-Holland | 156 | 296 | 140 | 184 | 71 |

Duitsland, dierenartsen per deelstaat: van 5.419 naar 8.811, in elke deelstaat 34 tot 78% meer (Noordrijn-Westfalen 794 naar 1.410, Beieren 753 naar 1.255, Saksen 225 naar 302).

### Grenzen

- **Luxemburg** wint bijna niets: Overture heeft er 445 plekken in deze categorieën, zonder BrightQuery.
- **AED en drinkwater**: geen bruikbare categorie in Overture. Hier blijven OpenStreetMap en de officiële bronnen (aanvraag AED-register) de enige weg.
- **Ziekenhuizen en gemeentehuizen**: Overture is te vervuild voor nieuwe punten ("hospital": paramedische praktijken, labo's; "town_hall": cafés, oude gemeentehuizen, kabinetten). Overture bevestigt wel 234 van de 293 Belgische ziekenhuispunten.
- **Gesloten volgens Overture**: 1.444 punten op de kaart staan als gesloten in Overture (meestal een stopzetting in een ondernemingsregister). Ze blijven staan; de verschillenlijst (`gesloten_open_bron`) is een werklijst om na te kijken.
- **Onzekere punten** zijn open ringen met "Bel eerst": 3.617 in België, Nederland, Luxemburg en Duitsland samen (tegenover 0 in Frankrijk, waar de verzadigingsregel ze tegenhoudt). Een steekproef van een mens per land is aan te raden voor die punten echt vertrouwd worden.
- **Kern van de app**: 14,06 MB (budget 15 MB), met de licentieteksten (17 kB) erbij.


## Dierenartsen, België (18 november 2026)

De laag dierenartsen kwam alleen uit OpenStreetMap: 846 punten, en in 214 van de 565 gemeenten geen enkele dierenarts. Een open register van alle praktijken bestaat niet (zie [kaartdata.md](kaartdata.md#dierenartsen-wat-zeker-is-en-wat-niet)). De VKBO van Digitaal Vlaanderen (Modellicentie gratis hergebruik) geeft wel alle vennootschappen met NACE 75.000 (veterinaire diensten) en hun vestigingen in Vlaanderen. `python3 pipeline/verrijken.py BE --lagen dierenarts`, gemeten met `python3 pipeline/dekking.py BE dierenarts` (gemeente van elk punt uit het adressenbestand BeST).

- VKBO: 2.376 records. 399 zetels vallen weg omdat hun vestigingen apart op de kaart staan. 162 inschrijvingen op hetzelfde adres als een andere zijn samengevoegd. Er blijven 1.815 plekken over, waarvan 11 waarvan het adres niet gevonden werd.
- Op de kaart: **2.423 punten** (was 846). Daarvan 1.804 uit de VKBO, waarvan 227 ook in OpenStreetMap stonden, en 619 alleen uit OpenStreetMap (vooral eenmanszaken, die niet in de VKBO staan, en Wallonië en Brussel).
- Zekerheid: 664 VKBO-punten zijn zeker een praktijk (handelsnaam, vennootschap met personeel, een vestiging op het adres van zo'n vennootschap, of ook in OSM). 1.140 zijn onzeker: een inschrijving zonder handelsnaam, vaak de vennootschap van één dierenarts op het woonadres. Die staan als open ring op de kaart, met "Bel eerst" in de pop-up.
- Vlaanderen: 446 punten voor, 2.023 na; gemeenten zonder dierenarts van 98 naar 8 (Baarle-Hertog, Drogenbos, Linkebeek, Wemmel, Boortmeerbeek, Nieuwerkerken, Dilsen-Stokkem, Herstappe). Daar staat geen vennootschap met NACE 75.000 ingeschreven; een dierenarts als eenmanszaak kan er wel zijn.
- Wallonië en Brussel: ongewijzigd. De volledige KBO (ook eenmanszaken, heel België) vraagt een account en schriftelijke toestemming voor publicatie (aanvraag 11 in kaartdata.md).

### Per provincie

| Provincie | Gemeenten | Zonder punt voor | Zonder punt na | Voor (OSM) | Na | Officieel | OSM | Waarvan onzeker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Antwerpen | 67 | 20 | 1 | 113 | 559 | 514 | 45 | 337 |
| Brussels Hoofdstedelijk Gewest | 19 | 2 | 2 | 47 | 47 | 0 | 47 | 0 |
| Henegouwen | 69 | 19 | 19 | 129 | 129 | 0 | 129 | 0 |
| Limburg | 38 | 14 | 3 | 47 | 267 | 250 | 17 | 128 |
| Luik | 84 | 48 | 48 | 84 | 84 | 0 | 84 | 0 |
| Luxemburg | 43 | 26 | 26 | 47 | 47 | 0 | 47 | 0 |
| Namen | 38 | 18 | 18 | 43 | 43 | 0 | 43 | 0 |
| Oost-Vlaanderen | 55 | 21 | 0 | 106 | 456 | 402 | 54 | 265 |
| Vlaams-Brabant | 63 | 20 | 4 | 95 | 322 | 267 | 55 | 161 |
| Waals-Brabant | 27 | 3 | 3 | 50 | 50 | 0 | 50 | 0 |
| West-Vlaanderen | 62 | 23 | 0 | 85 | 419 | 371 | 48 | 249 |
| **totaal** | **565** | **214** | **124** | **846** | **2423** | **1804** | **619** | **1140** |

"Onzeker" telt de punten met `praktijk = onzeker`. De punten alleen uit OpenStreetMap hebben geen zekerheidslabel.

### Steekproef: kleine gemeenten

Aantal plekken volgens de bron (VKBO, gemeente van het KBO-adres) tegenover de kaart (punten uit de VKBO in die gemeente volgens BeST). Over alle 276 Vlaamse gemeenten met minstens één VKBO-record: 237 gelijk, 33 met één verschil, 2 met twee (punten vlak bij een gemeentegrens, en 11 adressen die niet gevonden werden).

| Gemeente | Bron | Kaart (VKBO) | Voor (OSM) | Na | Zeker | Onzeker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mesen | 1 | 1 | 0 | 1 | 0 | 1 |
| Horebeke | 1 | 1 | 0 | 1 | 1 | 0 |
| Spiere-Helkijn | 2 | 2 | 1 | 3 | 3 | 0 |
| Bever | 3 | 3 | 0 | 3 | 0 | 3 |
| Zuienkerke | 1 | 1 | 3 | 4 | 3 | 1 |
| Lo-Reninge | 2 | 2 | 1 | 3 | 2 | 1 |
| Vleteren | 3 | 3 | 0 | 3 | 1 | 2 |
| Pepingen | 2 | 2 | 1 | 2 | 1 | 1 |
| Voeren | 2 | 2 | 0 | 2 | 1 | 1 |
| Glabbeek | 3 | 3 | 1 | 4 | 2 | 2 |

In Vleteren werd eerst één adres niet gevonden ("Oude Reningeweg(Oost)"); de geocoder zoekt nu ook zonder de toevoeging tussen haakjes. Of de plekken echt praktijken zijn, kan alleen een mens nagaan: de zoekfunctie van de Orde der Dierenartsen heeft geen adres per gemeente en mag niet automatisch bevraagd worden.

### Vergelijking met het aantal dierenartsen

Een officieel aantal praktijken per provincie van de Orde der Dierenartsen is niet gepubliceerd. Wat wel te vinden was: ongeveer 3.600 actieve dierenartsen in Vlaanderen (VRT, 2023) en 5.856 dierenartsen in België (EBVS, jaar niet vermeld). Met 2.023 plekken in Vlaanderen, waarvan een deel groepspraktijken met meerdere dierenartsen en een deel alleen een inschrijving, is de orde van grootte geloofwaardig; 446 punten (alleen OSM) was dat niet.

### Andere lagen die duidelijk onvolledig zijn

| Laag | OSM België | Register | Opmerking |
| --- | ---: | ---: | --- |
| Apotheken | 3.564 | 4.801 (FAGG-kadaster) | Een kwart ontbreekt. FAGG vraagt toestemming (aanvraag 1). De VKBO heeft 2.017 vestigingen met NACE 47.730 in Vlaanderen (OSM: 1.946 in Vlaanderen): bruikbaar op dezelfde manier als voor dierenartsen. |
| Medische posten | 3.049 | 296 medische huizen (RIZIV), 105 huisartsenwachtposten (Domus Medica, 2023) | De VKBO heeft 7.209 records met NACE 86.210 (huisartsen), vooral vennootschappen van één arts op het woonadres: niet geschikt als laag "medische posten". |
| AED | 5.699 | ongeveer 19.000 (FOD Volksgezondheid) | Aanvraag 2. |

## Dierenartsen, Frankrijk (18 november 2026)

Bron: INSEE SIRENE via de open API Recherche d'entreprises (Licence Ouverte 2.0), per departement van het vasteland en Corsica, alleen actieve vestigingen met NAF 75.00Z en een openbaar adres (diffusion O). `python3 pipeline/verrijken.py FR --lagen dierenarts`; de eerste download duurt ongeveer een half uur (ongeveer 1.000 aanvragen, hoogstens 3 per seconde).

- 14.261 vestigingen, waarvan 3.148 samengevoegd met een andere op hetzelfde adres: 11.113 plekken.
- Op de kaart: **12.729 punten** (was 4.114). 11.113 uit SIRENE, waarvan 2.498 ook in OpenStreetMap stonden, en 1.616 alleen uit OpenStreetMap.
- Zekerheid: 6.901 SIRENE-punten zeker een praktijk (handelsnaam of vennootschap, of ook in OSM), 4.212 onzeker (eenmanszaak zonder handelsnaam; geen persoonsnaam op de kaart).
- Vestigingen van eenmanszaken met een afgeschermd adres (diffusion partielle) ontbreken.
- Nederland, Luxemburg en Duitsland: geen open register met activiteitscode en adres per vestiging; ongewijzigd.

## Kaartlagen verrijkt met officiële bronnen, België (18 november 2026)

`python3 pipeline/verrijken.py BE` op de OSM-lagen van 17 november 2026 (Overpass) met de officiële bronnen van 18 november 2026. Rekentijd: ongeveer drie minuten op een MacBook, waarvan het meeste voor het lezen van het adressenbestand (7,2 miljoen adressen). Uitleg van de werkwijze en de bronnen: [kaartdata.md](kaartdata.md).

### Aantal punten per laag, voor en na

"Voor" is de laag uit OpenStreetMap alleen. "Gekoppeld" zijn officiële punten die met een OSM-punt samenvielen (dat punt krijgt de naam, het adres en het punt van de officiële bron); "nieuw" zijn officiële punten die niet in OpenStreetMap stonden.

| Laag | Voor (OSM) | Na | Officieel | Nagekeken | OSM | Gekoppeld | Officieel nieuw | Niet geplaatst | kB voor | kB na |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ziekenhuizen | 264 | 293 | 141 | 0 | 152 | 112 | 29 | 0 | 62 | 82 |
| medisch | 3.049 | 3.049 | 0 | 0 | 3.049 | 0 | 0 | 0 | 688 | 688 |
| politie | 706 | 712 | 17 | 0 | 695 | 11 | 6 | 0 | 157 | 160 |
| brandweer | 330 | 330 | 0 | 0 | 330 | 0 | 0 | 0 | 75 | 75 |
| apotheken | 3.564 | 3.564 | 0 | 0 | 3.564 | 0 | 0 | 0 | 803 | 803 |
| aed | 5.699 | 5.782 | 89 | 0 | 5.693 | 6 | 83 | 13 | 1.087 | 1.112 |
| drinkwater | 1.167 | 1.228 | 126 | 0 | 1.102 | 65 | 61 | 0 | 208 | 235 |
| overheid | 776 | 776 | 0 | 0 | 776 | 0 | 0 | 0 | 185 | 185 |
| dierenarts | 846 | 846 | 0 | 0 | 846 | 0 | 0 | 0 | 183 | 183 |
| **totaal** | **16.401** | **16.580** | **373** | **0** | **16.207** | **194** | **179** | **13** | | |

Alle lagen blijven ruim binnen hun budget (`pipeline/budget.json`). Er zijn nog geen eigen aanvullingen (`data/eigen/` is leeg tot de eerste nagekeken items binnenkomen).

### Wat de cijfers zeggen

- **Ziekenhuizen (Vlaanderen)**: van de 141 ziekenhuiscampussen van het Departement Zorg (98 algemene en 43 psychiatrische) stonden er 112 in OpenStreetMap; 29 ontbraken (vooral psychiatrische campussen en kleinere sites, bv. Universitair Ziekenhuis Brussel, AZ Vesalius Bilzen, AZORG Ninove). 28 OSM-punten in Vlaanderen staan niet in de lijst: revalidatiecentra, psychiatrische verzorgingstehuizen, forensische centra, een voormalig ziekenhuis ("voormalig ZNA Sint-Erasmus") en enkele dubbels. 43 gekoppelde campussen liggen meer dan 75 m van het officiële punt (grote campussen), 23 hebben een andere naam (vaak na een fusie: OSM heeft nog "ZNA" waar de bron "ZAS" schrijft). Spoed staat nu per campus uit de officiële bron (90 spoeddiensten).
- **AED**: 102 toestellen van de Stad Brussel, Verviers en Villers-la-Ville. De coördinaten van de Brusselse dataset bleken onbruikbaar (tot vijftien toestellen op verschillende adressen op hetzelfde punt); ze zijn opnieuw geplaatst op het adres met BeST. 13 adressen zonder (gevonden) huisnummer staan niet op de kaart. Toestellen in hetzelfde gebouw tellen als één punt. Slechts 6 vielen samen met een AED uit OpenStreetMap: de AED's in stedelijke gebouwen zijn in OSM grotendeels niet in kaart gebracht. Het nationale register (ongeveer 19.000 toestellen) is aan te vragen.
- **Drinkwater**: 126 punten uit zes open datasets (Brussel, Vivaqua, NMBS, Gent, Doornik, Hoei); 65 stonden al in OpenStreetMap, 61 zijn nieuw (waarvan de 50 drinkwaterplekken binnen in Gentse buurtwerkingen, met openingsuren).
- **Politie**: 17 kantoren van de politiezone Brussel Hoofdstad Elsene, geplaatst op het adres; 6 ontbraken in OSM.
- **Apotheken, dierenartsen, brandweer, gemeentehuizen, medische posten**: geen officiële bron met een open licentie gevonden. De beste bronnen (FAGG-kadaster, Orde der Dierenartsen, lijst hulpverleningsposten van de FOD Binnenlandse Zaken, Centrale Vindplaats van het Agentschap Binnenlands Bestuur, RIZIV) vragen toestemming; zie de lijst in [kaartdata.md](kaartdata.md#toestemming-aan-te-vragen).

### Verschillen om na te kijken

`pipeline/out/be-verschillen.csv`, 293 regels:

| Laag | ontbreekt_in_osm | niet_in_officieel | naam | adres | afstand | niet_geplaatst |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ziekenhuizen | 29 | 28 | 23 | 6 | 43 | 0 |
| aed | 83 | | | | | 13 |
| drinkwater | 61 | | | | | |
| politie | 6 | | 1 | | | |

### Officiële bronnen in deze run

| Bron | Laag | Licentie | Stand van de bron |
| --- | --- | --- | --- |
| Departement Zorg, POI-service | ziekenhuizen | Modellicentie gratis hergebruik v1.0 | 3 november 2026 |
| Stad Brussel, politiekantoren | politie | CC BY 4.0 | 11 september 2026 |
| Stad Brussel, defibrillatoren | aed | CC0 1.0 | 3 september 2026 |
| Ville de Verviers, défibrillateurs | aed | CC BY | 2 februari 2023 |
| Villers-la-Ville, défibrillateurs | aed | CC BY | 29 oktober 2026 |
| Stad Brussel, drinkwaterfonteinen | drinkwater | CC0 1.0 | 18 november 2026 |
| Vivaqua, drinkwatertappunten | drinkwater | CC BY 4.0 | 19 juni 2026 |
| NMBS, drinkwatertappunten in stations | drinkwater | CC BY 4.0 | 9 juli 2026 |
| Stad Gent, drinkwaterplekken | drinkwater | Modellicentie gratis hergebruik | 18 december 2025 |
| Ville de Tournai, fontaines | drinkwater | CC BY | 10 juli 2025 |
| Ville de Huy, points d'eau potable | drinkwater | CC BY | 22 juli 2026 |
| BOSA, BeST-adressen | (plaatsing) | CC BY 4.0 | 18 november 2026 |
