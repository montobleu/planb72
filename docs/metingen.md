# Metingen

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
