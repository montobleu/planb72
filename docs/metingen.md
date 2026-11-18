# Metingen

## Dierenartsen, België (18 november 2026)

De laag dierenartsen kwam alleen uit OpenStreetMap: 846 punten, en in 214 van de 565 gemeenten geen enkele dierenarts. Een open register van alle praktijken bestaat niet (zie [kaartdata.md](kaartdata.md#dierenartsen-wat-zeker-is-en-wat-niet)). De VKBO van Digitaal Vlaanderen (Modellicentie gratis hergebruik) geeft wel alle vennootschappen met NACE 75.000 (veterinaire diensten) en hun vestigingen in Vlaanderen. `python3 pipeline/verrijken.py BE --lagen dierenarts`, gemeten met `python3 pipeline/dekking.py BE dierenarts` (gemeente van elk punt uit het adressenbestand BeST).

- VKBO: 2.376 records. 399 zetels vallen weg omdat hun vestigingen apart op de kaart staan. 162 inschrijvingen op hetzelfde adres als een andere zijn samengevoegd. Er blijven 1.815 plekken over, waarvan 11 waarvan het adres niet gevonden werd.
- Op de kaart: **2.423 punten** (was 846). Daarvan 1.804 uit de VKBO, waarvan 227 ook in OpenStreetMap stonden, en 619 alleen uit OpenStreetMap (vooral eenmanszaken, die niet in de VKBO staan, en Wallonië en Brussel).
- Zekerheid: 639 VKBO-punten zijn zeker een praktijk (handelsnaam, vennootschap met personeel, of ook in OSM). 1.165 zijn onzeker: een inschrijving zonder handelsnaam, vaak de vennootschap van één dierenarts op het woonadres. Die staan als open ring op de kaart, met "Bel eerst" in de pop-up.
- Vlaanderen: 446 punten voor, 2.023 na; gemeenten zonder dierenarts van 98 naar 8 (Baarle-Hertog, Drogenbos, Linkebeek, Wemmel, Boortmeerbeek, Nieuwerkerken, Dilsen-Stokkem, Herstappe). Daar staat geen vennootschap met NACE 75.000 ingeschreven; een dierenarts als eenmanszaak kan er wel zijn.
- Wallonië en Brussel: ongewijzigd. De volledige KBO (ook eenmanszaken, heel België) vraagt een account en schriftelijke toestemming voor publicatie (aanvraag 11 in kaartdata.md).

### Per provincie

| Provincie | Gemeenten | Zonder punt voor | Zonder punt na | Voor (OSM) | Na | Officieel | OSM | Waarvan onzeker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Antwerpen | 67 | 20 | 1 | 113 | 559 | 514 | 45 | 343 |
| Brussels Hoofdstedelijk Gewest | 19 | 2 | 2 | 47 | 47 | 0 | 47 | 0 |
| Henegouwen | 69 | 19 | 19 | 129 | 129 | 0 | 129 | 0 |
| Limburg | 38 | 14 | 3 | 47 | 267 | 250 | 17 | 134 |
| Luik | 84 | 48 | 48 | 84 | 84 | 0 | 84 | 0 |
| Luxemburg | 43 | 26 | 26 | 47 | 47 | 0 | 47 | 0 |
| Namen | 38 | 18 | 18 | 43 | 43 | 0 | 43 | 0 |
| Oost-Vlaanderen | 55 | 21 | 0 | 106 | 456 | 402 | 54 | 271 |
| Vlaams-Brabant | 63 | 20 | 4 | 95 | 322 | 267 | 55 | 164 |
| Waals-Brabant | 27 | 3 | 3 | 50 | 50 | 0 | 50 | 0 |
| West-Vlaanderen | 62 | 23 | 0 | 85 | 419 | 371 | 48 | 253 |
| **totaal** | **565** | **214** | **124** | **846** | **2423** | **1804** | **619** | **1165** |

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
