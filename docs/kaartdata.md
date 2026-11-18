# Kaartlagen: officiële bronnen, eigen aanvullingen en meldingen

De kaartlagen (ziekenhuizen, medische posten, apotheken, AED, dierenartsen, politie, brandweer, gemeentehuizen, drinkwater) kwamen tot november 2026 alleen uit OpenStreetMap. OpenStreetMap is goed, maar niet volledig: een dierenartsenpraktijk die al 25 jaar bestaat, kan er gewoon ontbreken. Als PlanB72 die gegevens toont in een noodsituatie, moeten ze zo correct mogelijk zijn. Daarom voegt de pijplijn nu drie soorten gegevens samen.

| Herkomst (`betrouwbaarheid`) | Betekenis | Label op de kaart |
| --- | --- | --- |
| `officieel` | Uit een officieel register of een open dataset van een overheid, met een licentie die hergebruik toelaat | **Officieel**, met de bron en de datum van de bron |
| `nagekeken` | Eigen aanvulling of correctie, door twee mensen nagekeken met een bron of bewijs | **Nagekeken**, met de datum van het nazicht en een link naar het bewijs |
| `osm` | Uit OpenStreetMap, niet apart nagekeken | **OpenStreetMap**, met de datum waarop de data opgehaald is |

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
6. **Eigen aanvullingen** uit `data/eigen/<land>/<laag>.json` komen als laatste (zie hieronder).
7. **Verschillen** komen in `pipeline/out/<land>-verschillen.csv`, de tellingen in `pipeline/out/<land>-verrijking.json` en in `meta.json` (per laag: `osm`, `officieel`, `nagekeken`, `osm_ruw`, `bronnen`). De wekelijkse workflow `kaartlagen.yml` draait beide stappen en bewaart de verschillenlijst als artefact.

### De verschillenlijst

| `verschil` | Wat het betekent | Wat te doen |
| --- | --- | --- |
| `ontbreekt_in_osm` | Officieel punt zonder overeenkomst in OpenStreetMap | Nakijken en eventueel in OSM toevoegen (zie onderaan) |
| `niet_in_officieel` | OSM-punt in het gebied van een volledige officiële bron, maar niet in die bron | Gesloten, verhuisd of geen erkende instelling? Nakijken |
| `naam`, `adres`, `afstand` | Gekoppeld, maar naam, adres of punt verschilt (afstand > 75 m) | Nakijken welke juist is; OSM of de bron verbeteren |
| `gesloten_officieel` | Volgens de officiële bron gesloten, staat nog in OSM | In OSM aanpassen |
| `niet_geplaatst` | Adres van de bron niet (precies genoeg) gevonden in BeST | Adres nakijken; staat niet op de kaart |
| `eigen_*` | Wat er met een eigen aanvulling gebeurde | Bij `eigen_conflict_officieel`: aan de bron melden |

## Bronnen per laag (België)

Stand van 18 november 2026. Alles staat in `data/bronnen/register.json` met eigenaar, licentie en opmerking. Elke bron is door een onderzoeker zelf geopend; wat niet bevestigd kon worden, staat zo in het register.

| Laag | In de pijplijn (open licentie) | Toestemming aan te vragen of licentie onduidelijk |
| --- | --- | --- |
| Ziekenhuizen | Departement Zorg, POI-service (Vlaanderen, Modellicentie gratis hergebruik): algemene en psychiatrische ziekenhuizen, spoed per campus | FOD Volksgezondheid (spoed, MUG, heel België), AViQ (Wallonië), Vivalis (Brussel) |
| Medische posten | geen | RIZIV (medische huizen), huisartsenwachtposten (geen register gevonden) |
| Apotheken | geen | **FAGG-kadaster van apotheken** (4.801 apotheken met status, dagelijks), APB |
| Dierenartsen | VKBO van Digitaal Vlaanderen (Modellicentie gratis hergebruik): vennootschappen met NACE 75.000 en hun vestigingen in Vlaanderen | KBO Open Data (heel België, ook eenmanszaken; account en licentie), Orde der Dierenartsen (NGROD), CRFOMV, UPV |
| Politie | Stad Brussel, politiekantoren (CC BY 4.0; geplaatst op het adres) | politie.be (niet bereikbaar voor onderzoek), Stad Antwerpen |
| Brandweer | geen | **FOD Binnenlandse Zaken, lijst hulpverleningsposten** (318 posten), DBDMH Brussel |
| Gemeentehuizen | geen | Agentschap Binnenlands Bestuur (Centrale Vindplaats, 304 gemeenten; licentie niet gevonden), KBO Open Data, Wallonië (geen dataset gevonden) |
| AED | Stad Brussel (CC0), Verviers en Villers-la-Ville (CC BY) | **FOD Volksgezondheid, AED-register** (ongeveer 19.000 toestellen), Stad Antwerpen |
| Drinkwater | Stad Brussel (CC0), Vivaqua en NMBS (CC BY 4.0), Stad Gent (Modellicentie), Doornik en Hoei (CC BY) | Stad Antwerpen (97 drinkfonteinen; gebruiksvoorwaarden niet leesbaar) |
| (adressen) | BOSA BeST (CC BY 4.0) | |

