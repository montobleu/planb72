# Kaartlagen: officiële bronnen, eigen aanvullingen en meldingen

De kaartlagen (ziekenhuizen, medische posten, apotheken, AED, dierenartsen, politie, brandweer, gemeentehuizen, drinkwater) kwamen tot november 2026 alleen uit OpenStreetMap. OpenStreetMap is goed, maar niet volledig: een dierenartsenpraktijk die al 25 jaar bestaat, kan er gewoon ontbreken. Als PlanB72 die gegevens toont in een noodsituatie, moeten ze zo correct mogelijk zijn. Daarom voegt de pijplijn nu vier soorten gegevens samen.

| Herkomst (`betrouwbaarheid`) | Betekenis | Label op de kaart |
| --- | --- | --- |
| `officieel` | Uit een officiële lijst van locaties of een open dataset van een overheid (ziekenhuiscampussen, drinkwaterpunten, ...), met een licentie die hergebruik toelaat | **Officieel**, met de bron en de datum van de bron |
| `nagekeken` | Eigen aanvulling of correctie, door twee mensen nagekeken met een bron of bewijs | **Nagekeken**, met de datum van het nazicht en een link naar het bewijs |
| `osm` | Uit OpenStreetMap, niet apart nagekeken | **OpenStreetMap**, met de datum waarop de data opgehaald is |
| `open-bron` | Alleen uit een open bron van plekken (het plaatsendeel van Overture Maps Places: Meta, Microsoft, Foursquare, AllThePlaces), niet uit OpenStreetMap | **Open bron**, met de leveranciers en de datum van de release |

Los van de herkomst zegt het veld `zekerheid` hoeveel onafhankelijke bronnen een plek kennen: `bevestigd` (twee of meer) of `onzeker` (één open bron; open ring op de kaart, "Bel eerst"). Zie [Kruiscontrole](#kruiscontrole-zekerheid-uit-meerdere-bronnen).

**Een ondernemingsregister maakt nooit een punt.** Een inschrijving in de KBO, de VKBO, SIRENE of bij BrightQuery zegt waar iemand ingeschreven is, niet waar de praktijk is: een dierenarts of arts kan op zijn woonadres ingeschreven zijn en elders werken. Punten komen alleen uit bronnen die plaatsen beschrijven: OpenStreetMap, het plaatsendeel van Overture en officiële lijsten van locaties (ziekenhuiscampussen, het FAGG-kadaster van apotheken, het AED-register, de lijst van brandweerposten). Een register mag een punt dat er al staat bevestigen en een ontbrekende naam of een ontbrekend adres aanvullen, als het binnen de koppelregels valt (afstand en naam of adres). Dat geldt voor alle lagen en alle landen.

Bij een conflict gaat de officiële bron voor. Elk verschil komt in een lijst die iemand kan nakijken en, waar dat kan, in OpenStreetMap kan verbeteren. Gesloten plekken verdwijnen van de kaart.

## Hoe de pijplijn werkt

```sh
python3 pipeline/lagen.py BE        # ruwe lagen uit OpenStreetMap (ook in pipeline/out/osm/be/)
python3 pipeline/verrijken.py BE    # officiële bronnen en data/eigen/ erbij
```

1. **OpenStreetMap**: `lagen.py` schrijft de ruwe laag naar `site/public/data/<land>/` en naar `pipeline/out/osm/<land>/`.
2. **Officiële bronnen**: `pipeline/officieel.py` downloadt elke bron (cache van zeven dagen in `pipeline/out/officieel/`, `--vernieuw` haalt opnieuw) en zet ze om naar records met naam, adres, soort en punt. Alleen bronnen met een licentie die hergebruik in een ODbL-databank toelaat, staan daar.
3. **Adressen naar coördinaten**: bronnen zonder betrouwbare coördinaten worden geplaatst met het officiële adressenbestand BeST van BOSA (CC BY 4.0, 7,2 miljoen adressen), volledig offline (`pipeline/adressen.py`). Voor AED's telt alleen een gevonden huisnummer; het midden van een straat is te onnauwkeurig.
4. **Dubbels herkennen** (`pipeline/verrijken.py`, `pipeline/naam.py`): een officieel punt en een OSM-punt zijn dezelfde plek als ze dicht bij elkaar liggen en de naam of het adres overeenkomt. Namen worden vergeleken zonder accenten, leestekens en algemene woorden ("apotheek", "campus", "AZ"). De zoekstraal hangt af van de laag (400 m voor ziekenhuizen, 300 m voor gemeentehuizen, 150 m standaard; punten zonder naam alleen binnen 25 tot 60 m).
5. **Samenvoegen**: een gekoppeld punt krijgt de naam, het adres en het punt van de officiële bron, en behoudt openingsuren, toegang en dergelijke uit OpenStreetMap (veld `osm` = de OSM-id). Officiële punten zonder koppeling komen erbij; OSM-punten zonder koppeling blijven staan.
6. **Open bronnen** (`pipeline/derden.py`): Overture Maps Places bevestigt bestaande punten en vult plekken aan die in twee onafhankelijke bronnen staan (zie hieronder).
7. **Eigen aanvullingen** uit `data/eigen/<land>/<laag>.json` komen als laatste (zie hieronder).
8. **Verschillen** komen in `pipeline/out/<land>-verschillen.csv`, de tellingen in `pipeline/out/<land>-verrijking.json` en in `meta.json` (per laag: `osm`, `officieel`, `nagekeken`, `osm_ruw`, `bronnen`). De wekelijkse workflow `kaartlagen.yml` draait beide stappen en bewaart de verschillenlijst als artefact.

### De verschillenlijst

| `verschil` | Wat het betekent | Wat te doen |
| --- | --- | --- |
| `ontbreekt_in_osm` | Officieel punt zonder overeenkomst in OpenStreetMap | Nakijken en eventueel in OSM toevoegen (zie onderaan) |
| `niet_in_officieel` | OSM-punt in het gebied van een volledige officiële bron, maar niet in die bron | Gesloten, verhuisd of geen erkende instelling? Nakijken |
| `naam`, `adres`, `afstand` | Gekoppeld, maar naam, adres of punt verschilt (afstand > 75 m) | Nakijken welke juist is; OSM of de bron verbeteren |
| `gesloten_officieel` | Volgens de officiële bron gesloten, staat nog in OSM | In OSM aanpassen |
| `niet_geplaatst` | Adres van de bron niet (precies genoeg) gevonden in BeST | Adres nakijken; staat niet op de kaart |
| `open_bron_nieuw` | Plek alleen uit Overture toegevoegd (kolom `uitleg`: leveranciers en zekerheid) | Steekproef; bij twijfel melden of in `data/eigen/` als gesloten zetten |
| `gesloten_open_bron` | Volgens Overture definitief gesloten (meestal uit een ondernemingsregister), staat nog op de kaart | Nakijken; het punt blijft staan tot een tweede bron het bevestigt |
| `register_zonder_plek` | Inschrijving in een ondernemingsregister (VKBO, SIRENE) zonder plek in OSM of Overture; niet op de kaart | Werklijst: is er ter plaatse een praktijk, voeg ze dan toe in OSM of in `data/eigen/` |
| `eigen_*` | Wat er met een eigen aanvulling gebeurde | Bij `eigen_conflict_officieel`: aan de bron melden |

## Bronnen per laag (België)

Stand van 18 november 2026. Alles staat in `data/bronnen/register.json` met eigenaar, licentie en opmerking. Elke bron is door een onderzoeker zelf geopend; wat niet bevestigd kon worden, staat zo in het register.

| Laag | In de pijplijn (open licentie) | Toestemming aan te vragen of licentie onduidelijk |
| --- | --- | --- |
| Ziekenhuizen | Departement Zorg, POI-service (Vlaanderen, Modellicentie gratis hergebruik): algemene en psychiatrische ziekenhuizen, spoed per campus | FOD Volksgezondheid (spoed, MUG, heel België), AViQ (Wallonië), Vivalis (Brussel) |
| Medische posten | geen | RIZIV (medische huizen), huisartsenwachtposten (geen register gevonden) |
| Apotheken | geen | **FAGG-kadaster van apotheken** (4.801 apotheken met status, dagelijks), APB |
| Dierenartsen | VKBO van Digitaal Vlaanderen (Modellicentie gratis hergebruik): alleen ter bevestiging van plekken uit OSM en Overture, nooit als eigen punt | KBO Open Data (heel België, ook eenmanszaken; account en licentie), Orde der Dierenartsen (NGROD), CRFOMV, UPV |
| Politie | Stad Brussel, politiekantoren (CC BY 4.0; geplaatst op het adres) | politie.be (niet bereikbaar voor onderzoek), Stad Antwerpen |
| Brandweer | geen | **FOD Binnenlandse Zaken, lijst hulpverleningsposten** (318 posten), DBDMH Brussel |
| Gemeentehuizen | geen | Agentschap Binnenlands Bestuur (Centrale Vindplaats, 304 gemeenten; licentie niet gevonden), KBO Open Data, Wallonië (geen dataset gevonden) |
| AED | Stad Brussel (CC0), Verviers en Villers-la-Ville (CC BY) | **FOD Volksgezondheid, AED-register** (ongeveer 19.000 toestellen), Stad Antwerpen |
| Drinkwater | Stad Brussel (CC0), Vivaqua en NMBS (CC BY 4.0), Stad Gent (Modellicentie), Doornik en Hoei (CC BY) | Stad Antwerpen (97 drinkfonteinen; gebruiksvoorwaarden niet leesbaar) |
| (adressen) | BOSA BeST (CC BY 4.0) | |

Bewust niet gebruikt, hoewel open: Luik AED (laatst bijgewerkt 2018), Stad Brussel apotheken (2020), Verviers fonteinen (sierfonteinen), Thuin apotheken (licentie tegenstrijdig), FAVV-operatoren (geen namen). Een verouderde lijst met het label "officieel" zou vertrouwen wekken dat ze niet verdient.

Nederland, Luxemburg, Frankrijk en Duitsland: de belangrijkste bronnen staan in het register (onder andere FINESS+, GeoDAE, de lijsten van Police nationale en Gendarmerie en de Annuaire de l'administration voor Frankrijk; de Politiebureaus-API en het Register van Overheidsorganisaties voor Nederland; de CGDIS-centra voor Luxemburg; het Krankenhausverzeichnis en enkele deelstaten voor Duitsland). Ze zitten nog niet in de pijplijn: een adapter per bron in `pipeline/officieel.py` en een adressenbestand per land (BAN voor Frankrijk, BAG voor Nederland) zijn het volgende werk.

## Dierenartsen en artsen: een inschrijving is geen praktijk

Een ondernemingsregister zegt waar een dierenarts of arts ingeschreven is, niet waar de praktijk is. Veel dierenartsen hebben een vennootschap op hun woonadres en werken in een groepspraktijk of op verplaatsing (landbouwhuisdieren, paarden); artsen evengoed. Een eerdere versie zette inschrijvingen uit de VKBO en SIRENE als punt op de kaart, met een open ring voor wat onzeker was. Dat is teruggedraaid: zo'n punt kon naar iemands woning leiden.

Nu:

- **Punten** komen alleen uit OpenStreetMap, het plaatsendeel van Overture (Meta, Microsoft, Foursquare, AllThePlaces) en officiële lijsten van locaties.
- **De VKBO (Vlaanderen) en SIRENE (Frankrijk)** worden nog gelezen, maar alleen om een punt dat er al staat te bevestigen (`zekerheid: "bevestigd"`, veld `register`) en een ontbrekende naam of een ontbrekend adres aan te vullen. Een inschrijving die met geen enkele plek samenvalt, komt als `register_zonder_plek` in de verschillenlijst: een werklijst voor wie ter plaatse kan kijken.
- **BrightQuery** (het registerdeel van Overture) volgt dezelfde regel: een plek die Overture alleen van BrightQuery kent, komt niet op de kaart.
- **Een plek uit één plaatsenbron** blijft zoals in de regels hieronder: een open ring met "Bel eerst" voor apotheken en dierenartsen.
- **Persoonsnamen**: van een natuurlijke persoon tonen we nooit de naam, ook niet als aanvulling uit een register.

## Open bronnen van plekken: Overture Maps en Foursquare

Officiële lijsten zijn per land verschillend en vaak niet open (KBO, Orde der Dierenartsen, FAGG). Om de dekking niet land per land met de hand te verbeteren, gebruikt de pijplijn ook een open bron van plekken die heel Europa dekt. Onderzocht op 18 november 2026; elke bewering hieronder komt van de genoemde pagina.

### Overture Maps Places (gebruikt)

- **Wat**: het thema `places` van de Overture Maps Foundation (een project van de Linux Foundation, opgericht door AWS, Meta, Microsoft en TomTom). Maandelijkse release; 2026-11-18.0 telt ongeveer 88 miljoen plekken wereldwijd ([Places Guide](https://docs.overturemaps.org/guides/places/)).
- **Herkomst**: Meta (ongeveer 61 miljoen, pagina's van zaken), BrightQuery (ongeveer 17 miljoen; volgens de aankondiging van de Linux Foundation "sourced from more than 100,000 federal, state, and local government agencies through official public filings", dus uit overheids- en ondernemingsregisters), Microsoft (5,9 miljoen), Foursquare (3,6 miljoen), AllThePlaces (2 miljoen, CC0, gegevens van de websites van ketens) en kleinere vermeldingsdiensten waarmee een zaak zelf haar gegevens verspreidt (PinMeTo, Uberall, Krick, DAC, Birdeye, RenderSEO, OpenTravel). Het thema bevat **geen OpenStreetMap-data**.
- **Hoe een plek ontstaat**: Overture koppelt de records van de leveranciers (een model op naam, adres, website, telefoon, categorie en afstand) en houdt per plek het record van één leverancier; de lijst `sources` noemt elke leverancier in de groep met de datum (`update_time`).
- **Velden** ([schema](https://docs.overturemaps.org/schema/reference/places/place/)): `names`, `taxonomy` (hiërarchische categorie, ongeveer 2.300 soorten; sinds september 2026 vervangt die `categories`), `basic_category`, `confidence` (0 tot 1, de kans dat de plek bestaat; 0 = zeker gesloten), `operating_status` (`open`, `temporarily_closed`, `permanently_closed`), `addresses`, `phones`, `websites`, `brand`, `sources`.
- **Actualiteit**: in de uitsnede voor de vijf landen zijn de records van Meta en BrightQuery van september tot november 2026; die van Microsoft gaan terug tot 2013 en die van Foursquare tot 2021. Overture schrijft zelf dat het thema "duplicates, a high junk rate, and low property completeness" heeft en dat confidence het middel is om te filteren.
- **Licentie**: "The theme is published under the CDLA Permissive 2.0 and Apache 2.0 licenses" ([Attribution and Licensing](https://docs.overturemaps.org/attribution/)): Meta, Microsoft, BrightQuery en de vermeldingsdiensten CDLA-Permissive-2.0, Foursquare Apache-2.0 met een NOTICE-bestand, AllThePlaces CC0-1.0.
  - CDLA-Permissive-2.0 ([tekst](https://cdla.dev/permissive-2-0/)) laat gebruik, wijziging en verspreiding toe, met één voorwaarde: de tekst van de licentie gaat mee met de gedeelde data (art. 2.1). Geen share-alike, dus opnemen in een ODbL-databank mag. De OSM Foundation vond de CDLA Permissive "for the most part compatible with ODbL" ([analyse](https://osmfoundation.org/wiki/CDLA_permissive_compatibility), over versie 1.0, die nog strengere vermeldingsregels had). Overture zelf: "Joining CDLA Permissive 2.0 data to OpenStreetMap is permitted, but the resulting data may need to carry the Open Database License (ODbL)". Dat is bij PlanB72 al zo.
  - Apache-2.0 (Foursquare): een kopie van de licentie, een vermelding van wijzigingen en de volledige [NOTICE.txt](https://opensource.foursquare.com/places-notice-txt/) meegeven.
  - **Zo doet PlanB72 het**: `site/public/data/licenties/` bevat `CDLA-Permissive-2.0.txt`, `Apache-2.0.txt`, `Foursquare-NOTICE.txt` (met onze wijzigingen) en `LEESMIJ.txt`; die map hoort bij de kern van de app, zodat ze altijd mee op het toestel staat. `meta.json` per land noemt de bron `eu-overture-places` met licentie en release, elk punt met `betrouwbaarheid: "open-bron"` noemt zijn leveranciers (`herkomst`), en de licentieregel in de app (Over) vermeldt Overture Maps Places.
- **Wat niet mag of niet gebeurt**: PlanB72 neemt Overture-data niet over in OpenStreetMap (dat is een import, met eigen regels; zie onderaan). De plekken van AllThePlaces komen van websites van ketens; PlanB72 scrapet zelf niets.
- **BrightQuery** haalt zijn Belgische gegevens kennelijk uit de KBO (schrijfwijze "Nagels / Guy", stopzettingen als `permanently_closed`). Het is een ondernemingsregister: het maakt geen punten, het bevestigt alleen (zie hierboven). Of BrightQuery die gegevens onder CDLA mocht verspreiden, is de verantwoordelijkheid van BrightQuery en Overture; wie ook die bevestiging niet wil, zet `BrightQuery` in `derden.FAMILIE` uit.

### Foursquare Open Source Places (niet rechtstreeks gebruikt)

- **Wat**: meer dan 100 miljoen plekken, maandelijks, onder Apache-2.0 ([aankondiging, november 2024](https://location.foursquare.com/resources/blog/products/foursquare-open-source-places-a-new-foundational-dataset-for-the-geospatial-community/)). Gegevens van gebruikers en "Placemakers" (mensen en AI-agenten die plekken nakijken), crawls en derden.
- **Velden** ([schema](https://docs.foursquare.com/data-products/docs/places-os-data-schema)): naam, punt, adres, `date_created`, `date_refreshed` (laatste keer dat een gegeven ververst werd), `date_closed`, telefoon, website, categorieën (`fsq_category_ids`, zes niveaus), `unresolved_flags` (`closed`, `duplicate`, `doesnt_exist`, `privatevenue`, ...). Dat zijn precies de signalen voor "laatste controle" en "gesloten" die Overture niet heeft.
- **Toegang**: niet meer anoniem. De data staat sinds 2026 in het Foursquare Places Portal (account en toegangstoken, Iceberg-catalogus); de publieke S3-bucket is leeg. Op Hugging Face (`foursquare/fsq-os-places`, release 2026-11-17) is ze "gated": je geeft organisatie, functie en land op en stemt toe dat Foursquare "your employer or entity name and logo" in marketing gebruikt.
- **Beslissing**: PlanB72 maakt zelf geen account aan en aanvaardt geen voorwaarden in naam van het project. Het Foursquare-deel van Overture (3,6 miljoen plekken, Apache-2.0, getransformeerd op 18 maart 2026) komt wel binnen. Wil het kernteam de volledige dataset met `date_refreshed` en `unresolved_flags`, dan: een account op het Places Portal aanmaken (of de Hugging Face-voorwaarden aanvaarden), nagaan of het gebruik van de projectnaam in hun marketing aanvaardbaar is, en een lezer toevoegen in `pipeline/derden.py` (dezelfde duckdb-aanpak; de regel "laatste controle ouder dan drie jaar telt niet" kan dan `date_refreshed` gebruiken).

### Hoe de pijplijn Overture gebruikt

```sh
brew install duckdb                      # eenmalig; de rest blijft Python zonder pakketten
python3 pipeline/verrijken.py BE         # haalt de laatste release als die er nog niet is
python3 pipeline/verrijken.py BE --zonder-open-bron
```

1. **Uitsnede** (`derden.haal_overture`): de nieuwste release in de S3-bucket, alleen de 20 categorieën die bij een laag horen en de vijf landen (`addresses.country`). DuckDB leest de GeoParquet-bestanden rechtstreeks van S3 en schrijft `pipeline/out/derden/overture-<release>.ndjson.gz` (14,7 MB, ongeveer 2 minuten). GeoParquet met ZSTD-compressie is niet te lezen met de standaardbibliotheek van Python 3.9; daarom de duckdb-CLI, zoals osmium en pmtiles elders. De workflow `kaartlagen.yml` installeert ze.
2. **Vertaaltabel** (`derden.CATEGORIEEN`):

| Laag | Categorieën van Overture (`taxonomy.primary`) | Gebruik |
| --- | --- | --- |
| ziekenhuizen | hospital, general_hospital, psychiatric_hospital, specialty_hospital, childrens_hospital, emergency_department | alleen bevestigen |
| medisch | family_practice, primary_care_or_general_clinic, community_health_center, public_health_clinic, urgent_care_clinic | bevestigen en aanvullen (twee bronnen) |
| politie | police_station | bevestigen en aanvullen (twee bronnen) |
| brandweer | fire_station | bevestigen en aanvullen (twee bronnen) |
| apotheken | pharmacy | bevestigen en aanvullen (één bron: open ring) |
| aed | (geen categorie) | |
| drinkwater | drinking_fountain | bevestigen en aanvullen (twee bronnen); bijna leeg |
| overheid | town_hall | alleen bevestigen |
| dierenarts | veterinarian, veterinary_care, animal_hospital, emergency_pet_hospital | bevestigen en aanvullen (één bron: open ring) |

   Bewust niet: `doctors_office` (vooral specialisten en labo's), `government_office` (alle diensten), `public_fountain` (sierfonteinen). "hospital" in Overture is vooral paramedische praktijken, labo's en kantoren; "town_hall" ook cafés en voormalige gemeentehuizen. Die twee lagen krijgen daarom geen nieuwe punten.
3. **Namen**: geen persoonsnamen van natuurlijke personen op de kaart. Een naam komt alleen op de kaart als ze een woord bevat dat een zaak aanduidt (praktijk, kliniek, cabinet, Praxis, apotheek, centrum, een rechtsvorm, ...) of een merk is. "Gastmans Pascale", "Nagels / Guy" of "Dierenarts Orban Francoise" worden "dierenarts" zonder naam, en dan ook zonder telefoonnummer. Voor het herkennen van dubbels gebruikt de pijplijn wel de naam uit de bron.
4. **Dubbels binnen Overture** worden samengevoegd (zelfde adres binnen 60 m, of binnen 25 m met een gelijkaardige naam), met de leveranciers van de hele groep.
5. **Koppelen** met wat al op de kaart staat (OSM, officieel), met dezelfde regels als voor de officiële bronnen.

### Kruiscontrole: zekerheid uit meerdere bronnen

Een plek is betrouwbaarder als ze in meerdere bronnen staat die elkaar niet overschrijven. De pijplijn telt **families**: OpenStreetMap, een ondernemingsregister (VKBO, SIRENE, en BrightQuery, dat uit dezelfde registers put; alleen ter bevestiging), een officiële lijst van locaties (Departement Zorg, Stad Brussel, ...), Meta, Microsoft, Foursquare, AllThePlaces, en de vermeldingsdiensten samen. Twee bronnen uit dezelfde familie bevestigen elkaar niet: DAP Nagels in Tremelo staat in de VKBO en in BrightQuery, maar dat is twee keer de KBO.

| Regel | Waarde | Waarom |
| --- | --- | --- |
| Een leverancier telt alleen als zijn record recent is | laatste `update_time` hoogstens 3 jaar oud | records van Microsoft uit 2013 tot 2020 en van Foursquare uit 2021 zeggen weinig over vandaag |
| Bestaand punt + Overture uit een andere familie (confidence ≥ 0,5) | `zekerheid: "bevestigd"` | twee onafhankelijke bronnen |
| Plek uit Overture binnen 50 m van een punt van dezelfde laag, zonder duidelijk ander adres of andere naam (binnen 15 m altijd) | geldt als dat punt: bevestigt het, komt er niet naast | in OSM heet een apotheek vaak "Pharmacie", in Overture "Pharmacie du Centre"; zonder deze regel waren 1.664 van de nieuwe Franse apotheken dubbels |
| Punt op de kaart + inschrijving in een ondernemingsregister (VKBO, SIRENE) binnen de koppelregels | `zekerheid: "bevestigd"`, veld `register`; ontbrekende naam of adres aangevuld | het register bevestigt een plek die een plaatsenbron al kent |
| Inschrijving in een ondernemingsregister zonder plek | niet op de kaart; `register_zonder_plek` in de verschillenlijst | een inschrijving is geen praktijk (woonadres, zetel) |
| Nieuw punt: twee families in Overture, confidence ≥ 0,5 | `betrouwbaarheid: "open-bron"`, `zekerheid: "bevestigd"` | |
| Nieuw punt: één familie, confidence ≥ 0,8, alleen apotheken en dierenartsen | `zekerheid: "onzeker"`: open ring, "Bel eerst" | in de andere lagen is één leverancier te vaak fout |
| Verzadiging: minder dan 20% van de plekken die Overture zelf in twee families heeft, ontbrak in de laag (gemeten met minstens 30 zulke plekken) | geen nieuwe punten uit één bron in die laag en dat land | de laag is dan zo goed als volledig en plekken uit één bron zijn vooral dubbels en gesloten zaken (apotheken in Frankrijk: OSM 19.092, officieel 19.627); werkt automatisch, zonder instelling per land |
| Nieuw punt zonder vakwoord in de naam (apotheek, Feuerwehr, commissariat, ...) of met een winkelwoord (drogerie, Versand, shop) | valt weg | dm-drogerie markt als apotheek, een winkel voor brandweermateriaal als kazerne; uitzondering: een dierenarts uit een plaatsenbron die ook in een register staat (activiteitscode 75) en alleen een persoonsnaam heeft |
| Nieuw punt dat Overture alleen van BrightQuery kent | valt weg | een inschrijving, geen plek |
| Volgens Overture gesloten (`permanently_closed`, `temporarily_closed`) | niet toegevoegd; staat het al op de kaart, dan een regel `gesloten_open_bron` in de verschillenlijst | een stopzetting in de KBO is een sterk teken, geen zekerheid |
| Al de rest | valt weg (`open_te_zwak` in de metingen) | |

Een punt uit OpenStreetMap dat Overture niet kent, blijft zoals het was (geen ring): OpenStreetMap wordt door mensen ter plaatse bijgehouden. De metingen staan in [metingen.md](metingen.md#open-bronnen-overture-maps-places-18-november-2026).

## Toestemming aan te vragen

In volgorde van wat het meest oplevert. De adressen zijn de contactgegevens die op de site van de bron stonden (18 november 2026). Een aanvraag gaat pas weg na akkoord van het kernteam.

| # | Bron | Laag | Waarom | Contact |
| --- | --- | --- | --- | --- |
| 1 | FAGG, kadaster van de apotheken | apotheken | Volledig, dagelijks, met coördinaten en status (ook tijdelijk gesloten). Disclaimer: reproductie onderworpen aan voorafgaande toestemming | registration_pharmacy@fagg.be |
| 2 | FOD Volksgezondheid, AED-register | aed | Ongeveer 19.000 geregistreerde toestellen; OSM heeft er 5.700. Lijst op te vragen per e-mail | aed-dea@health.fgov.be |
| 3 | FOD Binnenlandse Zaken, hulpverleningsposten | brandweer | Enige volledige lijst van brandweerposten (pdf, alleen adressen); geen licentie vermeld | webmaster.scv-pcb@ibz.be of civieleveiligheid.be/nl/contact |
| 4 | FOD Volksgezondheid, spoed en MUG per campus | ziekenhuizen | Spoeddiensten in heel België, ook Wallonië, Brussel en Ostbelgien | aanvraagformulier gegevens DBI op health.belgium.be |
| 5 | Orde der Dierenartsen (NGROD) en CRFOMV, UPV | dierenarts | Ledenlijst en klinieken, ook Wallonië en Brussel; disclaimer: voorafgaande toestemming | info@ordederdierenartsen.be, info@ordre-veterinaires.be, upv@upv.be |
| 6 | Agentschap Binnenlands Bestuur, Centrale Vindplaats | overheid | Adres van het gemeentehuis van 304 gemeenten (fusies 2025 verwerkt); licentie niet gevonden | vlaanderen.be/lokaal-bestuur/contacteer-ons |
| 7 | RIZIV, medische huizen | medisch | 296 wijkgezondheidscentra; "alle rechten voorbehouden" | mh-mm@riziv-inami.fgov.be |
| 8 | AViQ (Wallonië), Vivalis (Brussel) | ziekenhuizen | Signaletiek van de ziekenhuizen; geen open dataset | soins.hospitaliers@aviq.be; vivalis.brussels/nl/contact (gegevensaanvraagformulier) |
| 9 | Stad Antwerpen | drinkwater, aed, politie, apotheken | Datasets bestaan; gebruiksvoorwaarden in een Word-document dat niet te openen was | open data Stad Antwerpen |
| 10 | Politie (politie.be) | politie | Commissariaten van alle zones; de site weigerde elke automatische aanvraag | via de contactpagina van de federale politie |
| 11 | FOD Economie, KBO Open Data | dierenarts, apotheken, overheid | Alle ondernemingen en vestigingen van België met NACE-code en adres, ook in Wallonië en Brussel. De download vraagt een account (zie hieronder) en de licentie is persoonlijk, niet overdraagbaar en eist ongewijzigde gegevens: publicatie onder ODbL vraagt schriftelijke toestemming. Vraag ze beperkt tot rechtspersonen en vestigingseenheden, zonder namen van natuurlijke personen | kbo-bce-webservice@economie.fgov.be |
| 12 | Foursquare, OS Places (volledige dataset) | alle | `date_refreshed`, `date_closed` en meldingen van gebruikers (`closed`, `doesnt_exist`) maken de kruiscontrole scherper. Geen toestemming nodig, wel een account en aanvaarding van voorwaarden (gebruik van de projectnaam in hun marketing): beslissing van het kernteam, zie [Foursquare](#foursquare-open-source-places-niet-rechtstreeks-gebruikt) | places-portal van Foursquare of huggingface.co/datasets/foursquare/fsq-os-places |

**KBO Open Data: wat een mens moet doen.** PlanB72 maakt zelf geen account aan. Iemand van het kernteam registreert zich op kbopub.economie.fgov.be/kbo-open-data (gebruikersnaam, naam, e-mail, taal, wachtwoord, captcha; ondernemingsnummer optioneel) en aanvaardt de gebruiksvoorwaarden. Het recht vervalt na een jaar zonder download. Zolang de FOD Economie publicatie onder de ODbL niet schriftelijk toestaat, mag de export alleen intern dienen, bv. om punten na te kijken, niet als laag op de kaart.

### Conceptbrief (Nederlands)

> Onderwerp: Vraag om hergebruik van [naam van de lijst] in een gratis noodapp
>
> Geachte heer, mevrouw,
>
> PlanB72 (planb72.org) is een gratis, open-source noodbibliotheek die volledig zonder internet werkt. Ze helpt burgers zich voor te bereiden op een ramp en toont op een offline kaart onder meer [ziekenhuizen, apotheken, AED's, ...]. PlanB72 is geen officiële dienst, heeft geen reclame, geen account en geen tracking.
>
> Vandaag komen die punten uit OpenStreetMap. Die gegevens zijn niet altijd volledig of actueel, en in een noodsituatie moet een kaart kloppen. Daarom willen we [naam van de lijst] gebruiken, zoals gepubliceerd op [adres].
>
> Volgens [de disclaimer / de gebruiksvoorwaarden] is daarvoor uw voorafgaande toestemming nodig. Wij vragen toestemming om:
>
> 1. de lijst wekelijks automatisch op te halen;
> 2. naam, adres, soort, status en ligging te tonen op de kaart in de app en op de website, met de vermelding "Bron: [eigenaar], [datum]";
> 3. de gegevens samen met OpenStreetMap te verspreiden onder de Open Database License (ODbL), zodat de kaart vrij herbruikbaar blijft.
>
> We nemen geen persoonsgegevens over (geen namen van personen, geen privételefoonnummers of e-mailadressen). Verschillen die we vinden tussen uw lijst en andere bronnen, sturen we u graag door.
>
> Kunt u ons laten weten of dit mogelijk is, en onder welke voorwaarden? Als een andere dienst hiervoor bevoegd is, horen we graag welke.
>
> Met vriendelijke groeten,
>
> [naam], namens PlanB72
> [e-mailadres van het project]

### Lettre type (français)

> Objet : Demande de réutilisation de [nom de la liste] dans une application d'urgence gratuite
>
> Madame, Monsieur,
>
> PlanB72 (planb72.org) est une bibliothèque d'urgence gratuite et open source qui fonctionne entièrement hors ligne. Elle aide les citoyens à se préparer à une catastrophe et affiche sur une carte hors ligne notamment [les hôpitaux, les pharmacies, les DEA, ...]. PlanB72 n'est pas un service officiel ; elle n'a ni publicité, ni compte, ni suivi.
>
> Ces points proviennent aujourd'hui d'OpenStreetMap, qui n'est pas toujours complet ni à jour. En situation d'urgence, une carte doit être exacte. Nous souhaitons donc utiliser [nom de la liste], publiée sur [adresse].
>
> Selon [l'avertissement / les conditions d'utilisation], votre autorisation préalable est nécessaire. Nous vous demandons l'autorisation :
>
> 1. de récupérer la liste automatiquement chaque semaine ;
> 2. d'afficher le nom, l'adresse, le type, le statut et la localisation sur la carte de l'application et du site, avec la mention « Source : [propriétaire], [date] » ;
> 3. de diffuser ces données avec OpenStreetMap sous la Open Database License (ODbL), afin que la carte reste librement réutilisable.
>
> Nous ne reprenons aucune donnée personnelle. Nous vous transmettrons volontiers les différences que nous constatons entre votre liste et d'autres sources.
>
> Pourriez-vous nous indiquer si c'est possible, et à quelles conditions ? Si un autre service est compétent, merci de nous le signaler.
>
> Veuillez agréer, Madame, Monsieur, nos salutations distinguées.
>
> [nom], pour PlanB72
> [adresse e-mail du projet]

Na een positief antwoord: bewaar het antwoord (zonder persoonsgegevens) bij het kernteam, zet in het register `toestemming` op `vrij` en vermeld de voorwaarden in `opmerking`, en schrijf een adapter in `pipeline/officieel.py`.

## Eigen aanvullingen en correcties

Een plek die ontbreekt of niet klopt en die in geen officiële bron staat, kan PlanB72 zelf toevoegen of corrigeren. Dat gebeurt in `data/eigen/<land>/<laag>.json`, met een pull request, en valt onder het nazicht (`docs/nazicht.md`): twee goedkeuringen, en `pipeline/controleer_inhoud.py` weigert een item zonder bron, datum, indiener of tweede nalezer.

Lagen: `ziekenhuizen`, `medisch`, `politie`, `brandweer`, `apotheken`, `aed`, `drinkwater`, `overheid`, `dierenarts`. Landen: `be`, `nl`, `lu`, `fr`, `de`.

Elk item heeft:

| Veld | Verplicht | Uitleg |
| --- | --- | --- |
| `actie` | ja | `toevoegen`, `corrigeren` of `gesloten` |
| `id` | ja | vaste sleutel, uniek in het bestand, bv. `be-dierenarts-0001` |
| `naam`, `adres` | bij toevoegen | adres als "Straat 12, 1234 Gemeente" |
| `lat`, `lon` | bij toevoegen; anders zonder `doel` | WGS84, vijf decimalen (rechtsklik in OpenStreetMap of een andere kaart, "coördinaten tonen") |
| `doel` | bij corrigeren of gesloten | de id van de plek op de kaart (`node/123`, of een officiële id); de app vult die in bij een melding vanuit een pop-up |
| `velden` | bij corrigeren | wat verandert, bv. `{"openingsuren": "Mo-Fr 08:00-18:00"}` |
| `bron` | ja | `{"soort": "website", "url": "https://...", "omschrijving": "..."}`; soorten: website, gemeentelijke lijst, officiële lijst, foto, ter plaatse, telefoon, andere |
| `datum` | ja | datum van de controle, JJJJ-MM-DD |
| `ingediend_door` | ja | wie het voorstelt (naam of GitHub-gebruiker) |
| `nagekeken_door` | ja | wie de bron zelf nakeek; nooit dezelfde persoon |

Een correctie of sluiting van een **officieel** punt wordt niet toegepast: de officiële bron gaat voor. De pijplijn zet het als `eigen_conflict_officieel` in de verschillenlijst, zodat iemand het aan de bron meldt.

### Voorbeeld: een dierenarts die ontbreekt

In het dorp van een van de initiatiefnemers zijn drie dierenartsen; de praktijk "Angelis" bestaat al 25 jaar en staat niet op de kaart. Om ze toe te voegen zijn deze gegevens nodig, en ze worden niet geraden:

1. de exacte naam van de praktijk zoals op het uithangbord of de eigen website;
2. het volledige adres (straat, huisnummer, postcode, gemeente);
3. het punt: breedte- en lengtegraad van de ingang;
4. een bron die een tweede persoon kan nakijken: de website van de praktijk, de vermelding in de gemeentelijke lijst, of een foto van het uithangbord met datum;
5. wie het indient en wie het nakijkt.

Daarna komt in `data/eigen/be/dierenarts.json` een item zoals dit (de waarden tussen haakjes zijn in te vullen):

```json
{
  "actie": "toevoegen",
  "id": "be-dierenarts-0001",
  "naam": "[exacte naam]",
  "adres": "[Straat nummer, postcode gemeente]",
  "lat": 0.0,
  "lon": 0.0,
  "soort": "dierenarts",
  "bron": { "soort": "website", "url": "[https://website-van-de-praktijk]", "omschrijving": "Adres en openingsuren op de eigen website" },
  "datum": "[JJJJ-MM-DD]",
  "ingediend_door": "[naam of GitHub-gebruiker]",
  "nagekeken_door": "[tweede persoon]"
}
```

`python3 pipeline/controleer_inhoud.py` controleert het item (een punt 0,0 ligt buiten België en wordt geweigerd). Na de goedkeuring neemt de volgende run van `verrijken.py` het mee. Staat de praktijk in OpenStreetMap op een andere plek of met een andere naam, dan vervangt het eigen punt dat OSM-punt.

## Melden vanuit de app

Op de kaart staat de knop **Plek ontbreekt of klopt niet**, en in elke pop-up **Klopt niet of gesloten?** (vooraf ingevuld met naam, adres, punt en id). Het formulier vraagt wat er is, de soort plek, naam, adres of een punt op de kaart, een opmerking en een bron. Niets daarvan is een persoonsgegeven en niets is verplicht behalve de soort en een adres of punt.

- De melding blijft op het toestel (`localStorage`, sleutel `meldingen`) tot ze verstuurd wordt; dat werkt ook zonder verbinding.
- Met verbinding toont het paneel "Meldingen op dit toestel" met per melding de knop **Versturen via GitHub**. Die opent een vooraf ingevuld issue volgens `.github/ISSUE_TEMPLATE/plek-melden.yml`; de melder kijkt het na en dient het in. Daarna verdwijnt de melding van het toestel.
- Er is geen server, geen sleutel en geen tracking: de app stuurt zelf niets. Daarvoor is wel een GitHub-account nodig. Een eindpunt in de beheermodule (`site/worker/beheer/`, pull request 5) kan later meldingen zonder account aannemen; dan blijft dit formulier hetzelfde en verandert alleen de knop.
- Een nalezer zet een bevestigde melding om in een item in `data/eigen/` (pull request, twee goedkeuringen).

## Teruggeven aan OpenStreetMap

PlanB72 bewerkt OpenStreetMap niet zelf en niet automatisch. Wat wel kan, zodat iedereen er baat bij heeft:

- **Eigen, nagekeken aanvullingen** (ter plaatse gezien, foto, eigen website van de plek) mogen in OpenStreetMap komen als de melder dat wil: het issuesjabloon vraagt akkoord voor hergebruik onder de ODbL. Een vrijwilliger met een eigen OSM-account voegt ze met de hand toe en vermeldt de bron in de changeset (`source=survey` of de website).
- **Verschillen met officiële bronnen** (`pipeline/out/<land>-verschillen.csv`, kolom `link`) zijn een werklijst: elke regel linkt naar het OSM-object. Per regel nakijken en met de hand verbeteren, of een notitie plaatsen. Overweeg een MapRoulette-taak met de Belgische gemeenschap (community.openstreetmap.org, categorie België) in plaats van zelf in bulk te bewerken.
- **Officiële gegevens** in OpenStreetMap overnemen is een import. Dat vraagt dat de licentie verenigbaar is met de ODbL en de bijdragersvoorwaarden van OSM (soms met een uitdrukkelijke verklaring van de eigenaar), overleg met de lokale gemeenschap en het volgen van de importrichtlijnen (wiki.openstreetmap.org/wiki/Import/Guidelines). Een licentie die in de PlanB72-databank past, volstaat daarvoor niet vanzelf. Vraag bij een toestemmingsbrief eventueel meteen of de eigenaar ook hergebruik in OpenStreetMap toestaat.
- Een AED-, apotheek- of ziekenhuisgegeven dat gesloten blijkt (`gesloten_officieel`, `eigen_gesloten`), kan in OSM met de juiste levenscyclustag (bv. `disused:amenity=pharmacy`) of verwijderd worden, na controle ter plaatse.

## Licentie

De samengevoegde lagen blijven een afgeleide databank van OpenStreetMap onder de ODbL. Officiële gegevens behouden hun bronvermelding: `meta.json` per land vermeldt elke bron met eigenaar, licentie en datum, en de pop-up toont de bron per punt. Eigen aanvullingen worden onder de ODbL gepubliceerd.