Bewust niet gebruikt, hoewel open: Luik AED (laatst bijgewerkt 2018), Stad Brussel apotheken (2020), Verviers fonteinen (sierfonteinen), Thuin apotheken (licentie tegenstrijdig), FAVV-operatoren (geen namen). Een verouderde lijst met het label "officieel" zou vertrouwen wekken dat ze niet verdient.

Nederland, Luxemburg, Frankrijk en Duitsland: de belangrijkste bronnen staan in het register (onder andere FINESS+, GeoDAE, de lijsten van Police nationale en Gendarmerie en de Annuaire de l'administration voor Frankrijk; de Politiebureaus-API en het Register van Overheidsorganisaties voor Nederland; de CGDIS-centra voor Luxemburg; het Krankenhausverzeichnis en enkele deelstaten voor Duitsland). Ze zitten nog niet in de pijplijn: een adapter per bron in `pipeline/officieel.py` en een adressenbestand per land (BAN voor Frankrijk, BAG voor Nederland) zijn het volgende werk.

## Dierenartsen: wat zeker is en wat niet

Een ondernemingsregister zegt waar een dierenarts ingeschreven is, niet of daar een praktijk is die je kunt bezoeken. Veel dierenartsen hebben een vennootschap op hun woonadres en werken in een groepspraktijk of op verplaatsing (landbouwhuisdieren, paarden). Daarom krijgt elk punt uit een register het veld `praktijk`:

| `praktijk` | Wanneer | Op de kaart | Pop-up |
| --- | --- | --- | --- |
| `praktijk` | vestigingseenheid met handelsnaam; zetel van een vennootschap met handelsnaam of personeel; of dezelfde plek staat ook in OpenStreetMap | volle stip | "Zeker: ingeschreven vestiging met een handelsnaam of van een vennootschap. Niet zeker: openingsuren en of ze nu open is." |
| `onzeker` | vestigingseenheid zonder handelsnaam; zetel zonder vestiging, handelsnaam of personeel | open ring | "Zeker: hier is een dierenarts ingeschreven. Niet zeker: of hier een praktijk is die je kunt bezoeken (mogelijk een thuisadres of een dierenarts zonder vaste praktijk). Bel eerst." |
| (niet op de kaart) | maatschappelijke zetel van een vennootschap die elders vestigingseenheden heeft | | |

Eenmanszaken (natuurlijke personen) staan niet in de VKBO. In de Franse bron SIRENE zijn hun adressen meestal afgeschermd (diffusion partielle) en komen ze niet op de kaart. Van een natuurlijke persoon tonen we nooit de persoonsnaam, alleen een handelsnaam als die er is.

Frankrijk: INSEE SIRENE via de open API Recherche d'entreprises (Licence Ouverte 2.0), per departement, alleen actieve vestigingen met NAF 75.00Z. Nederland, Luxemburg en Duitsland hebben geen open register met de activiteitscode en het adres per vestiging (de open KvK-dataset heeft geen namen of volledige postcodes; de lijst van het Luxemburgse Collège vétérinaire heeft geen licentie); daar blijft OpenStreetMap de bron.

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
