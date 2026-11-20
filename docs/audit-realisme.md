# Audit realisme: inhoud zonder stroom, gsm en internet

Datum: 18 november 2026. Status: concept, ter nazicht (zie `docs/nazicht.md`).

## Waarom

De teksten verwezen te vaak naar telefoneren, apps en websites, ook in acute stappen (bijvoorbeeld Tele-Onthaal bij een noodsituatie). Zonder elektriciteit valt het gsm-netwerk na korte tijd uit en zit niemand achter een computer. Daarom geldt nu de regel in `docs/schrijfwijzer.md` § 3 Realisme: elke handeling moet ook uitvoerbaar zijn als stroom, gsm, vaste lijn en internet uitgevallen zijn; eerst wat ter plaatse kan, telefoon en internet als tweede stap of als voorbereiding; 112 altijd met wat je doet als bellen niet lukt; hulplijnen alleen "na de crisis, als de telefoon weer werkt"; geen eigen advies, ook niet voor de offline alternatieven.

## Werkwijze

1. Per Nederlands bestand in `site/src/content/scenarios/`, `gidsen/` en `eerstehulp/` werden alle regels gezocht met bel, bellen, telefoon, gsm, smartphone, app, website, sms, internet, online, chat, e-mail, raadpleeg, kijk op, www, .be-adressen, BE-Alert, hulplijnen en nummers van drie of vier cijfers. Daarna werd elk bestand volledig gelezen.
2. Per treffer werd beslist: `houden` (werkt ook zonder netwerk, of is al tweede stap), `naar voorbereiding` (vooraf noteren, afdrukken, downloaden, installeren), `aangevuld met offline alternatief` (wat je doet als bellen of internet niet werkt, met bron), `herschreven` (volgorde of formulering aangepast), `naar "Na de crisis"` (hulplijnen), `verwijderd` (niet te bevestigen of overbodig).
3. De offline alternatieven komen uit drie bronnenonderzoeken (hieronder). Wat geen bron bevestigt, staat er niet.
4. Daarna werden de Franse, Duitse en Engelse vertaling van elk gewijzigd bestand bijgewerkt, met `vertaling: machine` en `origineel_datum: "2026-11-18"` (zie `docs/vertalen.md`).

## Wat de bronnen zeggen over "112 werkt niet"

**België**

- **112.be, veelgestelde vragen**: als 112 niet bereikbaar is: probeer een ander toestel (vast of mobiel), eventueel een andere operator, en vraag buren en omstanders om te bellen; verplaats je enkele meters; kun je nog bellen, probeer 101; bij een storing van de noodcentrales kunnen per provincie tijdelijke gsm-nummers actief zijn; zijn alle nummers onbereikbaar, neem rechtstreeks contact op met een ziekenhuis, de brandweerzone of de lokale politie. Die laatste stap veronderstelt dat je nog kunt bellen. [112.be](https://112.be/nl/veelgestelde-vragen)
- **FOD Economie, vragen van gezinnen over elektriciteitsschaarste (mei 2026)**: gsm-masten houden het één tot twee uur zonder stroom, mobiel internet valt snel weg, de vaste lijn werkt waarschijnlijk niet. "Als het niet langer mogelijk is om te bellen, raadpleeg dan de algemene informatie verspreid door de overheid of vraag hulp in uw buurt." Burgemeesters en gouverneurs hebben noodmaatregelen voorbereid, zoals een informatie- en onthaalpunt voor de bevolking; vraag je gemeente welke. Volg de media via een radio op batterijen of de autoradio. [FOD Economie](https://economie.fgov.be/nl/themas/energie/bevoorradingszekerheid/elektriciteit/elektriciteitsschaarste/veelgestelde-vragen/veelgestelde-vragen-door)
- **Nationaal Crisiscentrum**: spreek vooraf met familie af waar je elkaar terugvindt en met buren hoe je elkaar bereikt zonder telefoon of internet; hou een papieren lijst met contacten bij; een radio op batterijen of opwindradio (DAB+ en FM); de overheid kan informatieborden, folders, deur-aan-deurcommunicatie en omroepwagens van de politie inzetten; bij grotere noodsituaties richt de gemeente of provincie een onthaalcentrum in (sporthal, feestzaal). [Verstoring digitale infrastructuur](https://crisiscentrum.be/nl/risicos-belgie/maatschappelijke-risicos/verstoring-van-de-digitale-infrastructuur) · [Samen voorbereid](https://crisiscentrum.be/sites/default/files/documents/files/WEB-Brochure%20Samen%20voorbereid-NL.pdf) · [Informatie tijdens een noodsituatie](https://crisiscentrum.be/nl/wat-kan-jij-doen/informeer-je/informatie-tijdens-een-noodsituatie) · [Evacueren](https://crisiscentrum.be/nl/wat-kan-jij-doen/reageer-correct/evacueren)
- **KB van 22 mei 2019**: het noodplan van elke gemeente regelt de informatie aan de bevolking en de onthaal- en huisvestingscentra. [ejustice](https://www.ejustice.just.fgov.be/eli/besluit/2019/05/22/2019013001/justel)
- **Niet gevonden**: een Belgische officiële bron die zegt dat je naar de brandweerkazerne, het commissariaat of het ziekenhuis moet gaan als bellen niet lukt; een Belgische tegenhanger van de Nederlandse noodsteunpunten. De teksten zeggen dat dus niet als Belgisch advies.

**Buurlanden en andere landen** (in de teksten na het Belgische advies en benoemd als buitenlands)

- **Duitsland, BBK-Ratgeber 2025**: werken 110 en 112 niet, ga bij een noodgeval als het kan naar de dichtstbijzijnde politiepost of het ziekenhuis; weet vooraf waar je lokaal informatie krijgt (gemeentehuis, Notfalltreffpunkt). BBK Stromausfall: vraag je gemeente waar je een noodmelding kunt doen als het telefoonnet uitvalt (Katastrophenschutz-Leuchttürme). [BBK](https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/BBK-Vorsorgen-fuer-Krisen-und-Katastrophen.pdf?__blob=publicationFile&v=44)
- **Nederland**: bij de landelijke 112-storing van 24 juni 2019 stuurde NL-Alert burgers voor een spoedmelding naar de dichtstbijzijnde brandweerkazerne of het politiebureau, bij medische nood naar het ziekenhuis; agenten op straat aanspreken kon ook. Niet alle regio's bemanden toen hun kazernes. Noodsteunpunten zijn in 2026 nog in een pilot. [Inspectierapport](https://zoek.officielebekendmakingen.nl/blg-942150.pdf) · [VNG](https://vng.nl/nieuws/landelijke-pilot-noodsteunpunten-van-start)
- **Luxemburg, LetzPrepare**: ken vooraf het brandweercentrum, het commissariaat en het ziekenhuis bij je huis en werk; gemeenten kunnen opvangcentra met laadpunten en informatie openen.
- **Zweden, Krisinformation**: werkt 112 niet, ga naar de dichtstbijzijnde brandweerkazerne. **Zwitserland, BABS**: Notfalltreffpunkte om een noodoproep te doen.

**Eerste hulp zonder telefoon**

- Geef omstanders een taak en wijs iemand rechtstreeks aan; laat een slachtoffer alleen als het absoluut nodig is (ERC 2021 First aid; IFRC 2020; Gezondheid en Wetenschap; FEMA Until Help Arrives).
- Alleen en zonder telefoon: bij een volwassene eerst hulp alarmeren, dan reanimeren; bij een kind eerst 1 minuut reanimeren, dan hulp halen (ERC 2021 BLS en PLS). Niet bevestigd voor verdrinking en niet terug te vinden in de lekenbrochure van ERC 2025.

**Mentale steun tijdens een crisis**

- Psychologische eerste hulp ter plaatse: kijken, luisteren, verbinden; veiligheid, rust, verbondenheid, zelfredzaamheid en hoop; wie erg overstuur is of zichzelf iets kan aandoen niet alleen laten en hulp zoeken bij mensen in de buurt (WHO 2011, IFRC PS Centre 2018, Impact 2014, Rode Kruis-Vlaanderen, Gezondheid en Wetenschap).

De nieuwe bronnen (59) staan in `data/bronnen/register.json`, met licentie "Na te kijken" en toestemming "na te zien".

## Interface van de app

| Plaats | Wijziging |
| --- | --- |
| Rode 112-meldingen (startpagina, scenario's, eerste hulp) | Eerst uitgebreid met wat je doet als bellen niet lukt. Daarna heeft `inhoud-en-kaarten` (PR #8, geen vaste 112-banners) die meldingen weggehaald; die keuze is bij de merge gevolgd. Wat je doet als bellen niet lukt, staat nu in de inhoud zelf en op de pagina Noodnummers. |
| Noodnummers | Eerst de dringende nummers, dan een blok **Als bellen niet lukt** (112.be, FOD Economie, ERC, BBK, Nederland 2019, de kaart met Dichtstbij), dan "Andere nummers, als het netwerk werkt" (antigif, wachtdiensten, informatienummers, hulplijnen). `data/landen/*.json` bleef ongewijzigd; de splitsing volgt het bestaande veld `dringend`. |
| Officiële informatie | De radio staat bovenaan (de pagina sorteert op het soort kanaal; bewaarde vinkjes blijven op hun plaats). Uitleg, echtheid van berichten en tijdelijke nummers verwijzen eerst naar de radio, websites "als het internet werkt". |
| Tegels Start en Meer | "Radio, BE-Alert, 1771" in plaats van "BE-Alert, radio, 1771". |

De vier talen (nl, fr, de, en) zijn tegelijk aangepast in `site/src/i18n/app.ts`.

## Telling


| Besluit | Aantal |
| --- | --- |
| houden | 306 |
| aangevuld met offline alternatief | 238 |
| herschreven | 157 |
| naar voorbereiding | 35 |
| aangevuld | 23 |
| houden, aangevuld | 13 |
| naar "als het netwerk werkt" | 9 |
| naar "Na de crisis" | 5 |
| verwijderd | 2 |

## Overzicht per bestand

### Scenario's

| Bestand | Besluiten | Samenvatting |
| --- | --- | --- |
| `scenarios/aardbeving.md` | 5 aangevuld met offline alternatief, 4 houden, 3 herschreven, 1 aangevuld, 1 naar "als het netwerk werkt" | 112 bij gewonden kreeg de korte vorm voor als bellen niet lukt, ook in de stappen. Onder puin staat kloppen en het fluitje nu voor de sms; radio en omroepwagens komen eerst, de enquête op seismologie.be pas als het internet werkt. Onthaalcentrum toegevoegd. |
| `scenarios/bosbrand.md` | 6 herschreven, 5 houden, 2 aangevuld, 1 naar voorbereiding, 1 aangevuld met offline alternatief | Stappen beginnen nu met vluchten en anderen aanspreken; 112 volgt met het Belgische "geen bereik"-advies en een verwijzing naar Noodnummers. BE-Alert en websites staan na radio en omroepwagens. |
| `scenarios/brand.md` | 5 houden, 4 aangevuld met offline alternatief, 4 herschreven | "Bel 112 van buiten" blijft, met overal de korte vorm voor als bellen niet lukt en één blok "Lukt bellen niet" onder Tijdens > Thuis. Bij een geblokkeerde vluchtweg komt zichtbaar maken aan het raam (zonder netwerk) nu voor het bellen. |
| `scenarios/chemisch.md` | 6 herschreven, 6 houden, 6 aangevuld met offline alternatief, 4 naar voorbereiding | informatie komt nu eerst via radio (op batterijen of met slinger), tv en omroepwagens van de politie, daarna BE-Alert, websites en sociale media "als het netwerk werkt". "Bel niet" blijft als "Bel niet om informatie te vragen"; BE-Alert-inschrijvingen staan als voorbereiding. Sirenes zijn niet als Belgisch kanaal genoemd: geen actuele Belgische bron bevestigt ze (NCCN-teststrategie: tests tot december 2018). |
| `scenarios/co.md` | 5 houden, 3 aangevuld met offline alternatief, 2 herschreven | 112 blijft met de korte vorm voor als bellen niet lukt in de frontmatter en een blok "Lukt bellen niet" (blok A met blok B: iemand aanwijzen om hulp te halen, slachtoffer niet alleen laten) onder Tijdens > Thuis. Antigifcentrum en huisarts staan er "als het netwerk werkt"; eerst frisse lucht en een arts laten nakijken. |
| `scenarios/drinkwater.md` | 3 aangevuld met offline alternatief, 2 aangevuld, 2 herschreven, 1 houden | Het bericht in de brievenbus, de radio en omroepwagens staan nu voor de website van het waterbedrijf. Verdeelpunten en flessenwater van de overheid zijn bron-getrouw beschreven, met radio en klantendienst als het netwerk werkt. Voorbereiding kreeg radio en een papieren lijst. |
| `scenarios/gaslek.md` | 9 houden, 8 aangevuld met offline alternatief, 1 naar voorbereiding, 1 herschreven | het gasgeurnummer en 112 blijven, telkens met wat je doet als bellen niet lukt; een extra stap in de frontmatter en een blok "Lukt bellen niet" onder Tijdens > Thuis. Het Fluvius-contactformulier en de website van Sibelga/RESA zijn voorbereiding of "als het internet werkt" geworden. |
| `scenarios/hitte.md` | 7 houden, 5 aangevuld met offline alternatief, 2 herschreven | Langsgaan bij ouderen en kwetsbaren gaat nu voor bellen; 112 bij hitteslag kreeg de korte vorm voor als bellen niet lukt. Contactlijst op papier en afspraken zonder telefoon toegevoegd aan de voorbereiding. |
| `scenarios/kou.md` | 5 aangevuld met offline alternatief, 3 houden, 2 herschreven, 2 naar "als het netwerk werkt" | Langsgaan bij buren en ouderen vervangt "kijk naar"; 112 bij onderkoeling en CO kreeg de korte vorm of blok B-aanpak, het Antigifcentrum en de KMI-app staan onder "werkt het netwerk". Samenkomen om warmte te delen en het onthaalpunt van de gemeente toegevoegd. |
| `scenarios/luchtalarm.md` | 7 houden, 5 herschreven, 2 aangevuld met offline alternatief, 1 naar voorbereiding | informatie eerst via radio (op batterijen of met slinger), sirenes en omroepwagens, BE-Alert als het netwerk werkt; "Bel niet" blijft als "Bel niet om informatie te vragen". Bij 112 na een explosie staat nu wat je doet als bellen niet lukt (blok A en B, kort); het gezinsplan bevat afspraken voor als telefoon en internet niet werken. |
| `scenarios/nucleair.md` | 7 herschreven, 5 houden, 3 aangevuld met offline alternatief, 2 naar voorbereiding | zelfde lijn als chemisch: radio (op batterijen of met slinger), tv en omroepwagens van de politie eerst, BE-Alert, websites, sociale media en het informatienummer "als het netwerk werkt". "Bel niet om informatie te vragen" en 112 alleen bij een medisch noodgeval, met verwijzing naar Als bellen niet lukt. Sirenes zijn niet als Belgisch kanaal genoemd: geen actuele Belgische bron bevestigt ze. |
| `scenarios/overstroming.md` | 6 aangevuld met offline alternatief, 6 houden, 4 herschreven, 2 naar "als het netwerk werkt", 1 houden, aangevuld, 1 aangevuld | Stappen herschikt zodat de eerste vijf zonder netwerk kunnen; 112 kreeg blok A, 1722 en websites staan nu onder "werkt het netwerk", radio en omroepwagens komen voor BE-Alert. Voorbereiding kreeg radio, papieren lijst en afspraken zonder telefoon. |
| `scenarios/pandemie.md` | 5 houden, 4 aangevuld met offline alternatief, 1 houden, aangevuld, 1 aangevuld, 1 naar voorbereiding, 1 naar "als het netwerk werkt" | De huisarts bellen blijft. 112 bij alarmsignalen kreeg overal de korte vorm voor als bellen niet lukt, en voor dringende gevallen als je de huisarts niet bereikt staat een verwijzing naar Noodnummers. Informatie loopt via radio en tv voor websites; nummers van huisarts en wachtdienst op papier. |
| `scenarios/storm.md` | 7 houden, 4 aangevuld met offline alternatief, 3 naar "als het netwerk werkt", 2 herschreven | 112 kreeg blok A, 1722.be en de KMI-app staan nu onder "werkt het netwerk", de radio op batterijen komt bij binnen blijven. De stap met 1722 schoof naar achter en bevat nu 112 met de korte vorm. |
| `scenarios/stroomuitval.md` | 10 houden, 6 aangevuld met offline alternatief, 5 herschreven, 1 naar voorbereiding | Bellen en surfen gelden nu uitdrukkelijk "als het net nog werkt". 112 staat in `niet` en in Tijdens met wat je doet als bellen niet lukt (korte vorm van blok A). In Herkennen staan de cijfers van FOD Economie over gsm-masten en de vaste lijn. Voorbereiden kreeg de vraag aan de gemeente over een informatie- en onthaalpunt. Langsgaan bij buren en samenkomen om licht en warmte te delen staan erbij als stappen zonder netwerk. |
| `scenarios/telecom.md` | 17 houden, 7 herschreven, 7 aangevuld met offline alternatief, 2 naar voorbereiding | De `stappen` beginnen nu met wat zonder netwerk werkt: radio, ontmoetingspunt en langsgaan bij buren. 112 staat erbij met wat je doet als bellen niet lukt. "Hulp vragen bij levensgevaar" kreeg blok A. De vraag aan de gemeente staat nu in Voorbereiden, met FOD Economie en BBK als bron. De cijfers van FOD Economie (gsm-masten 1 tot 2 uur, vaste lijn, 100 en 101 niet gegarandeerd) maken Herkennen preciezer. |

### Gidsen

| Bestand | Besluiten | Samenvatting |
| --- | --- | --- |
| `gidsen/buiten-overleven.md` | 4 aangevuld met offline alternatief, 2 herschreven, 2 houden, 1 naar voorbereiding | Nieuw blok "Hulp halen" in Wat eerst komt: bellen als je bereik hebt, anders mensen aanspreken, twee of meer mensen sturen, zelf hulp zoeken of blijven en signalen geven. Elke "bel 112" kreeg een korte verwijzing daarnaar; Antigifcentrum "als het netwerk werkt"; natuurbrand volgt nu de volgorde van het Crisiscentrum. |
| `gidsen/communicatie-en-alarmering.md` | 11 houden, 8 herschreven, 5 aangevuld met offline alternatief, 1 naar voorbereiding | De gids zet nu eerst de kanalen die zonder netwerk werken: radio, omroepwagens, deur-aan-deur, informatieborden, sirenes, onthaalpunt en buren. Daarna volgen BE-Alert, websites, sociale media en 1771, onder "als het netwerk werkt". De volgorde van de secties is daarop aangepast. "Bellen of berichten sturen" kreeg de cijfers van FOD Economie en een blok "Als bellen niet lukt", met het Belgische advies vóór het buitenlandse. |
| `gidsen/dieren.md` | 5 houden, 2 aangevuld met offline alternatief, 1 herschreven | Kleine aanpassingen. De gids gaat vooral over voorbereiding. Dierenarts bellen staat nu als "als het netwerk werkt", het adres van de dierenarts komt op de papieren lijst, en de kaart in de app (knop Dichtstbij) toont dierenartsen. Bij een dier dat achterblijft wordt de sticker op raam of deur genoemd. |
| `gidsen/evacuatie.md` | 7 herschreven, 6 houden, 5 aangevuld met offline alternatief | Informatiekanalen herschikt (radio, omroepwagens, deur aan deur eerst; BE-Alert, websites en sms als het netwerk werkt), ontmoetingsplek, papieren lijst en kaart toegevoegd, het onthaal van de gemeente uitgelegd met verwijzing naar de kaart in de app, en familie verwittigen gesplitst in "zonder netwerk" en "als het netwerk werkt". |
| `gidsen/gevaren-in-de-natuur.md` | 11 aangevuld met offline alternatief, 6 houden, 3 herschreven | In Overzicht een blok "Lukt bellen niet" voor de natuur (ander toestel, mensen aanspreken, twee of meer sturen, slachtoffer niet alleen laten). Elke "bel 112" werd "bel 112 of laat iemand bellen" met een verwijzing naar dat blok; het Antigifcentrum staat er nu als "als het netwerk werkt", met huisarts en bewaren van de plant als gelijkwaardige stappen. |
| `gidsen/gezinsnoodplan.md` | 9 houden, 5 herschreven, 5 houden, aangevuld, 4 naar voorbereiding, 3 aangevuld met offline alternatief, 2 aangevuld, 1 naar "Na de crisis" | De afspraken zonder telefoon (ontmoetingspunt, briefje achterlaten, contactpersoon buiten de streek) staan nu vooraan, direct na de inleiding. De nummerlijst is nu uitdrukkelijk voorbereiding (vooraf op papier). Tele-Onthaal 106 is uit de noodnummers gehaald en staat in een eigen sectie "Na de crisis, als de telefoon weer werkt". Onder de noodnummers staat wat je doet als bellen niet lukt. |
| `gidsen/hygiene-en-sanitair.md` | 4 houden, 3 aangevuld met offline alternatief | Bij de aankondiging van de gemeente over afval staat nu dat die via de radio en de andere overheidskanalen komt. Bij ernstige diarree staat nu wat je doet als bellen niet lukt. Daarnaast is een bron in de frontmatter aangevuld die al in een bronregel stond. |
| `gidsen/jodium.md` | 2 houden, 2 herschreven, 2 aangevuld met offline alternatief, 1 naar voorbereiding | De tekst zegt nu duidelijker hoe je de aanbeveling hoort: via radio en tv en omroepwagens van de politie, ook zonder telefoon, en via BE-Alert als het netwerk werkt. De tabletten haal je uit voorzorg vooraf bij de apotheek. Wie er geen heeft, kan ze van de hulpdiensten krijgen. Het Antigifcentrum staat er nu bij met "als het netwerk werkt". Er staan nog altijd geen doseringen in. |
| `gidsen/kernwapen-en-radiologisch.md` | 3 herschreven, 2 houden, 1 aangevuld met offline alternatief | Eerst komt de radio op batterijen, en websites, sociale media en telefoon gelden als het netwerk werkt. De meldingen aan 112 en 101 kregen een korte "Lukt bellen niet". Bij de voorbereiding staat de radio nu voor BE-Alert. |
| `gidsen/licht-en-energie.md` | 8 aangevuld met offline alternatief, 8 houden, 2 herschreven, 2 naar voorbereiding | De telefoonsectie zegt nu eerst wat je van gsm, vaste lijn en mobiel internet mag verwachten (FOD Economie) en wat je doet als bellen en internet niet meer werken (radio, overheidskanalen, hulp in de buurt, Noodnummers). Toegevoegd: samenkomen met buren om licht en warmte te delen, Belgisch advies voor wie afhankelijk is van stroom, een verwijzing naar de gids medicatie en zorg, en de korte vorm van "Lukt bellen niet". |
| `gidsen/medicatie-en-zorg.md` | 5 houden, 4 aangevuld met offline alternatief, 2 herschreven, 2 naar voorbereiding | Nieuwe sectie "Als je je zorgverlener niet kunt bellen" voor wie afhankelijk is van zuurstof, dialyse, thuisbeademing of andere toestellen: vooraf afspreken, alles op papier, en wat je doet als bellen niet lukt (hulp in de buurt, radio, onthaalpunt, opvang elders, 112 met Noodnummers). Apotheek van wacht: eerst de lijst aan de apotheek, daarna de website als het netwerk werkt. 1733, Farmastatus en farmainfo.be staan nu met "als het netwerk werkt" of als voorbereiding. |
| `gidsen/mentale-veerkracht.md` | 7 herschreven, 6 houden, aangevuld, 4 houden, 3 aangevuld met offline alternatief, 2 aangevuld, 1 naar "Na de crisis", 1 verwijderd | De hulp tijdens de crisis draait nu om psychologische eerste hulp ter plaatse (blok D), met een nieuwe sectie in zeven punten en een uitgebreide sectie over wie meteen meer hulp nodig heeft: bij de persoon blijven en hulp zoeken bij mensen in de buurt. De tabel met hulplijnen staat nu in een aparte sectie "Na de crisis, als de telefoon weer werkt". De PEH-secties staan nu vooraan, vlak na de reacties. |
| `gidsen/na-de-wolk.md` | 6 houden, 4 herschreven, 4 aangevuld met offline alternatief, 1 naar "Na de crisis" | De hulplijnentabel staat nu in een aparte sectie "Na de crisis, als de telefoon weer werkt"; in de plaats ervan beschrijft "Mentale opvang" kort psychologische eerste hulp ter plaatse (blok D). Informatie komt eerst via de radio en omroepwagens, websites en het informatienummer pas "als het netwerk werkt", en bij 112 staat wat je doet als bellen niet lukt. |
| `gidsen/navigatie-zonder-gps.md` | 9 houden, 2 aangevuld met offline alternatief, 1 herschreven | De gids ging al uit van geen gsm. Stap 4 "bel om hulp" werd een volgorde zonder netwerk (mensen aanspreken, anders blijven en signalen geven), de app 112 BE staat als "als het netwerk werkt", en de plaatsbeschrijving geldt ook voor wie hulp gaat halen. |
| `gidsen/noodoproep.md` | 15 houden, 11 aangevuld met offline alternatief, 8 herschreven, 2 naar "Na de crisis", 1 naar voorbereiding, 1 verwijderd | De sectie "Geen bereik, geen simkaart of een netwerkstoring" staat nu vlak na "Je plaats doorgeven" en is uitgewerkt tot het volledige blok voor als bellen niet lukt: toestel, stroomuitval (FOD Economie), de vijf stappen van 112.be, de tijdelijke nummers, wat je zonder enig toestel doet (slachtoffer, buurt, radio, onthaalpunt), daarna apart het buitenlandse advies (BBK, Nederland 2019, Zweden) en wat je vooraf regelt. De hulplijnen 116 000, 1813, 106, 102 en 1712 zijn uit de nummertabel gehaald en staan in een nieuwe slotsectie "Na de crisis, als de telefoon weer werkt". |
| `gidsen/noodpakket-en-vluchttas.md` | 7 houden, 5 aangevuld met offline alternatief | Kleine aanpassingen: de lijst met nummers moet op papier en met adressen, samen met de afgesproken ontmoetingsplaats. Bij de powerbank staat nu dat je er niet op mag rekenen dat je altijd kunt bellen. Voor mensen met een beperking staat er nu: denk aan communicatie zonder telefoon of internet. |
| `gidsen/noodvoorraad.md` | 5 houden | geen wijziging nodig. De gids gaat over wat je vooraf in huis haalt en bevat geen handeling die van telefoon, app of website afhangt. |
| `gidsen/nucleair-schuilen-en-straling.md` | 6 houden, 3 herschreven, 2 aangevuld met offline alternatief, 1 naar voorbereiding | "Hoe je gewaarschuwd wordt" begint nu bij de radio op batterijen en de omroepwagens. BE-Alert, websites en sociale media gelden als het netwerk werkt, en je krijgt de informatie ook zonder telefoon (FAQ Nucleair risico). De 112-stappen kregen "Lukt bellen niet". Bij de voorbereiding kwamen een radio en een ontmoetingsplek met de familie. |
| `gidsen/openbare-schuilplekken.md` | 5 houden, 3 aangevuld met offline alternatief | Bij "dan bel je 112" staan nu wat je doet als bellen niet lukt en het Belgische advies voor wie onderweg is. Bij wat er in België bestaat kwamen het informatie- en onthaalpunt van de gemeente (FOD Economie) en de contactpersoon in het onthaalcentrum erbij. |
| `gidsen/schuilen-per-dreiging.md` | 8 herschreven, 8 houden, 7 aangevuld met offline alternatief, 1 naar voorbereiding | Radio op batterijen en omroepwagens staan nu voor BE-Alert, websites en sociale media. Elke 112-stap kreeg een korte "Lukt bellen niet" met een verwijzing naar Noodnummers. Apps, sms, 1722 en de huisarts staan er nu bij met "als het netwerk werkt". Familie verwittigen steunt nu op een vooraf afgesproken plek. |
| `gidsen/schuilplek-in-huis.md` | 5 houden, 2 aangevuld met offline alternatief, 1 herschreven | Tijdens het schuilen komt de informatie nu eerst van de radio op batterijen en de omroepwagens; BE-Alert en websites gelden als het netwerk werkt. Bij de voorbereiding kwamen een afspraak met de buren voor als er geen telefoon is en een papieren lijst met nummers. |
| `gidsen/signalen-en-noodcodes.md` | 10 houden, 7 herschreven, 2 aangevuld met offline alternatief, 2 naar voorbereiding | De gids begint nu als gids voor zonder netwerk: eerst mensen in de buurt aanspreken en iemand hulp laten halen, dan signalen; bellen met 112 of de app staat als laatste rij ("Je hebt toch bereik"). De waarschuwingskanalen zijn herschikt: eerst wat zonder stroom of netwerk werkt (radio, politie, deur aan deur, borden), daarna BE-Alert, tv en sociale media als het netwerk werkt. Bij het briefje komen buren verwittigen en een vooraf afgesproken ontmoetingsplaats; contact via telefoon alleen als het netwerk werkt. |
| `gidsen/voedsel-zonder-stroom.md` | 5 houden, 1 naar voorbereiding | Eén zin aangepast: recepten van het Voedingscentrum vooraf printen of opschrijven, omdat je ze zonder internet niet meer kunt opzoeken. Daarnaast Ready.gov: Water toegevoegd aan de frontmatter. Die bron stond al in een bronregel, maar ontbrak in de lijst. |
| `gidsen/warmte-en-koelte.md` | 7 aangevuld met offline alternatief, 4 houden, 1 herschreven, 1 naar voorbereiding | Bij kou staat nu het Belgische advies (Rode Kruis: in één ruimte blijven; FOD Economie: informatie- en onthaalpunt, radio, hulp in de buurt). Ook staat er nu dat je vooraf met buren afspreekt waar je samenkomt voor licht en warmte. Bij CO staat nu wat je doet als bellen niet lukt (blok B). De huisarts, de zorgverlener en het Antigifcentrum krijgen "als het netwerk werkt". Bij hitte staat er een plan met ziekenhuis of woonzorgcentrum voor wie stroomafhankelijk is. |
| `gidsen/water.md` | 5 aangevuld met offline alternatief, 1 houden | Vier plaatsen waar je "de overheid volgt" of "contact opneemt" zeggen nu hoe dat zonder netwerk gaat: radio en de andere kanalen van de overheid (blok C). Het kookadvies volg je via de radio, en als het netwerk werkt ook via BE-Alert en websites. De gezondheidsdienst contacteer je als het netwerk werkt. |
| `gidsen/weer-en-terrein.md` | 5 herschreven, 3 aangevuld met offline alternatief, 3 houden, 2 naar voorbereiding | Nieuw kader "Hoe je de waarschuwingen krijgt": radio eerst, KMI-website en app als het internet werkt, en zelf het weer lezen. 1722, Waterinfo, kustweerbericht.be en de KMI-app staan nu als "als het netwerk werkt" of als voorbereiding; getijtafels vooraf opzoeken; 112 kreeg telkens een korte terugvaloptie. |

### Eerste hulp

| Bestand | Besluiten | Samenvatting |
| --- | --- | --- |
| `eerstehulp/01-levensreddend-handelen.md` | 5 houden, 5 aangevuld met offline alternatief, 1 herschreven, 1 naar voorbereiding | Onderwerp 1 is nu de vaste plek voor hulp halen zonder telefoon: een uitgewerkt blok "Lukt bellen niet: hulp halen zonder telefoon" onder Bel 112 als (omstanders een taak geven, wat de loper meekrijgt, het slachtoffer alleen laten als het niet anders kan, verwijzing naar de reanimatieregel in onderwerp 2). De 112 BE-app staat er nu als "als het netwerk werkt", met installeren als voorbereiding. |
| `eerstehulp/02-reanimatie-en-aed.md` | 6 aangevuld met offline alternatief, 4 houden, 1 herschreven | De ERC-regel voor wie alleen is zonder telefoon staat nu in Wat doen en in Bel 112 als (volwassene: eerst hulp alarmeren, dan reanimeren; kind: eerst 1 minuut reanimeren, dan hulp halen, ERC 2021). Begeleiding door de operator is overal "als de verbinding werkt"; blok B toegevoegd met taakverdeling bij twee helpers. |
| `eerstehulp/03-ernstige-bloeding.md` | 3 aangevuld met offline alternatief, 2 houden | "Bel 112" aangevuld met laten bellen en, als bellen niet lukt, iemand sturen terwijl je blijft drukken; blok B toegevoegd onder Bel 112 als. |
| `eerstehulp/04-verslikking.md` | 4 aangevuld met offline alternatief, 3 houden | De drie "Bel 112"-stappen zijn aangevuld met laten bellen en iemand anders hulp laten halen; bij een kind dat zich ernstig verslikt blijf je bij het kind (ERC 2021 PLS). Blok B toegevoegd. |
| `eerstehulp/05-bewusteloosheid-en-stabiele-zijligging.md` | 4 aangevuld met offline alternatief, 3 houden, 1 herschreven, 1 naar voorbereiding | Alarmeringsstappen aangevuld met iemand hulp laten halen als bellen niet lukt; de verwijzing naar de app en filmpjes is voorbereiding geworden; blok B uitgebreid met zijligging als je toch weg moet en taakverdeling bij twee. |
| `eerstehulp/06-shock.md` | 3 aangevuld met offline alternatief, 2 houden, 1 herschreven | "Bel 112" aangevuld met laten bellen en een verwijzing naar Bel 112 als; opnieuw melden aan 112 alleen als de telefoon werkt; blok B toegevoegd. |
| `eerstehulp/07-brandwonden.md` | 7 aangevuld met offline alternatief, 3 houden, 1 herschreven | Elke "Bel 112" is "of laat bellen", met één verwijzing naar Bel 112 als in Wat doen; het Antigifcentrum blijft, als tweede stap "als de telefoon werkt"; blok B toegevoegd. |
| `eerstehulp/08-breuken-verstuikingen-en-ontwrichting.md` | 3 aangevuld met offline alternatief, 3 houden | "Bel 112" aangevuld met laten bellen en een verwijzing naar Bel 112 als; blok B toegevoegd. Zelf naar het ziekenhuis bij een gesloten breuk van arm, pols of hand bleef staan. |
| `eerstehulp/09-hoofd-nek-en-rugletsel.md` | 4 aangevuld met offline alternatief, 2 houden, 1 herschreven | De drie "Bel 112"-stappen zijn "of laat bellen", met één verwijzing naar Bel 112 als; blok B toegevoegd. Geen zijligging-advies voor wie weg moet bij een wervelletsel, omdat de bronnen dat niet zeggen. |
| `eerstehulp/10-onderkoeling-en-bevriezing.md` | 2 aangevuld met offline alternatief, 2 houden, 1 aangevuld | stap "Bel 112" kreeg "of laat iemand bellen" met verwijzing; onder Bel 112 als kwam blok B, aangepast aan onderkoeling (iemand anders laten blijven en warm houden, wind en regen tegenhouden). Kort-zin ongewijzigd (steunt niet op bellen). |
| `eerstehulp/11-oververhitting-en-hitteslag.md` | 3 houden, 2 aangevuld met offline alternatief, 1 herschreven, 1 aangevuld | kort-zin en stap 3 kregen "of laat iemand bellen / hulp halen" met verwijzing; onder Bel 112 als kwam blok B met taken voor omstanders (koelen, schaduw) en "blijf koelen". |
| `eerstehulp/12-vergiftiging-en-co.md` | 5 herschreven, 5 aangevuld met offline alternatief, 3 aangevuld, 3 houden | het Antigifcentrum (070 245 245) en de dokter van wacht (1733) blijven, nu met "werkt het netwerk"; elke "Bel 112" kreeg "of laat iemand bellen" en een verwijzing; onder Bel 112 als kwam blok B met wat je zonder telefoon doet: productinformatie meegeven, bij het slachtoffer in frisse lucht blijven, verpakkingen bewaren voor de hulpverleners. Kort-zin herschreven zodat ze niet alleen op bellen steunt. |
| `eerstehulp/13-elektrocutie.md` | 4 aangevuld met offline alternatief, 3 houden, 1 herschreven, 1 aangevuld | alle "Bel 112"-stappen kregen "of laat iemand bellen" en een verwijzing; onder Bel 112 als kwam blok B met een taak voor omstanders (iedereen op 10 meter houden bij hoogspanning) en een AED laten halen. Kort-zin aangevuld. |
| `eerstehulp/14-verdrinking.md` | 3 aangevuld met offline alternatief, 1 herschreven, 1 houden, 1 aangevuld | "laat iemand 112 bellen" kreeg een alternatief (die persoon haalt hulp), "Bel 112 als dat nog niet gebeurd is" kreeg een verwijzing; onder Bel 112 als kwam blok B. Voor reanimeren alleen zonder telefoon verwijst de tekst naar onderwerp 2; er staat geen eigen regel voor verdrinking. |
| `eerstehulp/15-allergische-reactie.md` | 3 aangevuld met offline alternatief, 3 houden, 2 aangevuld, 1 herschreven | kort-zin en de 112-stappen kregen "of laat iemand bellen / hulp halen" met verwijzing; de huisarts in de buurt blijft; onder Bel 112 als kwam blok B; bij de voorbereiding kwam een IFRC-punt over jezelf helpen als je alleen bent. |
| `eerstehulp/16-beroerte-en-hartinfarct-herkennen.md` | 3 herschreven, 3 aangevuld met offline alternatief, 2 aangevuld, 2 houden | 112-stappen kregen "of laat iemand bellen" met verwijzing; onder Bel 112 als kwam blok B (tijd telt, taken verdelen, bij hartaanval bij het slachtoffer blijven). Het punt over "richting ziekenhuis rijden en de ziekenwagen ontmoeten" (IFRC p. 177, hoofdstuk ademhalingsmoeilijkheden) is vervangen door de IFRC-passage over beroerte (p. 273): soms moet de helper het slachtoffer zelf naar een ziekenhuis brengen. Voor een hartaanval staat zelf vervoeren nergens; dat is niet opgenomen. |
| `eerstehulp/17-wondverzorging-en-infectie.md` | 7 houden, 1 herschreven, 1 aangevuld met offline alternatief, 1 aangevuld | onder Bel 112 als kwam blok B met verwijzing naar onderwerp 3 bij een ernstige bloeding; "Contacteer altijd een arts" bij een steekwonde werd "Laat een steekwonde altijd door een arts nakijken". De rest werkt al zonder netwerk. |

## Inkorting voor het opslagbudget

Na de herziening kwam de offline kern (app in vier talen plus zoekindex) samen met de nieuwe themaknop op `inhoud-en-kaarten` op 15,19 MB, boven het budget van 15 MB in `site/scripts/sw-manifest.mjs`. Daarom werden de teksten in een tweede ronde ingekort, in de vier talen tegelijk, zonder bron-gedekte handelingen te schrappen:

- herhaalde blokken "Lukt bellen niet" in scenario's en gidsen werden een korte zin met verwijzing naar de app-pagina Noodnummers (Als bellen niet lukt) of de gids Noodoproep; de volledige uitleg staat in de gids Noodoproep en op de pagina Noodnummers;
- `gidsen/mentale-veerkracht.md` (5.107 naar 3.436 woorden) en `gidsen/noodoproep.md` (5.763 naar 4.289) werden samengevoegd waar secties elkaar herhaalden;
- `gidsen/communicatie-en-alarmering.md` (4.297 naar 3.492) en `scenarios/telecom.md` (2.418 naar 1.796) kwamen binnen de richtlengte;
- in de andere scenario's en gidsen werden dubbele uitleg over radio en "als het netwerk werkt" samengevoegd.

Resultaat: 14,88 MB (vóór de herziening 14,06 MB). De tabellen hieronder beschrijven de besluiten van de eerste ronde; waar een volledig blok staat vermeld, is dat in de tweede ronde soms een verwijzing geworden.

## Open punten voor de nalezers

- Geen Belgische bron wijst een fysiek meldpunt aan als 112 niet werkt. Het informatie- en onthaalpunt van FOD Economie is beschreven voor een afschakeling. Een vraag aan het Nationaal Crisiscentrum of de brandweerzones om dit te bevestigen of aan te vullen is aangewezen.
- De regel "kind: eerst 1 minuut reanimeren" komt uit ERC 2021; nagaan of ERC 2025 ze behoudt.
- De Duitse en Nederlandse adviezen (politiebureau, brandweerkazerne, ziekenhuis) staan als buitenlands advies. De nalezer beslist of die vermelding in een Belgische context nuttig blijft.
- Citaten uit HTML-pagina's die met een ophaaltool gelezen werden, vóór publicatie nakijken op de live pagina.
- Alle vertalingen zijn `vertaling: machine` en wachten op moedertaalsprekers.

## Details per bestand

### Scenario's

#### scenarios/aardbeving.md

Samenvatting: 112 bij gewonden kreeg de korte vorm voor als bellen niet lukt, ook in de stappen. Onder puin staat kloppen en het fluitje nu voor de sms; radio en omroepwagens komen eerst, de enquête op seismologie.be pas als het internet werkt. Onthaalcentrum toegevoegd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 1 en 2 | dekking onder meubel; tegen binnenmuur | herschreven | Samengevoegd tot één punt om ruimte te maken voor 112, inhoud ongewijzigd |
| stappen 6 | "Na het schudden ..." | aangevuld met offline alternatief | "Luister naar de radio voor instructies" (Koninklijke Sterrenwacht FAQ) |
| stappen 7 | "verwittig de hulpdiensten" bij gas | houden | Crisiscentrum aardbeving, Sterrenwacht |
| stappen (nieuw) | 112 bij gewonden | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Voorbereiden > Met je gezin | waar je samenkomt | aangevuld | "ook als jullie elkaar niet kunnen bereiken" (Crisiscentrum digitale infrastructuur) |
| Tijdens > Altijd, In de auto | "Luister naar de radio" | houden | Al offline |
| Daarna > Eerste minuten | "Bel 112 bij gewonden." | aangevuld met offline alternatief | korte vorm blok A, verwijzing eerstehulpkaarten; 112.be, FOD Economie |
| Daarna > Zit je vast | "Stuur een sms of klop op een buis of muur" | herschreven | Kloppen eerst, sms als het netwerk werkt; fluitje blijft. Ready.gov earthquakes |
| Daarna > Communicatie | "Volg de instructies van radio en overheid" | aangevuld met offline alternatief | Radio op batterijen of autoradio, omroepwagens (FOD Economie, Crisiscentrum informatie tijdens een noodsituatie) |
| Daarna > Communicatie | "Bel alleen bij echte nood. Stuur liever een sms" | herschreven | sms als het netwerk werkt; Sterrenwacht, Ready.gov |
| Daarna > Communicatie | (nieuw) onthaalcentrum | aangevuld met offline alternatief | Crisiscentrum evacueren |
| Daarna > Communicatie | "vul de enquête in op seismologie.be" | naar "als het netwerk werkt" | "zodra het internet werkt" |
| Niet doen | "Bel niet zonder noodzaak." | houden | Sterrenwacht |
| Meer informatie | seismologie.be, Crisiscentrum | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/bosbrand.md

Samenvatting: Stappen beginnen nu met vluchten en anderen aanspreken; 112 volgt met het Belgische "geen bereik"-advies en een verwijzing naar Noodnummers. BE-Alert en websites staan na radio en omroepwagens.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 1 | "Bel 112 zodra je een brand ziet..." | herschreven | Naar positie 3, met "Geen bereik: vertrek en verwittig de mensen die je onderweg tegenkomt" en verwijzing Noodnummers. Volgorde zoals Crisiscentrum natuurbrand (bel 112 na de vluchtstappen) |
| stappen 3 | "Help anderen mee." | aangevuld | "spreek mensen aan die je tegenkomt" (Crisiscentrum natuurbrand) |
| Herkennen > Vlaanderen | "Bekijk de code op natuurenbos.be voor je vertrekt" | houden | Voorbereiding |
| Herkennen > Wallonië | "Dat verbod staat op de website van de gemeente." | herschreven | Informatieborden eerst, website erna |
| Herkennen > Informatie | "officiële kanalen, ook BE-Alert" | herschreven | Radio, tv, omroepwagens eerst; BE-Alert, websites als het netwerk werkt (Crisiscentrum informatie tijdens een noodsituatie) |
| Voorbereiden | "Neem een gsm mee. Installeer de 112-app." | naar voorbereiding | "vooraf"; Crisiscentrum natuurbrand |
| Voorbereiden > Met je gezin | telefoons op vaste plek | houden | Brandweer Nederland |
| Tijdens > Thuis | "Bel 112 als je een brand ziet" | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Tijdens > Thuis | "Volg BE-Alert, radio en de officiële kanalen" | herschreven | Radio en omroepwagens eerst |
| Tijdens > Thuis | "Zit je vast: bel 112 ... Doe de lichten aan" | herschreven | Lichten eerst, bron benoemd (Ready.gov wildfires) |
| Tijdens > Buiten | "Bel 112 of gebruik de 112-app" | houden | Crisiscentrum natuurbrand; staat al na de vluchtstappen |
| Tijdens > Buiten | "Geen bereik? Vertrek ..." | aangevuld | "of lukt bellen niet", verwijzing Noodnummers |
| Tijdens > Kwetsbare personen | "neem contact op met je arts" | houden | Ready.gov |
| Daarna | "Stuur berichten in plaats van te bellen" | herschreven | "Bel alleen in noodgevallen", berichten als het netwerk werkt (Ready.gov wildfires) |
| Meer informatie | natuurenbos.be, wallonie, 112-app | houden | Inleiding "Vooraf te lezen, of als het internet werkt"; 112-app "vooraf te installeren" |

#### scenarios/brand.md

Samenvatting: "Bel 112 van buiten" blijft, met overal de korte vorm voor als bellen niet lukt en één blok "Lukt bellen niet" onder Tijdens > Thuis. Bij een geblokkeerde vluchtweg komt zichtbaar maken aan het raam (zonder netwerk) nu voor het bellen.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 4 | "Bel 112 van buiten. Zeg wie je bent ..." | aangevuld met offline alternatief | korte vorm blok A: laat iemand anders bellen, vraag hulp in je buurt, verwijzing naar Noodnummers; 112.be FAQ, FOD Economie |
| frontmatter stappen 6 | "ga in een kamer zonder rook, sluit de deur, bel 112" | herschreven | eerst zichtbaar maken aan het raam, dan bellen; Ready.gov, Speel niet met vuur (stond al in Tijdens) |
| Voorbereiden > Vluchtplan | "Leg een telefoon en een zaklamp bij je bed" | houden | voorbereiding; KCCE |
| Voorbereiden > Vluchtplan | "wie belt 112" | houden | taakverdeling vooraf; Ready.gov |
| Tijdens > Thuis stap 7 | "Bel 112 van buiten" | aangevuld met offline alternatief | zin over bellen vanop een andere plek (112.be Hoe bel ik) en blok "Lukt bellen niet" (blok A, ingekort): buren laten bellen, ander toestel, verplaatsen, 101, hulp in je buurt, Nederlands voorbeeld 2019 met kazerne of politiebureau en kaart in de app; 112.be FAQ, FOD Economie, Inspecties NL 2020 |
| Tijdens > Thuis, vluchtweg geblokkeerd | "3. Bel 112 ... 4. Open een raam en maak je zichtbaar" | herschreven | volgorde omgedraaid: zichtbaar maken eerst; Ready.gov |
| Tijdens > Thuis, zelf blussen | "vlucht dan en bel 112" (2x) | houden | vluchten komt al eerst; blok staat erboven |
| Tijdens > Thuis, brandwonden | "Bel de hulpdiensten bij grote blaren" | aangevuld met offline alternatief | verwijzing naar het blok en naar de eerstehulpkaart Brandwonden |
| Tijdens > Buiten | "Zie je rook ... bel dan 112" | aangevuld met offline alternatief | korte vorm blok A; 112.be FAQ |
| Tijdens > Buiten | "Bel 112 en zeg de hulpdiensten waar die persoon is" | herschreven | "Zeg de brandweer waar die persoon is: via 112, of meteen als ze aankomt"; Ready.gov (tell operator / tell firefighters) |
| Tijdens > Kwetsbare personen | "Leg telefoon met de noodnummers erin ... bij het bed" | houden | voorbereiding; KCCE |
| Tijdens > Kwetsbare personen | "hou een telefoon bij de hand en zorg dat de hulpdiensten of de buren weten" | herschreven | buren eerst, telefoon als laatste zin; KCCE |
| Meer informatie | "Speelnietmetvuur.be: ..." | houden | achtergrond om vooraf te lezen, geen crisisstap |

#### scenarios/chemisch.md

Samenvatting: informatie komt nu eerst via radio (op batterijen of met slinger), tv en omroepwagens van de politie, daarna BE-Alert, websites en sociale media "als het netwerk werkt". "Bel niet" blijft als "Bel niet om informatie te vragen"; BE-Alert-inschrijvingen staan als voorbereiding. Sirenes zijn niet als Belgisch kanaal genoemd: geen actuele Belgische bron bevestigt ze (NCCN-teststrategie: tests tot december 2018).

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "Je krijgt een BE-Alert of de overheid vraagt om te schuilen." | herschreven | "De overheid vraagt via radio, omroepwagens of BE-Alert om te schuilen"; Crisiscentrum schuilen |
| frontmatter stappen 5 | "Volg BE-Alert, radio, tv en de officiële websites. Bel alleen bij nood, stuur liever een bericht." | herschreven | radio en omroepwagens eerst, BE-Alert en websites als het netwerk werkt, "Bel niet om informatie te vragen", 112 alleen bij nood; Crisiscentrum informatie tijdens een noodsituatie, Samen voorbereid |
| Herkennen | "via BE-Alert (sms ...), radio en tv, sociale media en officiële websites. Soms rijden er wagens met luidsprekers rond." | herschreven | volgorde radio/tv, omroepwagens van de politie, informatieborden, folders, deur-aan-deur; daarna BE-Alert enz. als het netwerk werkt; zin over uitval van internet en mobiele netwerken en radio op batterijen; Crisiscentrum informatie tijdens een noodsituatie, Samen voorbereid |
| Herkennen | Alert-SMS zonder inschrijving | houden | BE-Alert |
| Voorbereiden | "Kijk op seveso.be" | naar voorbereiding | "Kijk vooraf" |
| Voorbereiden | "Schrijf je in op BE-Alert" | houden | is al voorbereiding |
| Voorbereiden | "hoe bereik je elkaar zonder te bellen" | aangevuld met offline alternatief | ook met buren afspreken hoe je elkaar bereikt zonder telefoon of internet; papieren lijst met nummers; Crisiscentrum plan in jouw buurt, Samen voorbereid |
| Voorbereiden, verschil verdieping | "Geeft de overheid via BE-Alert een andere instructie" | herschreven | "via de radio, omroepwagens of BE-Alert" |
| Tijdens > Thuis stap 8 | "Zet de radio of tv aan" | aangevuld met offline alternatief | radio op batterijen of met slinger bij stroomuitval, omroepwagens; Samen voorbereid, Crisiscentrum informatie tijdens een noodsituatie |
| Tijdens > Thuis, Bellen | "Bel 112 alleen bij nood. Verwittig anderen met sms, WhatsApp, Signal" | herschreven | "Bel niet om informatie te vragen", 112 alleen bij nood met korte vorm blok A, huisgenoten en bewoners rechtstreeks verwittigen; berichten als het netwerk werkt; 112.be FAQ, Crisiscentrum schuilen |
| Tijdens > Buiten, contact met stof | "Bel ... het Antigifcentrum op 070 245 245" | houden | met "als het netwerk werkt"; arts eerst stond er al |
| Tijdens > In de auto | "Luister naar de radio" | houden | |
| Tijdens > Werk of school | "De school laat via haar eigen kanalen weten" | houden | geen handeling van de lezer |
| Tijdens > Kinderen | "Voeg het adres ... toe in BE-Alert" | naar voorbereiding | "vooraf"; meldingen als het netwerk werkt |
| Tijdens > Kwetsbare personen | "Verwittig hen met een bericht." | aangevuld met offline alternatief | in hetzelfde gebouw rechtstreeks (stap 6 Thuis, Crisiscentrum schuilen), anders bericht als het netwerk werkt |
| Tijdens > Kwetsbare personen | "Schrijf het adres ... in op BE-Alert" | naar voorbereiding | "vooraf" |
| Tijdens > Evacuatie | "Vertrek pas als de overheid het vraagt" | aangevuld met offline alternatief | vraag komt via radio, omroepwagen of aan je deur; Crisiscentrum informatie tijdens een noodsituatie, Samen voorbereid |
| Tijdens > Evacuatie | "gsm en lader, een lijst met telefoonnummers" | houden | meeneemlijst; Crisiscentrum evacueren |
| Tijdens > Evacuatie | "opvangcentrum dat gemeente of provincie inricht" | aangevuld met offline alternatief | sporthal of feestzaal, contactpersoon ter plaatse; anderen helpen verwittigen; Crisiscentrum evacueren |
| Daarna | "Wacht op het officiële bericht" | aangevuld met offline alternatief | "Luister daarvoor naar de radio" |
| Niet doen | "Bel niet zonder noodzaak." | herschreven | "Bel niet om informatie te vragen. Luister naar de radio."; Crisiscentrum schuilen |
| Meer informatie | links naar crisiscentrum.be, seveso.be, be-alert.be | naar voorbereiding | inleidende zin "Lees deze pagina's vooraf"; Samen voorbereid |

#### scenarios/co.md

Samenvatting: 112 blijft met de korte vorm voor als bellen niet lukt in de frontmatter en een blok "Lukt bellen niet" (blok A met blok B: iemand aanwijzen om hulp te halen, slachtoffer niet alleen laten) onder Tijdens > Thuis. Antigifcentrum en huisarts staan er "als het netwerk werkt"; eerst frisse lucht en een arts laten nakijken.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 4 | "Bel 112 als iemand klachten heeft" | aangevuld met offline alternatief | korte vorm blok A; 112.be FAQ, FOD Economie |
| frontmatter stappen 6 | "Bel bij vragen of twijfel het Antigifcentrum" | houden | met "als het netwerk werkt"; nummer ongewijzigd |
| Voorbereiden | geisers, keuringen | houden | geen netwerkafhankelijke stap |
| Tijdens > Thuis stap 5 | "Bel 112" | aangevuld met offline alternatief | "of laat iemand bellen" en blok "Lukt bellen niet": buren, ander toestel, verplaatsen, 101, hulp in je buurt, iemand aanwijzen met waar/wat/hoeveel/toestand, slachtoffer niet alleen laten; 112.be FAQ, FOD Economie, ERC 2021 First aid |
| Tijdens > Thuis, bewusteloos | "Bel onmiddellijk 112" | aangevuld met offline alternatief | "of laat iemand bellen", verwijzing naar het blok |
| Tijdens > Thuis, bij bewustzijn | "bel de huisarts. Bel het Antigifcentrum" | herschreven | frisse lucht en laten nakijken door een arts eerst (Antigifcentrum brochure, al in Daarna); huisarts en Antigifcentrum als het netwerk werkt |
| Tijdens > Werk of school | "lucht, naar buiten, 112" | houden | verwijst naar Thuis |
| Daarna | "Bel ook een vakman bij een oranje vlam" | houden | geen acute stap |
| Daarna | "Wie bij bewustzijn is, belt de huisarts" | herschreven | "als het netwerk werkt"; "laat je nakijken door een arts" staat ervoor |
| Meer informatie | links naar Antigifcentrum, Netwerk Brandweer, be.brussels, KMI | houden | achtergrond, geen crisisstap |

#### scenarios/drinkwater.md

Samenvatting: Het bericht in de brievenbus, de radio en omroepwagens staan nu voor de website van het waterbedrijf. Verdeelpunten en flessenwater van de overheid zijn bron-getrouw beschreven, met radio en klantendienst als het netwerk werkt. Voorbereiding kreeg radio en een papieren lijst.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 1 | "Lees het bericht van je waterbedrijf goed." | aangevuld met offline alternatief | Bericht in de brievenbus (SWDE), radio (Crisiscentrum informatie tijdens een noodsituatie), website als het internet werkt |
| stappen 5 | "Valt het water weg: gebruik je voorraad." | aangevuld | Verdeelpunten (SWDE), flessenwater door de overheid (Crisiscentrum drinkwater) |
| Herkennen | "meldt een probleem op zijn website en met een bericht in de brievenbus" | herschreven | Brievenbus eerst; nieuwe alinea "Hoe je het hoort" met radio, tv, omroepwagens, daarna BE-Alert en websites (blok C) |
| Voorbereiden (nieuw) | Informatie zonder netwerk | aangevuld met offline alternatief | Radio op batterijen of opwindradio; nummer klantendienst op papieren lijst (Crisiscentrum Samen voorbereid) |
| Tijdens > rood | "verdeelpunten met flessenwater of een tankwagen. De klantendienst weet waar." | herschreven | SWDE: verdeelpunten, plaats in het bericht op de website en bij de klantendienst. "Tankwagen" verwijderd: niet bevestigd in de SWDE-pagina |
| Tijdens > Geen water | (nieuw) | aangevuld met offline alternatief | Burgemeester, gouverneur of minister kunnen flessenwater laten verdelen (Crisiscentrum drinkwater); radio, brievenbus, omroepwagens |
| Daarna | "groen bericht" | aangevuld | "in de brievenbus" (SWDE) |
| Meer informatie | Crisiscentrum, SWDE, eigen waterbedrijf | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/gaslek.md

Samenvatting: het gasgeurnummer en 112 blijven, telkens met wat je doet als bellen niet lukt; een extra stap in de frontmatter en een blok "Lukt bellen niet" onder Tijdens > Thuis. Het Fluvius-contactformulier en de website van Sibelga/RESA zijn voorbereiding of "als het internet werkt" geworden.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 1 | "geen gsm binnen" | houden | veiligheidsregel; Fluvius |
| frontmatter stappen 5 | "Bel van buiten het gratis gasgeurnummer ... Bij brand ... bel 112" | houden | nummers ongewijzigd |
| frontmatter stappen 6 (nieuw) | (geen) | aangevuld met offline alternatief | korte vorm blok A; 112.be FAQ, FOD Economie |
| frontmatter niet | "Niet binnen met de gsm bellen" | houden | Fluvius |
| Voorbereiden | "zoek het gasgeurnummer op de website van je netbeheerder" | naar voorbereiding | "zoek vooraf ... en noteer het" |
| Voorbereiden | "Fluvius heeft een contactformulier" | aangevuld met offline alternatief | werkt alleen met internet; spreek af dat huisgenoten of buren voor je bellen; Crisiscentrum plan voor wie extra hulp nodig heeft, 112.be FAQ |
| Tijdens > Thuis stap 3 | "Gebruik binnen geen telefoon of gsm" | houden | Fluvius |
| Tijdens > Thuis stap 7 | "Bel buiten ... het gasgeurnummer" | aangevuld met offline alternatief | blok "Lukt bellen niet" (blok A, ingekort, aangepast: altijd waar je geen gas ruikt; 101 alleen bij brand, ontploffing, gewonden); 112.be FAQ, FOD Economie |
| Tijdens > Thuis, gasbrand | "Bel 112 en daarna het gasgeurnummer" | aangevuld met offline alternatief | verwijzing naar het blok |
| Tijdens > Thuis, storing | "Meld de storing bij je netbeheerder" | herschreven | "als bellen lukt"; storingsnummer ongewijzigd |
| Tijdens > Thuis, CO stap 5 | "Bel 112" | aangevuld met offline alternatief | "of laat iemand bellen", verwijzing naar het blok en de kaart CO-alarm |
| Tijdens > Thuis, CO stap 7 | "Antigifcentrum 070 245 245" | houden | met "als het netwerk werkt" |
| Tijdens > Buiten | "Bel het gasgeurnummer" | aangevuld met offline alternatief | korte vorm blok A; 112.be FAQ |
| Tijdens > Buiten, groter lek | "Wacht op de instructies van de overheid" | aangevuld met offline alternatief | instructies via radio en omroepwagens van de politie; BE-Alert en websites als het netwerk werkt; Crisiscentrum informatie tijdens een noodsituatie |
| Tijdens > Buiten, evacueren | "gsm en lader, je lijst met telefoonnummers" | houden | meeneemlijst; Crisiscentrum evacueren |
| Tijdens > Werk of school | "van buiten bellen" | houden | samenvatting van Thuis |
| Tijdens > Kwetsbare personen | "vul het contactformulier van Fluvius in" | aangevuld met offline alternatief | eerst buren of omstanders laten bellen, formulier als het internet werkt; 112.be FAQ |
| Niet doen | "Binnen niet bellen met de gsm" | houden | Fluvius |
| Meer informatie | Fluvius, ORES, Speelnietmetvuur, Antigifcentrum | houden | achtergrond, geen crisisstap |

#### scenarios/hitte.md

Samenvatting: Langsgaan bij ouderen en kwetsbaren gaat nu voor bellen; 112 bij hitteslag kreeg de korte vorm voor als bellen niet lukt. Contactlijst op papier en afspraken zonder telefoon toegevoegd aan de voorbereiding.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 5 | "Bezoek of bel elke dag ouderen ..." | herschreven | Langsgaan eerst, iemand anders laten langsgaan, dan bellen (Warme dagen: zorg voor elkaar) |
| stappen 7 | "Bel 112 bij bewustzijnsverlies ... en koel meteen af" | aangevuld met offline alternatief | Afkoelen eerst genoemd; korte vorm blok A; 112.be, FOD Economie |
| Herkennen > tabel | "Bel 112 bij bewustzijnsverlies" (zonneslag) | houden | Verwijzing naar de uitwerking onder Daarna, niet in elk punt herhaald |
| Voorbereiden > Je gezondheid | huisarts, KMI-website of app | houden | Voorbereiding; radio staat al eerst |
| Voorbereiden > Voor anderen | lijst van contactpersonen | aangevuld met offline alternatief | Op papier (Crisiscentrum plan bij je thuis); sleutel bezorgen (Warme dagen: zorg voor elkaar) |
| Voorbereiden > Water en stroom | afspraken om contact te houden | aangevuld met offline alternatief | "ook als telefoon of internet niet werkt" (Crisiscentrum plan in jouw buurt) |
| Tijdens > Kwetsbare personen > Ouderen | "Bezoek of bel ouderen regelmatig" | herschreven | "Ga extra langs, of bel regelmatig" (Warme dagen) |
| Tijdens > Kwetsbare personen > Ouderen | "Zorg dat ze een werkende telefoon hebben" | houden | Warme dagen |
| Tijdens > Kwetsbare personen > Ouderen | (nieuw) | aangevuld met offline alternatief | "Roep onmiddellijk hulp in" als een oudere zich niet goed voelt, 112 met korte vorm (Warme dagen) |
| Tijdens > Chronisch zieken | "langs te komen of te bellen" | houden | Langs staat al eerst |
| Tijdens > Huisdieren | "contacteer dan een dierenarts" | houden | Vlaanderen Huisdierinfo |
| Daarna > Hitteslag | "Bel 112 als de persoon het bewustzijn verliest" | aangevuld met offline alternatief | "of laat iemand bellen", korte vorm, verwijzing eerstehulpkaart |
| Daarna > Na de hittegolf | "Raadpleeg je huisarts" | houden | Na de crisis |
| Meer informatie | KMI, Warmedagen.be | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/kou.md

Samenvatting: Langsgaan bij buren en ouderen vervangt "kijk naar"; 112 bij onderkoeling en CO kreeg de korte vorm of blok B-aanpak, het Antigifcentrum en de KMI-app staan onder "werkt het netwerk". Samenkomen om warmte te delen en het onthaalpunt van de gemeente toegevoegd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 6 | "Kijk naar ouderen, alleenwonenden en daklozen. Bied warme drank aan." | herschreven | Langsgaan bij ouderen en alleenwonenden (Rode Kruis-Vlaanderen, Denk vooruit); warme drank voor daklozen (KMI legende koude) |
| stappen 7 | "Bel 112 bij vermoeden van onderkoeling" | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Voorbereiden > De auto | "opgeladen gsm met lader" | houden | Voorbereiding |
| Tijdens > Thuis > stroom valt uit | (nieuw punt 5) | aangevuld met offline alternatief | Samenkomen om licht en warmte te delen (Crisiscentrum noodpakket) |
| Tijdens > Thuis > stroom valt uit | opvangplaats van je gemeente | aangevuld met offline alternatief | Radio op batterijen, informatie- en onthaalpunt van de gemeente (FOD Economie) |
| Tijdens > Thuis > CO | "Bel 112. Zeg waar je bent ..." | aangevuld met offline alternatief | "of laat iemand bellen"; lukt bellen niet: iemand hulp laten halen, bij het slachtoffer blijven (blok B; ERC 2021 First aid), verwijzing Noodnummers |
| Tijdens > Thuis > CO | "Antigifcentrum bellen op 070 245 245" | naar "als het netwerk werkt" | Nummer ongewijzigd |
| Tijdens > Buiten | "Meld gladheid via de KMI-app" | naar "als het netwerk werkt" | Crisiscentrum koudegolf |
| Tijdens > Kwetsbare personen | "Ga na of buren hulp nodig hebben" | herschreven | "Ga bij buren langs" (Rode Kruis-Vlaanderen: kijk om naar buren) |
| Daarna > Onderkoeling | "Bel 112 bij vermoeden van ernstige onderkoeling" | aangevuld met offline alternatief | korte vorm, verwijzing eerstehulpkaart |
| Daarna > Bevriezing | "Zoek medische hulp" | houden | CDC |
| Meer informatie | KMI-app, winterdiensten | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/luchtalarm.md

Samenvatting: informatie eerst via radio (op batterijen of met slinger), sirenes en omroepwagens, BE-Alert als het netwerk werkt; "Bel niet" blijft als "Bel niet om informatie te vragen". Bij 112 na een explosie staat nu wat je doet als bellen niet lukt (blok A en B, kort); het gezinsplan bevat afspraken voor als telefoon en internet niet werken.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 6 | "Volg BE-Alert, radio en de officiële kanalen. Bel niet, stuur berichten." | herschreven | radio, sirenes, omroepwagens eerst; BE-Alert als het netwerk werkt; "Bel niet om informatie te vragen"; Crisiscentrum informatie tijdens een noodsituatie, MCF, Poolse overheid (sirenes) |
| Herkennen | "In België verwittigt de overheid je via BE-Alert ... Volg ook radio en tv." | herschreven | radio/tv en omroepwagens van de politie eerst, BE-Alert als het netwerk werkt; radio op batterijen of opwindbaar werkt bij stroompanne; Crisiscentrum informatie tijdens een noodsituatie, Crisiscentrum noodpakket |
| Herkennen | sirenesignalen Zweden en Polen | houden | buitenlands, benoemd |
| Voorbereiden | noodtas "gsm met lader of powerbank" | houden | meeneemlijst; MCF |
| Voorbereiden | "Maak een plan ... hoe je elkaar bereikt" | aangevuld met offline alternatief | ontmoetingsplaats als je elkaar niet bereikt; met buren afspreken zonder telefoon of internet; Crisiscentrum digitale infrastructuur, plan in jouw buurt |
| Tijdens > Thuis | "laat het aan je buren weten" | houden | al offline |
| Tijdens > Kwetsbare personen | "meld dat dan aan de hulpdiensten" | herschreven | "ter plaatse, of via 112 als bellen lukt" |
| Tijdens > Huisdieren | "verwittig de hulpdiensten welke dieren achterblijven" | houden | geen telefoon nodig |
| Tijdens > In de schuilplaats | "Bel niet. Gebruik sms om het net te ontlasten." | herschreven | "Bel niet om informatie te vragen. Werkt het netwerk, gebruik dan sms" |
| Tijdens > In de schuilplaats | "Volg de berichten op de radio." | houden | |
| Daarna | "Bel 112 bij nood." | aangevuld met offline alternatief | ander toestel of iemand anders laten bellen; omstander aanwijzen met waar/wat/hoeveel/toestand; slachtoffer niet alleen laten; verwijzing Noodnummers; 112.be FAQ, ERC 2021 First aid, IFRC 2020 |
| Daarna, munitie | "verwittig de hulpdiensten", "Meld de plek" | houden | ook ter plaatse mogelijk |
| Daarna, informatie | "Controleer informatie in meerdere officiële bronnen" | houden | |
| Niet doen | "Bel niet zonder noodzaak." | herschreven | "Bel niet om informatie te vragen." |
| Meer informatie | links BBK, MCF, dovidka, Poolse gids | naar voorbereiding | inleidende zin "Lees deze pagina's vooraf"; Samen voorbereid |

#### scenarios/nucleair.md

Samenvatting: zelfde lijn als chemisch: radio (op batterijen of met slinger), tv en omroepwagens van de politie eerst, BE-Alert, websites, sociale media en het informatienummer "als het netwerk werkt". "Bel niet om informatie te vragen" en 112 alleen bij een medisch noodgeval, met verwijzing naar Als bellen niet lukt. Sirenes zijn niet als Belgisch kanaal genoemd: geen actuele Belgische bron bevestigt ze.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "Je krijgt een BE-Alert of de overheid vraagt om te schuilen." | herschreven | "via radio, omroepwagens of BE-Alert"; nucleairrisico.be waarschuwen en beschermen |
| frontmatter stappen 6 | "Volg BE-Alert, radio, tv en crisiscentrum.be. Bel alleen bij een medisch noodgeval." | herschreven | radio en omroepwagens eerst, BE-Alert en crisiscentrum.be als het netwerk werkt, "Bel niet om informatie te vragen", 112 bij medisch noodgeval; nucleairrisico.be waarschuwen, Samen voorbereid |
| Herkennen | "via BE-Alert, radio en tv, sociale media, websites en een informatienummer. Ze kan ook wagens met luidsprekers inzetten." | herschreven | radio/tv en omroepwagens van de politie eerst, de rest als het netwerk werkt; zin over uitval internet en mobiele netwerken; nucleairrisico.be waarschuwen, Samen voorbereid |
| Voorbereiden | "Kijk op nucleairrisico.be" | naar voorbereiding | "Kijk vooraf" |
| Voorbereiden | "Schrijf je in op BE-Alert" | houden | voorbereiding |
| Voorbereiden | "Volg de officiële kanalen ... op sociale media" | houden | voorbereiding, met "werken alleen als het netwerk werkt" |
| Voorbereiden | "Maak een noodplan (crisiscentrum.be)" | aangevuld met offline alternatief | papieren lijst met contactpersonen, adressen, nummers; Crisiscentrum plan bij je thuis |
| Voorbereiden, jodium | "Bespreek met je huisarts", "vraag het aan je arts of apotheker" | houden | voorbereiding |
| Tijdens > Thuis stap 8 | "Volg de instructies via radio, tv, websites en sociale media." | herschreven | radio (batterijen of slinger), omroepwagens, daarna BE-Alert, websites, sociale media als het netwerk werkt |
| Tijdens > Thuis stap 9 | "Bel alleen bij een medisch noodgeval (112). ... Verwittig anderen met sms, WhatsApp of Signal." | herschreven | "Bel niet om informatie te vragen", verwijzing Als bellen niet lukt, berichten als het netwerk werkt; 112.be FAQ |
| Tijdens > Kwetsbare personen | "Bel 112 bij een medisch noodgeval." | aangevuld met offline alternatief | huisgenoot of buur laten bellen of hulp vragen; 112.be FAQ |
| Tijdens > Evacuatie | "gsm en lader" | houden | meeneemlijst; nucleairrisico.be evacuatie |
| Tijdens > Evacuatie | "Wie, waarheen en hoe wordt op het moment zelf meegedeeld." | aangevuld met offline alternatief | "onder meer via de radio en omroepwagens van de politie"; nucleairrisico.be waarschuwen |
| Daarna | "Volg de media en de officiële kanalen." | herschreven | radio eerst, officiële kanalen als het netwerk werkt; Crisiscentrum informatie tijdens een noodsituatie |
| Daarna | "Praat met iemand als je overstuur bent." | houden | geen hulplijn; past bij steun ter plaatse |
| Niet doen | "Bel niet zonder noodzaak." | herschreven | "Bel niet om informatie te vragen. Luister naar de radio." |
| Meer informatie | links nucleairrisico.be, crisiscentrum.be, fanc.be, telerad.be | naar voorbereiding | inleidende zin "Lees deze pagina's vooraf"; Samen voorbereid. fanc.be en telerad.be stonden al niet in de frontmatter `bronnen`; ongewijzigd gelaten |

#### scenarios/overstroming.md

Samenvatting: Stappen herschikt zodat de eerste vijf zonder netwerk kunnen; 112 kreeg blok A, 1722 en websites staan nu onder "werkt het netwerk", radio en omroepwagens komen voor BE-Alert. Voorbereiding kreeg radio, papieren lijst en afspraken zonder telefoon.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 1 | "Volg de instructies via BE-Alert, radio en de website van je gemeente. Bel 112..." | herschreven | Radio en omroepwagens eerst, BE-Alert en website als het netwerk werkt; 112 apart met korte vorm. Crisiscentrum informatie tijdens een noodsituatie, FOD Economie |
| stappen 2 | "Ga naar een hogere verdieping ... je telefoon en een lader" | houden, aangevuld | Naar positie 1; dak en teken voor hulp toegevoegd (Ready.gov floods: "signal for help"). Geen laken of andere signaalvorm: niet in de bron |
| stappen 5 en 6 | stromend water; kelders | herschreven | Samengevoegd tot één punt om ruimte te maken, inhoud ongewijzigd |
| stappen 7 | "Vraag niet-dringende hulp via 1722.be of 1722" | aangevuld met offline alternatief | Nu "werkt het netwerk" en "Hou 112 vrij". Crisiscentrum fluviale overstroming. Geen offline alternatief voor 1722 gevonden |
| stappen (nieuw) | 112 bij levensgevaar | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Herkennen > Waarschuwingen | "Waterinfo.be toont waterstanden ..." | herschreven | "Werkt het internet, dan toont ..." |
| Herkennen > Waarschuwingen | "BE-Alert, radio, tv, websites, sociale media en omroepwagens" | herschreven | Volgorde blok C; radio op batterijen of autoradio bij stroomuitval (FOD Economie) |
| Voorbereiden > Ken je risico | "Kijk met de watertoets op waterinfo.be" | houden | Voorbereiding |
| Voorbereiden > Ken je risico | afspraken met buren | aangevuld met offline alternatief | Hoe elkaar bereiken zonder telefoon (Crisiscentrum plan in jouw buurt); ontmoetingsplaats met familie (Crisiscentrum digitale infrastructuur) |
| Voorbereiden > In huis | (nieuw) | aangevuld met offline alternatief | Radio op batterijen of opwindradio, DAB+ en FM, papieren lijst (Crisiscentrum Samen voorbereid) |
| Tijdens > Thuis | "Iemand in levensgevaar: bel 112." | aangevuld met offline alternatief | "of laat iemand bellen" plus volledig blok A onder de lijst; 112.be, FOD Economie, BBK, Inspecties 2019 |
| Tijdens > Thuis | 1722.be, formulier, 1722 | naar "als het netwerk werkt" | Crisiscentrum fluviale overstroming, 1722.be |
| Tijdens > Thuis > Stijgt het water | "Ga alleen het dak op ... geef een teken voor hulp" | houden | Bron benoemd: Ready.gov floods |
| Tijdens > Thuis > Evacueren | "Volg de raad van de hulpdiensten" | aangevuld met offline alternatief | Radio en omroepwagens; anderen helpen verwittigen (Crisiscentrum evacueren, informatie tijdens een noodsituatie) |
| Tijdens > Thuis > Evacueren | "gsm en lader, lijst met telefoonnummers" | houden | Meenemen, geen handeling via netwerk |
| Tijdens > Thuis > Evacueren | opvangcentrum | aangevuld | Sporthal of feestzaal, contactpersoon ter plaatse (Crisiscentrum evacueren) |
| Tijdens > Thuis > Evacueren | "Stuur liever een sms of bericht" | naar "als het netwerk werkt" | Crisiscentrum evacueren |
| Tijdens > Kwetsbare personen | contact met arts, apotheker, gemeente of OCMW | houden | Kan ook in persoon; Vivalis |
| Daarna > Gezondheid | huisarts, 1733 | houden | Na de crisis |
| Meer informatie | Waterinfo, hydrometrie, KMI-app, 1722.be | houden | Inleiding "Vooraf te lezen, of als het internet werkt" toegevoegd |

#### scenarios/pandemie.md

Samenvatting: De huisarts bellen blijft. 112 bij alarmsignalen kreeg overal de korte vorm voor als bellen niet lukt, en voor dringende gevallen als je de huisarts niet bereikt staat een verwijzing naar Noodnummers. Informatie loopt via radio en tv voor websites; nummers van huisarts en wachtdienst op papier.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 5 | "Bel je huisarts ... Ga niet onaangekondigd langs." | houden, aangevuld | "tenzij het een noodgeval is" (zoals Niet doen); pandemie gaat niet per se met netuitval samen |
| stappen 7 | "Bel 112 bij ademnood of pijn op de borst." | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Herkennen > Alarmsignalen | "Bel 112." | aangevuld met offline alternatief | korte vorm blok A |
| Herkennen > Hoe je hoort | "Volg de officiële kanalen" | aangevuld | Radio en tv eerst, BE-Alert en websites als het netwerk werkt (Crisiscentrum informatie tijdens een noodsituatie); Departement Zorg "op zijn website" |
| Voorbereiden > Een plan | (nieuw) | naar voorbereiding | Nummer huisarts en wachtdienst op papieren lijst (Crisiscentrum plan bij je thuis) |
| Voorbereiden > Een plan | "beveiligde digitale kopie", raadplegingen op afstand | houden | Ready.gov |
| Tijdens > Ben je ziek | "Raadpleeg je huisarts. Bel eerst." en 1733 | houden | Crisiscentrum, Stad Gent |
| Tijdens > Ben je ziek | (nieuw) | aangevuld met offline alternatief | "Lukt bellen niet en is het dringend": verwijzing Noodnummers. Geen bron gevonden die zegt dat je dan onaangekondigd naar de huisarts gaat; niet geschreven |
| Tijdens > In de auto | "Bel 112 ... Blijf waar je bent" | aangevuld met offline alternatief | korte vorm blok A |
| Tijdens > Huisdieren | FAVV-influenzalijn 0800 99 777 | naar "als het netwerk werkt" | "Werkt de telefoon"; nummer ongewijzigd; vogelopvangcentrum blijft |
| Daarna | "Hou contact, ook op afstand, praat met iemand" | houden | Ready.gov; geen hulplijnen in dit bestand |
| Niet doen | "Bel eerst, tenzij het een noodgeval is." | houden | Crisiscentrum |
| Meer informatie | Crisiscentrum, Departement Zorg, FOD BuZa, natuurenbos | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/storm.md

Samenvatting: 112 kreeg blok A, 1722.be en de KMI-app staan nu onder "werkt het netwerk", de radio op batterijen komt bij binnen blijven. De stap met 1722 schoof naar achter en bevat nu 112 met de korte vorm.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| stappen 2 | "Blijf binnen ..." | aangevuld met offline alternatief | Weerbericht op de radio, op batterijen bij stroomuitval; Crisiscentrum wind en storm ("Luister naar het weerbericht"), noodpakket |
| stappen 5 | "Vraag niet-dringende hulp via 1722.be ... Bel 112 alleen bij levensgevaar." | herschreven | Naar positie 6; 112 eerst met korte vorm blok A; 1722 als het netwerk werkt. Crisiscentrum wind en storm, 112.be, FOD Economie |
| stappen 7 | foto's, verzekeraar | houden | Na de storm |
| niet | "Niet 112 bellen voor gewone stormschade." | houden | Crisiscentrum wind en storm |
| Voorbereiden | "Volg de weersverwachting via radio, tv, website of app van het KMI" | houden | Voorbereiding, radio staat al eerst |
| Voorbereiden | "Neem je gsm en een lader mee" | houden | Voorbereiding |
| Tijdens > Thuis | "Luister naar het weerbericht" | aangevuld met offline alternatief | Radio op batterijen of autoradio (FOD Economie) |
| Tijdens > Thuis > tabel | "Bel 112." | aangevuld met offline alternatief | "of laat iemand bellen"; volledig blok A onder de tabel. 112.be, FOD Economie, BBK, Inspecties 2019 |
| Tijdens > Thuis > tabel | 1722.be, formulier, 1722 | naar "als het netwerk werkt" | Crisiscentrum wind en storm, 1722.be |
| Tijdens > Thuis | "Het loket 1722.be is altijd beschikbaar." | herschreven | Bron bedoelt: ook buiten een storm. Toegevoegd dat je er internet voor nodig hebt |
| Tijdens > Thuis | "Meld schade via de app van het KMI" | naar "als het netwerk werkt" | Crisiscentrum wind en storm |
| Tijdens > Buiten | "opgeladen gsm meenemen, laat iemand weten waar je naartoe gaat" | houden | Laten weten kan vooraf in persoon |
| Tijdens > Kwetsbare personen | afspraken met buren | aangevuld met offline alternatief | Hoe elkaar bereiken zonder telefoon of internet (Crisiscentrum plan in jouw buurt) |
| Daarna > Schade | 1722.be, formulier, 1722 | naar "als het netwerk werkt" | Crisiscentrum wind en storm |
| Daarna > Schade | verzekeraar contacteren | houden | Na de crisis |
| Meer informatie | KMI-app, 1722.be | houden | Inleiding "Vooraf te lezen, of als het internet werkt" |

#### scenarios/stroomuitval.md

Samenvatting: Bellen en surfen gelden nu uitdrukkelijk "als het net nog werkt". 112 staat in `niet` en in Tijdens met wat je doet als bellen niet lukt (korte vorm van blok A). In Herkennen staan de cijfers van FOD Economie over gsm-masten en de vaste lijn. Voorbereiden kreeg de vraag aan de gemeente over een informatie- en onthaalpunt. Langsgaan bij buren en samenkomen om licht en warmte te delen staan erbij als stappen zonder netwerk.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 5 | "Volg het nieuws via een radio ... Bel en surf alleen als het nodig is, sms" | herschreven | radio eerst, daarna "werkt het net nog"; OFF/ON, FOD Economie |
| frontmatter stappen 7 | "Ga na of buren ... hulp nodig hebben." | herschreven | "Ga langs bij ..."; OFF/ON, Rode Kruis-Vlaanderen |
| frontmatter stappen 1-4, 6 | woning of net, toestellen, koelkast, zaklamp, CO | houden | geen netwerk nodig |
| frontmatter niet | "Niet 112 bellen om te vragen wanneer ... Bel 112 alleen bij gevaar" | aangevuld met offline alternatief | korte vorm van blok A met een verwijzing naar Noodnummers |
| Herkennen > net of woning | "Meld die bij je netbeheerder." | herschreven | "als telefoon of internet nog werkt" |
| Herkennen > wat valt uit | "Het gsm-net heeft maar gedeeltelijk en kort noodstroom" | herschreven | preciezer: gsm-masten 1 tot 2 uur, mobiel internet valt meteen weg, vaste lijn werkt waarschijnlijk niet; FOD Economie |
| Voorbereiden > afschakelplan opzoeken | "De betrouwbaarste weg is de website van je netbeheerder" | houden | voorbereiding |
| Voorbereiden > BE-Alert | "Schrijf je in op BE-Alert." | houden | erbij: "zolang het gsm-net of internet werkt" |
| Voorbereiden (nieuw) | - | aangevuld met offline alternatief | vraag het gemeentebestuur naar oplossingen, bv. een informatie- en onthaalpunt; FOD Economie |
| Voorbereiden > lange uitval | "Laad je gsm ... Verwittig naasten en buren." | houden | erbij: afspreken hoe je elkaar zonder telefoon bereikt; Crisiscentrum buurt |
| Voorbereiden > noodpakket | papieren lijst met telefoonnummers, radio | houden | |
| Tijdens > Thuis > Warm blijven | - | aangevuld met offline alternatief | samenkomen om licht en warmte te delen; Crisiscentrum noodpakket |
| Tijdens > Thuis > Telefoon en informatie | "Bel alleen als het echt nodig is en stuur liever een sms." | herschreven | "Werkt het gsm-net nog, ..." |
| Tijdens > Thuis > Telefoon en informatie | "Bel 112 alleen als iemand in gevaar is." | aangevuld met offline alternatief | korte vorm van blok A: ander toestel, buren, hulp in je buurt, radio, informatie- en onthaalpunt, Noodnummers; 112.be FAQ, FOD Economie |
| Tijdens > Kwetsbare personen | "Neem contact op met de leverancier ...", "Vraag je arts ...", diensten aan huis | naar voorbereiding | nu uitdrukkelijk "vooraf"; personenalarm kan uitvallen (BBK) |
| Tijdens > Kwetsbare personen | "Vraag zo snel mogelijk een nieuwe voorraad aan je arts of apotheker." | houden | kan ook ter plaatse; CDC |
| Tijdens > Kwetsbare personen > Buren | "Ga na of buren hulp nodig hebben. ... powerbank lenen" | aangevuld met offline alternatief | "lukt bellen niet, ga dan langs"; Rode Kruis-Vlaanderen, OFF/ON |
| Tijdens > In de auto | autoradio | houden | |
| Daarna | "Bel en surf nog niet meteen massaal." | houden | |
| Niet doen | "Niet 112 bellen voor informatie ..." | houden | |
| Niet doen (nieuw) | - | aangevuld met offline alternatief | "netwerk niet beschikbaar, alleen noodnummer" is geen reden om 112 te bellen; 112.be FAQ |
| Meer informatie | Crisiscentrum, FOD Economie, netbeheerder, BE-Alert | houden | erbij: "vooraf, of als het internet werkt" |

#### scenarios/telecom.md

Samenvatting: De `stappen` beginnen nu met wat zonder netwerk werkt: radio, ontmoetingspunt en langsgaan bij buren. 112 staat erbij met wat je doet als bellen niet lukt. "Hulp vragen bij levensgevaar" kreeg blok A. De vraag aan de gemeente staat nu in Voorbereiden, met FOD Economie en BBK als bron. De cijfers van FOD Economie (gsm-masten 1 tot 2 uur, vaste lijn, 100 en 101 niet gegarandeerd) maken Herkennen preciezer.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter stappen 1 | "Bel 112 bij levensgevaar. Hou het net verder vrij ..." | herschreven | naar punt 4, met de korte vorm van blok A; 112.be, FOD Economie |
| frontmatter stappen 2 | "Stuur een sms of een kort bericht in plaats van te bellen." | herschreven | punt 5, "werkt het net nog"; OFF/ON, Crisiscentrum |
| frontmatter stappen 3 | "Luister naar de radio op batterijen ..." | houden | nu punt 1 |
| frontmatter stappen 4 | "ga naar het ontmoetingspunt" | houden | nu punt 2 |
| frontmatter stappen (nieuw) | - | aangevuld met offline alternatief | "Kijk om naar buren en familie ... ga bij hen langs"; Rode Kruis-Vlaanderen, OFF/ON, Crisiscentrum buurt |
| frontmatter stappen 6 | "Hou je gsm en een powerbank opgeladen." | herschreven | uit de stappen gehaald (max. 7), blijft in Tijdens > Batterij |
| frontmatter stappen 5, 7 | contactpersoon; wachten na herstel | houden | |
| frontmatter niet | - | aangevuld met offline alternatief | "niet 112 bellen omdat de gsm 'netwerk niet beschikbaar, alleen noodnummer' toont"; 112.be FAQ |
| Herkennen > Uitval door stroompanne | "Het gsm-net heeft maar gedeeltelijk en voor korte tijd noodstroom ..." | herschreven | preciezer: gsm-masten 1 tot 2 uur, mobiel internet valt meteen weg, vaste lijn werkt waarschijnlijk niet, kiestoon, 112 via elke operator, 100 en 101 niet gegarandeerd; FOD Economie |
| Herkennen | "Een vaste lijn die via internet loopt ..." | houden | BBK |
| Voorbereiden > Afspraken | ontmoetingspunt, papieren lijst | houden | aangevuld met afspraken met buren zonder telefoon; Crisiscentrum buurt |
| Voorbereiden (nieuw blok) | Tijdens: "Vraag op voorhand aan je gemeente waar je ... een noodoproep kunt doen." | naar voorbereiding | Belgisch: vraag het gemeentebestuur naar oplossingen, bv. informatie- en onthaalpunt (FOD Economie); Duits: BBK Stromausfall 2026; Luxemburg: dichtstbijzijnde brandweerpost, commissariaat en ziekenhuis vooraf kennen (LetzPrepare), plus de kaart in de app (Dichtstbij) |
| Voorbereiden > BE-Alert | "Schrijf je in op BE-Alert. Je krijgt een sms ..." | aangevuld met offline alternatief | erbij: komt alleen door zolang gsm-net of internet werkt; Samen voorbereid |
| Voorbereiden > kanalen | "Abonneer je op de kanalen van je gemeente ..." | houden | erbij: alleen zolang er internet is |
| Voorbereiden > app 112 BE | "Installeer de app 112 BE ..." | houden | erbij: werkt alleen met netwerk |
| Voorbereiden > sms voor doven | aparte nummers van vier cijfers | houden | voorbereiding |
| Tijdens > Thuis > Hulp vragen, punt 1 | "Bel 112 ... of 101 ..." | houden | aangevuld: zonder abonnement, wel simkaart (Vlaanderen.be) |
| Tijdens > Thuis > Hulp vragen, punt 2 | "Gebruik de app 112 BE." | herschreven | "Werkt het netwerk, dan ..." |
| Tijdens > Thuis > Hulp vragen, punt 3 | "alternatieve nummers" | aangevuld met offline alternatief | in blok A: tijdelijke provinciale nummers, meestal niet actief; 112.be FAQ |
| Tijdens > Thuis > Hulp vragen, punt 4 | "Vraag op voorhand aan je gemeente ..." | naar voorbereiding | zie Voorbereiden |
| Tijdens > Thuis > Lukt bellen niet (nieuw) | - | aangevuld met offline alternatief | blok A: ander toestel, buren, verplaatsen, 101, hulp in je buurt, informatie- en onthaalpunt, buitenlands advies (BBK, NL-inspectierapport 2019), de kaart in de app; ook: bellen vanop een andere plek mag (112.be, hoe bel ik) |
| Tijdens > Thuis > Informatie volgen | "BE-Alert, radio, tv en online media, de websites ..., omroepwagens" | herschreven | eerst radio, omroepwagens, informatieborden, folders, deur-aan-deur, buren met een radio; daarna "werkt het netwerk": BE-Alert, websites, sociale media (blok C); Crisiscentrum, Samen voorbereid, Denk vooruit informatieboekje, Verspreid de juiste informatie |
| Tijdens > Thuis > Buren en familie (nieuw) | - | aangevuld met offline alternatief | kijk om naar buren, ga langs; ontmoetingspunt; Rode Kruis-Vlaanderen, Crisiscentrum |
| Tijdens > Thuis > Het net vrijhouden | "sms of WhatsApp" | herschreven | merknaam weg: "berichtenapps" (schrijfwijzer § 1) |
| Tijdens > Thuis > Het net vrijhouden | "Bel de noodnummers niet om te vragen ..." | houden | |
| Tijdens > Thuis > Batterij | gsm en powerbank opgeladen | houden | |
| Tijdens > Buiten of onderweg | "laat zodra het kan je familie ... weten" | houden | "zodra het kan" dekt al uitval |
| Tijdens > Kwetsbare personen | "Vraag je zorgdienst ..." | houden | nu uitdrukkelijk "vooraf" |
| Tijdens > Kwetsbare personen | app 112 BE voor doven | houden | erbij: werkt alleen met netwerk |
| Daarna | "Laat je contactpersoon ... weten" | houden | erbij: bij kwetsbare naasten en buren langsgaan (OFF/ON) |
| Niet doen | "Niet 112, 101 ... bellen om informatie" | houden | |
| Niet doen (nieuw) | - | aangevuld met offline alternatief | "netwerk niet beschikbaar, alleen noodnummer" is geen reden om 112 te bellen; 112.be FAQ |
| Meer informatie | 112.be, BE-Alert, Crisiscentrum, BIPT | houden | erbij: "vooraf, of als het internet werkt", plus FOD Economie |

### Gidsen

#### gidsen/buiten-overleven.md

Samenvatting: Nieuw blok "Hulp halen" in Wat eerst komt: bellen als je bereik hebt, anders mensen aanspreken, twee of meer mensen sturen, zelf hulp zoeken of blijven en signalen geven. Elke "bel 112" kreeg een korte verwijzing daarnaar; Antigifcentrum "als het netwerk werkt"; natuurbrand volgt nu de volgorde van het Crisiscentrum.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat eerst komt | "Bel om hulp als je kunt. Zie de gids over de noodoproep." | herschreven | genummerd blok Hulp halen; NPS Outdoor Emergency Plan (help kan uren of dagen duren, "no cellphone reception", flag down someone, send two or more people, alone: stabilize then look for help, signal); Crisiscentrum Natuurbrand ("spreek mensen aan") |
| Onderkoeling herkennen | "Bel 112 als ..." | aangevuld met offline alternatief | korte vorm: twee of meer mensen hulp laten halen, bij de persoon blijven; NPS toegevoegd aan bronregel |
| Vuur > Wallonië en Brussel | "verwijst naar de website ... voor de actuele kleurcode" | naar voorbereiding | vooraf informeren; ter plaatse de regels aan de rand van het gebied volgen; Crisiscentrum Natuurbrand |
| Vuur > Als je een natuurbrand ziet | "bel 112. Volg bestaande paden ..." | herschreven | eerst in veiligheid, anderen helpen, dan zo snel mogelijk 112 met herkenbare punten; geen bereik: evacueren en mensen aanspreken; Crisiscentrum Natuurbrand |
| Voedsel > Heeft iemand iets gegeten | "Bel het Antigifcentrum (070 245 245) of de huisarts." | aangevuld met offline alternatief | "neem contact op met het Antigifcentrum (als het netwerk werkt) of de huisarts"; resten uit de mond en plant bewaren staan al ervoor; Antigifcentrum Vergiftiging door planten |
| Voedsel > Heeft iemand iets gegeten | "Bij ernstige klachten: bel 112." | aangevuld met offline alternatief | verwijzing naar Hulp halen |
| Gevonden worden | signalen | houden | toegevoegd: spiegel heeft geen batterij nodig (NPS "mirrors don't run out of battery") |
| Hitte buiten | "Bel 112 bij ..." | aangevuld met offline alternatief | hulp laten halen, intussen afkoelen; NPS, Rode Kruis-Vlaanderen |
| Per persoon > Groepen | "twee of meer mensen gaan hulp halen" | houden | al correct; NPS |

#### gidsen/communicatie-en-alarmering.md

Samenvatting: De gids zet nu eerst de kanalen die zonder netwerk werken: radio, omroepwagens, deur-aan-deur, informatieborden, sirenes, onthaalpunt en buren. Daarna volgen BE-Alert, websites, sociale media en 1771, onder "als het netwerk werkt". De volgorde van de secties is daarop aangepast. "Bellen of berichten sturen" kreeg de cijfers van FOD Economie en een blok "Als bellen niet lukt", met het Belgische advies vóór het buitenlandse.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "(BE-Alert, sirenes, radio, 1771)" | herschreven | eerst radio, omroepwagens, deur-aan-deur, dan sirenes, BE-Alert, 1771 |
| Inleiding | "eerst hoe de overheid je bereikt, dan ... zonder stroom" | herschreven | kondigt de nieuwe volgorde aan (eerst zonder netwerk); Crisiscentrum, Samen voorbereid |
| De officiële kanalen > tabel | BE-Alert, media, websites, sociale media, omroepwagens, 1771, borden | herschreven | twee tabellen. "Zonder gsm-net of internet": radio, omroepwagens, borden, folders en deur-aan-deur, sirenes en luidsprekers (Vlaanderen.be), onthaalcentrum of informatie- en onthaalpunt (Crisiscentrum evacueren, FOD Economie), buren (Crisiscentrum buurt, Verspreid de juiste informatie). "Als het netwerk werkt": BE-Alert, tv en online media, websites, sociale media, 1771 (blok C) |
| De officiële kanalen (nieuw) | - | aangevuld met offline alternatief | "werkt bellen niet meer: overheidsinformatie of hulp in je buurt"; FOD Economie |
| De officiële kanalen > kanalen vooraf vinden | gemeente-website, brandweer.be, politie.be | houden | voorbereiding |
| De officiële kanalen > abonneren | "Abonneer je op voorhand ..." | houden | erbij: vraag het gemeentebestuur naar een informatie- en onthaalpunt; FOD Economie |
| Sectievolgorde | BE-Alert, Sirenes en 1771 vóór Radio | herschreven | Radio en de drie frequentiesecties nu direct na de kanalen, daarna Sirenes, BE-Alert, 1771 |
| Radio | radio op batterijen, autoradio | houden | aangevuld met FOD Economie (media volgen via radio of autoradio), Crisiscentrum noodpakket, en buren met een radio (Crisiscentrum buurt, Denk vooruit) |
| Sirenes | "Vertrouw daarom op BE-Alert, radio en de officiële websites." | herschreven | radio eerst; "werkt het netwerk, kijk dan ook naar BE-Alert en de websites" |
| BE-Alert | sms, e-mail, gesproken oproep | aangevuld met offline alternatief | erbij: werkt via gsm-net en internet, luister anders naar de radio; Samen voorbereid |
| BE-Alert > inschrijven | "op be-alert.be of via je gemeente als je geen internet hebt" | houden | voorbereiding |
| BE-Alert > nummers opslaan | 1789, 0477 77 77 55 | houden | voorbereiding |
| 1771 | kop "Het informatienummer 1771" | herschreven | kop "(als het netwerk werkt)"; erbij: helpt alleen zolang bellen lukt, anders radio en hulp in je buurt; FOD Economie |
| 1771 | "Voor levensbedreigende situaties bel je 112." | aangevuld met offline alternatief | verwijzing naar Noodnummers, Als bellen niet lukt |
| Bellen of berichten | "Telefoneer niet onnodig. Gebruik berichtenapps ..." enz. | houden | nu onder "Zolang het net werkt" |
| Bellen of berichten > netwerk | BBK: internettelefonie, kort noodstroom | aangevuld met offline alternatief | preciezer: gsm-masten 1 tot 2 uur, mobiel internet, vaste lijn, 100 en 101 niet gegarandeerd; FOD Economie |
| Bellen of berichten > BBK | "Werken 112 ... niet meer, ga ... naar het politiekantoor of ziekenhuis." | herschreven | nu als Duits advies benoemd, na het Belgische (112.be FAQ: ander toestel, buren, verplaatsen; FOD: hulp in je buurt); NL 2019 erbij (inspectierapport); de kaart in de app (Dichtstbij); ontmoetingsplaats (Crisiscentrum digitale infrastructuur) |
| Valse berichten | "Zoek de foto op in een zoekmachine." | herschreven | "Werkt het internet, ..." |
| Valse berichten > wat je doet | "Verwittig mensen in je omgeving die geïsoleerd zijn" | houden | vooraan gezet (werkt zonder netwerk) |
| Contact zonder telefoon | afspraken met buren, ontmoetingsplek | houden | aangevuld met afspraak met familie en papieren lijst met contacten; Crisiscentrum digitale infrastructuur, plan bij je thuis |
| Walkietalkies, B-EARS, Meshtastic | - | houden | geen gsm-net nodig; ongewijzigd |
| Per persoon | "download eventueel een vertaalapp" | naar voorbereiding | "download vooraf" |
| Per persoon | BE-Alert sms en spraak | houden | voorbereiding |
| Checklist | website en sociale media gevonden | houden | voorbereiding |
| Checklist (nieuw) | - | aangevuld met offline alternatief | ontmoetingspunt afgesproken; bij de gemeente nagevraagd waar je terechtkunt (informatie- en onthaalpunt); Crisiscentrum, FOD Economie |

#### gidsen/dieren.md

Samenvatting: Kleine aanpassingen. De gids gaat vooral over voorbereiding. Dierenarts bellen staat nu als "als het netwerk werkt", het adres van de dierenarts komt op de papieren lijst, en de kaart in de app (knop Dichtstbij) toont dierenartsen. Bij een dier dat achterblijft wordt de sticker op raam of deur genoemd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Het plan > Identificatie | "online registratie (CatID, DogID)" | houden | voorbereiding |
| Het plan > Contactpersonen | "telefoonnummer van je dierenarts bij je belangrijke nummers" | houden | toegevoegd: bellen lukt alleen als het netwerk werkt (Crisiscentrum Een plan voor dieren) |
| Het plan > Op papier | nummers, adressen en routes printen | aangevuld met offline alternatief | adres van de dierenarts noteren (Diereninrampen.nl: adressen printen); kaart in de app toont dierenartsen (laag Dierenartsen, pipeline/lagen.py) |
| De tas om mee te nemen | "contactgegevens van je dierenarts" | houden | Crisiscentrum |
| De tas > Ready.gov | "kopieën ... in een waterdichte container en digitaal" | houden | voorbereiding |
| Evacueren > Kan of mag je dier niet mee | "Laat de hulpdiensten weten ..." | aangevuld met offline alternatief | sticker op raam of voordeur (Diereninrampen.nl); bronregel had die bron al |
| Paarden en vee > dierenarts op de bestemming | | houden | voorbereiding (Ready.gov) |
| Checklist | "Dierenarts bij de belangrijke nummers" | herschreven | "met adres, op papier"; Diereninrampen.nl aan bronregel toegevoegd |

Geen hulplijnen of acute belstappen in deze gids. Geen bron gevonden voor wat je doet met een ziek of gewond dier als je de dierenarts niet kunt bellen; daarover is niets toegevoegd.

#### gidsen/evacuatie.md

Samenvatting: Informatiekanalen herschikt (radio, omroepwagens, deur aan deur eerst; BE-Alert, websites en sms als het netwerk werkt), ontmoetingsplek, papieren lijst en kaart toegevoegd, het onthaal van de gemeente uitgelegd met verwijzing naar de kaart in de app, en familie verwittigen gesplitst in "zonder netwerk" en "als het netwerk werkt".

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wanneer je evacueert > Hoe je het hoort | "BE-Alert, radio, tv, websites ... sms" | herschreven | radio op batterijen of autoradio, omroepwagens, deur aan deur en folders eerst; BE-Alert, tv, websites, sociale media en sms "werkt het netwerk"; Crisiscentrum Informatie tijdens een noodsituatie, brochure Samen voorbereid, FOD Economie, Ready.gov Evacuation ("Listen to a battery-powered radio") |
| Vooraf voorbereiden | (geen) | aangevuld met offline alternatief | ontmoetingsplek als je elkaar niet bereikt (Crisiscentrum Verstoring digitale infrastructuur; Ready.gov "meeting place"); contactpersonen op papier (Crisiscentrum Een plan bij je thuis) |
| Wat je meeneemt | "Gsm en oplader" | houden | staat letterlijk in de lijst van het Crisiscentrum |
| Wat je meeneemt | "Een lijst met belangrijke telefoonnummers" | herschreven | "op papier"; Crisiscentrum plan bij je thuis, brochure |
| Wat je meeneemt | (geen) | aangevuld met offline alternatief | radio op batterijen (Crisiscentrum noodpakket), kaarten van je streek (Ready.gov Build A Kit "Local maps"), papieren kaart van dorp of stad bij het noodpakket (Denk vooruit, als Nederlands benoemd) |
| Het huis achterlaten > Een briefje | Ready.gov briefje | houden | Ready.gov Evacuation "Leave a note telling others when you left and where you are going"; korte uitleg toegevoegd |
| Waarheen | "via de officiële communicatiekanalen" | aangevuld met offline alternatief | zonder netwerk: radio, omroepwagens, hulpdiensten ter plaatse; nieuwe alinea over onthaal- en huisvestingscentra in het ANIP (Crisiscentrum Noodplannen) en het informatie- en onthaalpunt (FOD Economie); kaart in de app toont gemeentehuizen |
| Hoe je je verplaatst > auto | "Tank vol voor je vertrekt" | aangevuld met offline alternatief | tankstations kunnen bij stroomuitval niet pompen; aanbevolen routes, geen binnenwegen; Ready.gov Evacuation |
| Familie verwittigen | "contacteer je gezin", "sms of berichtenapps" | herschreven | eerst zonder netwerk (ontmoetingsplek, briefje, contactpersoon in het onthaalcentrum), dan "als het netwerk werkt" met de bestaande punten; Crisiscentrum Evacueren en Digitale infrastructuur, Ready.gov |
| Familie verwittigen | "Verwittig anderen ... via tekstbericht" | herschreven | verplaatst naar Samen evacueren (dubbel) |
| Als je iemand kwijt bent | Restoring Family Links via formulier, mail, telefoon | houden | toegevoegd "dus als het netwerk werkt"; lokaal Rode Kruis contacteren blijft |
| Ouderen en beperking | (geen) | aangevuld met offline alternatief | "Denk aan alternatieven om met anderen te communiceren, ook als je geen telefoon of internet hebt" (Crisiscentrum Een plan voor wie extra hulp nodig heeft) |
| Ouderen en beperking | "Laat iemand je adres registreren in BE-Alert" | houden | voorbereiding |
| In de opvang | 1771 informatienummer | houden | contactpersoon ter plaatse staat al eerst; toegevoegd dat het een telefoonnummer is dat alleen werkt als het netwerk werkt |
| Hoe lang en terugkeren | "via de website van de gemeente, de radio of het informatienummer" | herschreven | radio eerst; website en informatienummer "werkt het netwerk"; Crisiscentrum Evacueren |
| Hoe lang en terugkeren | "Laad je toestellen op" | houden | Ready.gov, na de crisis |
| Samen evacueren | "Help anderen verwittigen, liefst via tekstbericht" | herschreven | verwittigen blijft de handeling; tekstbericht "werkt het netwerk"; minder mobiele buren (Crisiscentrum Evacueren) |
| Checklist vertrek | "gsm en oplader, ... telefoonlijst"; "liefst per sms" | herschreven | telefoonlijst op papier, radio en kaart, ontmoetingsplek; sms "als het netwerk werkt" |

Niet toegevoegd: geen bron gevonden die zegt dat je buren zonder netwerk aan de deur moet verwittigen; de tekst zegt alleen "help anderen verwittigen" zoals het Crisiscentrum.

#### gidsen/gevaren-in-de-natuur.md

Samenvatting: In Overzicht een blok "Lukt bellen niet" voor de natuur (ander toestel, mensen aanspreken, twee of meer sturen, slachtoffer niet alleen laten). Elke "bel 112" werd "bel 112 of laat iemand bellen" met een verwijzing naar dat blok; het Antigifcentrum staat er nu als "als het netwerk werkt", met huisarts en bewaren van de plant als gelijkwaardige stappen.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Overzicht > tabel | "Resten uit de mond, Antigifcentrum bellen" | herschreven | "plant of resten bewaren, Antigifcentrum of huisarts contacteren"; Antigifcentrum Vergiftiging door planten |
| Overzicht | "Antigifcentrum: 070 245 245, gratis, 24 uur op 24" | houden | toegevoegd: als het netwerk werkt, vooraf op papier noteren (brochure Samen voorbereid) |
| Overzicht | (geen) | aangevuld met offline alternatief | blok Lukt bellen niet: 112.be (ander toestel, omstanders, verplaatsen), NPS (flag down, twee of meer sturen, alleen: eerst helpen), Crisiscentrum Natuurbrand (mensen aanspreken), ERC 2021 First aid (slachtoffer alleen laten als het moet); verwijzing naar Noodnummers, Als bellen niet lukt |
| De adder | "Bel 112." | aangevuld met offline alternatief | korte vorm met verwijzing |
| Wespen | "hoef je het Antigifcentrum niet te bellen" | herschreven | "contacteren" |
| Wespen | "Bel onmiddellijk 112 bij een ernstige allergische reactie" | aangevuld met offline alternatief | "of laat iemand bellen", verwijzing onder de lijst |
| Wespen | adrenalinepen "en bel 112" | aangevuld met offline alternatief | "of laat hulp halen" |
| Wespen > steek in mond of keel | "bel 112" | houden | blok in Overzicht geldt |
| Eikenprocessierups | "Ernstige klachten: bel 112" | aangevuld met offline alternatief | "of laat hulp halen" |
| Eikenprocessierups | "Verwittig de gemeente" | houden | gewone dag, geen acute stap |
| Giftige planten | "Bel het Antigifcentrum of de huisarts" | aangevuld met offline alternatief | "neem contact op ... (als het netwerk werkt) of de huisarts"; tak naar tuincentrum of plantenkenner staat al in de bron |
| Giftige paddenstoelen | "Bel het Antigifcentrum en hou deze informatie klaar" | herschreven | "Contacteer ... als het netwerk werkt"; huisarts niet toegevoegd omdat de paddenstoelenpagina die niet noemt |
| Kwallen | "Bel 112 bij algemene reacties" | aangevuld met offline alternatief | "of laat iemand bellen"; strandhulppost staat al in de stappen |
| Onweer > Iemand is getroffen | "Bel 112." | aangevuld met offline alternatief | korte vorm met verwijzing |
| Hitte en kou | "Bel 112 bij ..." (twee keer) | aangevuld met offline alternatief | "of laat hulp halen" |
| Water en stroming | "4. Bel 112." | aangevuld met offline alternatief | korte vorm met verwijzing |
| De wolf | "Meld de waarneming via wolf@inbo.be" | houden | "later, als het internet werkt" toegevoegd |
| Teken | TekenNet, wekelijkse herinnering | houden | geen acute stap |
| Per persoon > allergie | "Bel 112 bij een reactie" | aangevuld met offline alternatief | "of laat hulp halen" |
| Per persoon > ouderen, medicatie | "vraag je huisarts / arts of apotheker" | houden | voorbereiding |

#### gidsen/gezinsnoodplan.md

Samenvatting: De afspraken zonder telefoon (ontmoetingspunt, briefje achterlaten, contactpersoon buiten de streek) staan nu vooraan, direct na de inleiding. De nummerlijst is nu uitdrukkelijk voorbereiding (vooraf op papier). Tele-Onthaal 106 is uit de noodnummers gehaald en staat in een eigen sectie "Na de crisis, als de telefoon weer werkt". Onder de noodnummers staat wat je doet als bellen niet lukt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter > kort | "Wat in een noodplan hoort, hoe je ontmoetingspunten ... kiest" | herschreven | afspraken zonder telefoon eerst |
| Inleiding | "invulbaar noodplan dat je gratis kunt downloaden" | naar voorbereiding | "vooraf downloaden en afdrukken"; nieuwe alinea: netwerken vallen uit (Samen voorbereid), gsm-masten 1 tot 2 uur, vaste lijn waarschijnlijk niet (FOD Economie); begin met afspraken zonder telefoon |
| Ontmoetingspunten | stond na de contactpersonen, midden in de gids | herschreven | naar voren gehaald; Crisiscentrum digitale infrastructuur ("spreek op voorhand af waar je elkaar kunt terugvinden") toegevoegd |
| Ontmoetingspunten > opvangcentrum | "je hoort via de officiële kanalen waar het is" | aangevuld met offline alternatief | radio, hulpdiensten, omroepwagens van de politie; BE-Alert als het netwerk werkt (Crisiscentrum evacueren en informatie tijdens een noodsituatie) |
| Ontmoetingspunten > briefje | ontbrak | aangevuld met offline alternatief | Ready.gov Evacuation: "Leave a note telling others when you left and where you are going" (zelf geopend 18-11-2026) |
| Contactpersonen | lijst met ICE in de telefoon als punt 2 | herschreven | naar voren gehaald; papieren lijst en uit het hoofd leren eerst, ICE als laatste; kop "buiten de streek" |
| Contactpersonen > Ready.gov "bellen of mailen ... als de tijd het toelaat" | telefoonafhankelijk | houden | letterlijk de bron; het ontmoetingspunt en het briefje staan ervoor |
| Vragen die het plan beantwoordt > "Je telefoon werkt niet", "Er is geen internet" | Denk vooruit | houden | zijn al vragen over een situatie zonder netwerk |
| 7 stappen > stap 4 | "Download de app 112 BE." als eerste handeling | naar voorbereiding | lijst op papier eerst (Samen voorbereid), app vooraf downloaden |
| Noodnummers-tabel | "Noodnummers die op het Belgische plan ... staan" | naar voorbereiding | kop "om vooraf op papier te noteren"; "werken alleen als het netwerk werkt" |
| Noodnummers > 112 of de app 112 | | houden, aangevuld | app "als het netwerk werkt" |
| Noodnummers > 1722 of het e-loket | | houden, aangevuld | e-loket "als het internet werkt" |
| Noodnummers > 101, 1733, Antigifcentrum, Card Stop, gaslek | | houden | voorbereiding; nummers ongewijzigd |
| Noodnummers > 106 Tele-Onthaal | stond tussen de noodnummers | naar "Na de crisis" | eigen sectie "## Na de crisis, als de telefoon weer werkt", met verwijzing naar de gids mentale veerkracht (blok E) |
| "Bel je 112, geef dan door ..." | | aangevuld met offline alternatief | blok A kort: ander toestel, buren, verplaatsen; hulp in je buurt en radio; informatie- en onthaalpunt vooraf navragen; verwijzing naar Noodnummers, Als bellen niet lukt (112.be, FOD Economie) |
| Taken verdelen | "Contactpersoon buiten de regio laten weten" | aangevuld | rij "Briefje achterlaten" toegevoegd (Ready.gov) |
| School > BE-Alert registreren | eerste punt | naar voorbereiding | naar achter verplaatst, "als het netwerk werkt"; afspraak ophalen zonder telefoon en gezinswachtwoord eerst |
| School > "Leer ze ... nummers bellen", 112 leren bellen | | houden, aangevuld | Jeugd Rode Kruis-poster: hulp verwittigen bij een volwassene, een dokter of 112 |
| School > school weet "wie te bellen" | wat de school doet | houden | taak van de school, Crisiscentrum |
| Buren > hoe je elkaar verwittigt | sociale media en telefoon eerst, zonder telefoon laatst | herschreven | volgorde omgedraaid: eerst zonder telefoon of internet, dan "als het netwerk werkt" |
| Buren > gsm uitlenen, hotspot | Crisiscentrum-lijst | houden, aangevuld | samenkomen om licht en warmte te delen (Crisiscentrum noodpakket bij je thuis) |
| Zorgnoden > contact houden | | aangevuld | "alternatieven om te communiceren, ook zonder telefoon of internet" (Crisiscentrum plan extra hulp) |
| Zorgnoden > doof, blind, digitale technologie | BE-Alert, sms | houden | voorbereiding; "communicatie zonder telefoon" stond er al |
| Zorgnoden > vertaalapp | "voorzie een vertaalapp of iemand die tolkt" | herschreven | iemand die tolkt eerst |
| Zorgnoden > MCF toegankelijkheidsfuncties telefoon | | houden | voorbereiding |
| Dieren > telefoonnummer dierenarts, online registratie | | houden | voorbereiding |
| BE-Alert | inschrijven via be-alert.be; "Geen internet: vraag je gemeente" | houden, aangevuld | voorbereiding; nieuw blok "Als het netwerk wegvalt": radio op batterijen of opwindradio, informatieborden, folders, deur-aan-deur, omroepwagens (blok C; Samen voorbereid, Crisiscentrum informatie tijdens een noodsituatie) |
| Bewaren > papieren exemplaar | | houden | al offline |
| Checklist | letterlijk uit de brochure | houden | niet aangepast omdat het de lijst van de brochure is |

Bronnen toegevoegd aan de frontmatter (alle domeinen staan al in het register): Crisiscentrum Verstoring van de digitale infrastructuur, Informatie tijdens een noodsituatie, Een noodpakket bij je thuis, Een noodpakket op locatie (stond al in een bronregel), Denk vooruit Stel je noodpakket samen (stond al in een bronregel), 112.be Veelgestelde vragen, FOD Economie, Jeugd Rode Kruis-poster.

#### gidsen/hygiene-en-sanitair.md

Samenvatting: Bij de aankondiging van de gemeente over afval staat nu dat die via de radio en de andere overheidskanalen komt. Bij ernstige diarree staat nu wat je doet als bellen niet lukt. Daarnaast is een bron in de frontmatter aangevuld die al in een bronregel stond.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Vooraf (r. 66) | keukenpapier, ontsmettingsmiddel | houden | treffer op een woord, geen netwerkafhankelijkheid |
| Emmermethode > waar laten | "De gemeente laat weten... Wacht op die aankondiging." | aangevuld met offline alternatief | radio, omroepwagens van de politie, informatieborden, folders, deur-aan-deur (blok C; Crisiscentrum Informatie tijdens een noodsituatie, Samen voorbereid) |
| Latrines (r. 125-126) | 100 voet | houden | getallen, geen netwerkafhankelijkheid |
| Menstruatie (r. 204) | geen verdere richtlijnen | houden | |
| Afval > aankondiging gemeente | "Wacht op de aankondiging van de gemeente" | aangevuld met offline alternatief | via de radio en andere overheidskanalen (Crisiscentrum) |
| Diarree voorkomen > slotzin | "neem contact op met een arts als het ernstig is" | aangevuld met offline alternatief | verwijzing naar Noodnummers, Als bellen niet lukt |
| frontmatter | Plan voor wie extra hulp nodig heeft ontbrak | houden | bron stond al in een bronregel; toegevoegd aan de frontmatter |

#### gidsen/jodium.md

Samenvatting: De tekst zegt nu duidelijker hoe je de aanbeveling hoort: via radio en tv en omroepwagens van de politie, ook zonder telefoon, en via BE-Alert als het netwerk werkt. De tabletten haal je uit voorzorg vooraf bij de apotheek. Wie er geen heeft, kan ze van de hulpdiensten krijgen. Het Antigifcentrum staat er nu bij met "als het netwerk werkt". Er staan nog altijd geen doseringen in.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Waar je ze haalt | "Ga langs bij een apotheek" | naar voorbereiding | "Haal ze uit voorzorg vooraf af"; Nucleair risico FAQ |
| Waar je ze haalt | "online rekenmodule op nucleairrisico.be" (collectiviteiten) | houden | Voorbereiding door collectiviteiten |
| Wanneer je ze neemt > Hoe je het hoort | "via BE-Alert, radio, tv en de media" | herschreven | Radio en tv eerst, omroepwagens, BE-Alert als het netwerk werkt; Nucleair risico FAQ (informatie zonder telefoon), Waarschuwen en beschermen, Samen voorbereid (radio op batterijen) |
| Bijwerkingen | "raadpleeg arts of apotheker of bel het Antigifcentrum (070 245 245)" | aangevuld met offline alternatief | Arts of apotheker eerst, Antigifcentrum als het netwerk werkt; nummer ongewijzigd; FAQ |
| Bijwerkingen | "contacteer je arts"; "spreek nu al met je huisarts" | houden | Voorbereiding of algemeen |
| Als je geen tabletten hebt | "Luister naar de aanbevelingen" | herschreven | "op de radio"; nieuw punt: hulpdiensten verdelen voorraden over wie geen tabletten heeft; FAQ |
| Kort samengevat 5 | "als de Belgische overheid het zegt" | aangevuld met offline alternatief | Je hoort het op de radio, via omroepwagens of BE-Alert; FAQ, Waarschuwen en beschermen |

#### gidsen/kernwapen-en-radiologisch.md

Samenvatting: Eerst komt de radio op batterijen, en websites, sociale media en telefoon gelden als het netwerk werkt. De meldingen aan 112 en 101 kregen een korte "Lukt bellen niet". Bij de voorbereiding staat de radio nu voor BE-Alert.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat de Belgische overheid zegt | "Luister via radio, tv, officiële websites en sociale media" | herschreven | Radio op batterijen eerst; websites als het internet werkt; Crisiscentrum, Samen voorbereid |
| De eerste uren | "Blijf op de hoogte via radio, tv, telefoon" (CDC) | herschreven | Telefoon als het netwerk werkt; radio op batterijen bij stroomuitval; CDC, Samen voorbereid |
| Na de eerste dagen > Desinformatie | Online platformen en sociale media | houden | Waarschuwing, geen handeling met netwerk |
| Andere radiologische incidenten | "Meld aan de politie: 101 of 112"; "Meld het ongeval: 112" | aangevuld met offline alternatief | Eén keer korte vorm blok A onderaan de sectie; 112.be, FOD Economie |
| Voorbereiden | "Schrijf je in op BE-Alert. Hou een radio klaar" | herschreven | Volgorde omgedraaid: radio (DAB+ en FM) eerst; Samen voorbereid |
| Voorbereiden | Communicatieplan (Ready.gov) | houden | Al gericht op afspraken zonder netwerk |

#### gidsen/licht-en-energie.md

Samenvatting: De telefoonsectie zegt nu eerst wat je van gsm, vaste lijn en mobiel internet mag verwachten (FOD Economie) en wat je doet als bellen en internet niet meer werken (radio, overheidskanalen, hulp in de buurt, Noodnummers). Toegevoegd: samenkomen met buren om licht en warmte te delen, Belgisch advies voor wie afhankelijk is van stroom, een verwijzing naar de gids medicatie en zorg, en de korte vorm van "Lukt bellen niet".

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "hoe je je telefoon zo lang mogelijk laat meegaan" | herschreven | nu: wat je van je telefoon mag verwachten als het netwerk wegvalt, en licht en warmte delen |
| Inleiding | "Ook het telefoonnetwerk kan gestoord raken." | aangevuld met offline alternatief | verwijzing naar de telefoonsectie; OFF ON |
| Stroom: tabel (r. 80-84) | powerbank, reserveaccu's, autolader voor de gsm | houden | voorbereiding; opladen blijft nuttig |
| Batterijen en powerbank (r. 97-98) | accu's laden; gsm opladen voor een aangekondigde onderbreking | houden | voorbereiding |
| De auto (r. 106) | gsm-lader in de auto (MCF) | houden | voorbereiding |
| Generator (r. 121) | BBK: hoeveelheden brandstof | houden | geen netwerkafhankelijkheid; getallen ongewijzigd |
| Telefoon > kop | "De telefoon zo lang mogelijk laten werken" | herschreven | "De telefoon: opladen, maar er niet op rekenen" |
| Telefoon > Wat je moet weten | BBK over vaste lijn en mobiele netwerken | aangevuld met offline alternatief | FOD Economie: gsm-masten 1 tot 2 uur, mobiel internet meteen weg, vaste lijn meestal niet, klassieke lijn ongeveer 4 uur, mast in andere zone, herstel na enkele uren |
| Telefoon > spaarstand (r. 144-146) | helderheid, één telefoon aan, 's nachts ontvangstklaar | houden | "zolang het netwerk werkt" toegevoegd; OFF ON en Rode Kruis-Vlaanderen over opladen |
| Telefoon > netwerk sparen (r. 150) | sms boven bellen (OFF ON) | houden | onder "Zolang het netwerk werkt"; Rode Kruis: 112 alleen bij direct gevaar |
| Telefoon > berichtenapps (r. 151) | "Gebruik berichtenapps in plaats van te bellen" | aangevuld met offline alternatief | toegevoegd dat apps mobiel internet nodig hebben en dat snel wegvalt (FOD Economie) |
| Telefoon > Ready.gov vaste telefoon (r. 157) | nagaan of vaste telefoon werkt | naar voorbereiding | expliciet "vooraf" |
| Telefoon > nieuw | geen | aangevuld met offline alternatief | radio op batterijen of autoradio (OFF ON, FOD Economie); omroepwagens, informatieborden, folders, deur-aan-deur (blok C, Crisiscentrum); "vraag hulp in je buurt", informatie- en onthaalpunt (FOD Economie); Noodnummers, Als bellen niet lukt; kaart met knop Dichtstbij |
| Tijdens > stap 8 | buren en naasten informeren (OFF ON) | houden | aangevuld met Rode Kruis-Vlaanderen: kijk om naar buren of familie |
| Tijdens > nieuwe stap 9 | geen | aangevuld met offline alternatief | samenkomen om licht en warmte te delen, vooraf afspreken (Crisiscentrum, noodpakket bij je thuis) |
| Tijdens > slotalinea (r. 174) | "Bel de noodnummers niet om informatie te vragen" (BBK) | aangevuld met offline alternatief | Rode Kruis: 112 alleen bij direct gevaar; korte vorm blok A; 112.be, FOD Economie |
| Schaarste (r. 194) | "Schrijf je in op BE-Alert" | naar voorbereiding | "vooraf"; toegevoegd dat de afschakeling de dag voordien ook via tv, radio en pers bekend wordt (FOD Economie) |
| Wie afhankelijk is van stroom | Crisiscentrum, Ready.gov, BBK | aangevuld met offline alternatief | FOD Economie: autonomie van het toestel nagaan, opvang elders vooraf bekijken, thuisdialyse loskoppelen bij aangekondigde afschakeling; verwijzing naar de nieuwe sectie in medicatie en zorg |
| Checklist (r. 223) | gsm-lader voor de auto | houden | voorbereiding |
| Checklist > nieuw | geen | aangevuld met offline alternatief | papieren lijst met nummers (Samen voorbereid); afspraken met buren zonder telefoon of internet en over licht en warmte (Crisiscentrum, plan in je buurt; noodpakket) |

#### gidsen/medicatie-en-zorg.md

Samenvatting: Nieuwe sectie "Als je je zorgverlener niet kunt bellen" voor wie afhankelijk is van zuurstof, dialyse, thuisbeademing of andere toestellen: vooraf afspreken, alles op papier, en wat je doet als bellen niet lukt (hulp in de buurt, radio, onthaalpunt, opvang elders, 112 met Noodnummers). Apotheek van wacht: eerst de lijst aan de apotheek, daarna de website als het netwerk werkt. 1733, Farmastatus en farmainfo.be staan nu met "als het netwerk werkt" of als voorbereiding.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | geen vermelding van bereikbaarheid | herschreven | "wat je vooraf afspreekt voor als je je zorgverlener niet kunt bellen" toegevoegd |
| De medicatielijst (r. 82) | digitale noodpas op smartphone | houden | aanvulling op de papieren noodpas (BBK); voorbereiding |
| Toestellen op stroom > Vooraf | zorgverleners, energieleverancier, extra batterij | aangevuld met offline alternatief | FOD Economie: autonomie van de interne batterij nagaan, opvang elders vooraf bekijken, thuisdialyse loskoppelen bij aangekondigde afschakeling |
| Dialyse (r. 200) | "Vraag je dialysecentrum naar zijn noodprocedure" | houden | voorbereiding |
| Nieuwe sectie: Als je je zorgverlener niet kunt bellen | geen | aangevuld met offline alternatief | FOD Economie (telefonie valt weg; vraag hulp in je buurt; informatie- en onthaalpunt; radio; opvang elders; ziekenhuizen prioritair, rusthuizen niet); Crisiscentrum (afspraken met zorgverleners, alternatieven zonder telefoon of internet, lijst op papier met adressen, plan in je buurt); BBK Stromausfall (personenalarmering kan uitvallen, buren aanspreken, bij de gemeente vragen waar je een noodmelding doet, als Duits advies); BBK Ratgeber (politiepost of ziekenhuis, als Duits advies); Ready.gov (lijst van dichtstbijzijnde medische voorzieningen en vervoer, contactlijst waterdicht, steunnetwerk, reserveadres, type en serienummer); 112 met verwijzing naar Noodnummers, Als bellen niet lukt; kaart knop Dichtstbij |
| Als je medicatie opraakt > apotheek.be (r. 214) | "Zoek de apotheek van wacht op apotheek.be" | herschreven | volgorde omgedraaid: eerst de wachtdienstlijst aan elke apotheek (zonder internet), dan "als het netwerk werkt" apotheek.be en het gratis nummer (APB) |
| Als je medicatie opraakt > zonder internet (r. 215) | wachtdienstlijst aan de apotheek | houden | nu eerste keuze |
| Huisarts van wacht (r. 219) | "bereik je op 1733" | naar voorbereiding | "als het netwerk werkt", nummer vooraf noteren |
| Tekort (r. 223-224) | Farmastatus, farmainfo.be | naar voorbereiding | "als voorbereiding, zolang het internet werkt"; raad van huisarts of apotheker blijft eerst |
| Als zorg tijdelijk niet bereikbaar is (r. 227) | BBK: politiekantoor of ziekenhuis | houden | benoemd als Duits advies, verwijzing naar de nieuwe sectie |
| Zorgafhankelijke personen (r. 253) | "Spreek af hoe jullie elkaar bereiken; BE-Alert" | aangevuld met offline alternatief | "ook als telefoon en internet niet werken" (Crisiscentrum, plan voor wie extra hulp nodig heeft); BE-Alert "zolang het netwerk werkt" |
| Checklist (r. 276) | apotheek van wacht ook zonder internet | houden | |
| Checklist > nieuw | geen | aangevuld met offline alternatief | plan ook voor als bellen niet lukt; batterijduur en plek elders; papieren lijst met zorgverleners en ziekenhuizen; 1733 op papier |

Niet bevestigd en dus niet geschreven: een Belgische bron die zegt dat je met een stroomafhankelijk toestel naar het ziekenhuis gaat als je niemand bereikt. Alleen het feit dat ziekenhuizen prioritair blijven bevoorraad (FOD Economie) en het Duitse BBK-advies staan erin. Geen Belgische bron voor een register van stroomafhankelijke patiënten bij de netbeheerder gevonden; de Ready.gov-tip (energieleverancier) blijft als buitenlands advies.

#### gidsen/mentale-veerkracht.md

Samenvatting: De hulp tijdens de crisis draait nu om psychologische eerste hulp ter plaatse (blok D), met een nieuwe sectie in zeven punten en een uitgebreide sectie over wie meteen meer hulp nodig heeft: bij de persoon blijven en hulp zoeken bij mensen in de buurt. De tabel met hulplijnen staat nu in een aparte sectie "Na de crisis, als de telefoon weer werkt". De PEH-secties staan nu vooraan, vlak na de reacties.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter > kort | "... en wanneer en waar je hulp zoekt" | herschreven | PEH ter plaatse eerst; hulplijnen "na de crisis" |
| Inleiding | twee alinea's over voorbereiding | aangevuld met offline alternatief | zin over telefoon en internet die misschien niet werken, PEH ter plaatse, hulplijnen onderaan; FOD Economie, WHO |
| Voor de noodsituatie | "Praat ... met je huisarts", "Zoek professionele hulp" (MCF) | houden | voorbereiding vóór de crisis, telefoon werkt dan nog |
| Tijdens en na: reacties | WHO-lijst | houden, aangevuld | normale reacties (RKV-brochure p. 2), herstel zonder professionele hulp (Impact p. 31) |
| PEH: wat het is | WHO-definitie | houden, aangevuld | iedereen kan het (IFRC 2018 p. 27); wanneer en waar (WHO p. 5-6); duur (IFRC 2018 p. 88); vijf principes (IFRC 2018 p. 14, Impact p. 32) |
| Kijken, luisteren, verbinden | WHO-drie principes, "Help ... toegang te krijgen tot diensten" | herschreven | wordt "Tijdens de crisis: PEH ter plaatse" in zeven punten (blok D): veiligheid; rust en luisteren; praktische hulp; samen blijven; kinderen bij ouders; rouw; wie meer hulp nodig heeft. WHO p. 12, 14, 19-28, 32-34; IFRC 2018 p. 30-35, 39, 50, 59; IFRC 2020 p. 116-118; G&W schokkende gebeurtenis en paniekaanval; RKV-brochure p. 6; Crisiscentrum noodpakket (licht en warmte delen) |
| PEH > kalmeren | WHO-tips | aangevuld | waarschuwing hartaanval of astma: dan medische hulp (IFRC 2018 p. 35) |
| PEH > verbinden | "Breng mensen in contact met naasten" | herschreven | IFRC 2020 p. 118: contact met familie heeft voorrang, "ook in persoon"; mensen ter plaatse samenbrengen (WHO p. 28). Telefoonafhankelijke WHO-zin "provide a way to call loved ones" niet overgenomen |
| Wat je zegt en niet zegt | WHO-tabel | houden, aangevuld | IFRC 2018 p. 33: gebruik je telefoon niet tijdens het gesprek |
| Wie meteen meer hulp nodig heeft | "Bij levensgevaar bel je 112." | aangevuld met offline alternatief | niet alleen laten, hulp bij mensen in de buurt (WHO p. 5, 20); bij gevaar voor zichzelf rechtstreeks vragen en bij de persoon blijven (IFRC 2018 p. 45); ernst inschatten, voorwerpen verwijderen, netwerk inschakelen, niet overtuigen, geen geheimhouding (G&W zelfmoordgedachten); agressie (IFRC 2018 p. 45); 112 met korte vorm van blok A en verwijzing naar Noodnummers, Als bellen niet lukt (112.be, FOD Economie); omstander sturen (IFRC 2020) |
| Wat helpt | BBK/WHO-tabel | houden, aangevuld | "samen verwerken gaat beter dan alleen" (RKV-brochure p. 9) |
| Slapen en dagritme | "zie de sectie over wanneer je hulp zoekt" | herschreven | verwijst nu naar "Wanneer je later meer hulp zoekt" |
| Met kinderen praten | "zoek samen antwoorden bij betrouwbare bronnen", "Leg uit bij wie ze terechtkunnen" | houden | Crisiscentrum; geen netwerkhandeling |
| Kinderen per leeftijd | WHO-tabellen | houden, aangevuld | RKV-brochure p. 12-13 (bij een volwassene terechtkunnen, eerlijk en kort, niet verplichten te praten) |
| Kinderen alleen of ouder weggebracht | ontbrak | aangevuld met offline alternatief | in PEH-punt 5: WHO p. 33-34 (noteren waar de ouder heen gaat; kind niet alleen laten, zelf familie zoeken als er geen organisatie is) |
| Beperking > "opgeladen toestellen met video's" | Ready.gov | houden | voorbereiding van de opvangtas |
| Beperking | WHO-groepen | aangevuld | WHO p. 35: bij de persoon blijven of iemand anders laten blijven |
| Rouw en verlies | "De geraadpleegde bronnen geven geen aparte richtlijnen" | herschreven | nu met IFRC 2018 p. 25 en 53, G&W rouw, RKV-brochure p. 8-10, Impact p. 33 |
| Rouw > Restoring Family Links | dienst die helpt zoeken | houden | geen acute stap; verwijst naar de gids evacuatie |
| Rouw > "zoek dan hulp (zie hieronder)" | verwees naar hulplijnen | herschreven | eerst steun bij vertrouwde mensen, dan "Wanneer je later meer hulp zoekt" |
| Zorg voor jezelf | WHO-lijst | houden, aangevuld | IFRC 2018 p. 90-94 en IFRC 2020 p. 31 |
| Wanneer en waar je hulp zoekt > Wanneer | signalen, langer dan een maand | herschreven | aparte sectie "Wanneer je later meer hulp zoekt"; langdurige rouw na zes maanden (IFRC 2018 p. 46) |
| Tabel hulplijnen (huisarts, 106, 102, 1813, 1712, 1733) | in "Waar, in België" | naar "Na de crisis" | nieuwe sectie "## Na de crisis, als de telefoon weer werkt" (blok E); nummers ongewijzigd; "vooraf op papier noteren" (Samen voorbereid) |
| Tabel hulplijnen > rij "Hulpdiensten 112" | 112 als hulplijn | verwijderd | 112 staat nu in "Wie meteen meer hulp nodig heeft", met wat je doet als bellen niet lukt |

Niet bevestigd en dus niet geschreven: een Belgische bron die PEH zonder telefoon apart beschrijft; de oproep "ga naar de brandweerkazerne of het ziekenhuis" als Belgisch advies. Geen nieuwe bronnen buiten het register nodig; `data/bronnen/nieuw-realisme-mentaal.json` is niet aangemaakt.

#### gidsen/na-de-wolk.md

Samenvatting: De hulplijnentabel staat nu in een aparte sectie "Na de crisis, als de telefoon weer werkt"; in de plaats ervan beschrijft "Mentale opvang" kort psychologische eerste hulp ter plaatse (blok D). Informatie komt eerst via de radio en omroepwagens, websites en het informatienummer pas "als het netwerk werkt", en bij 112 staat wat je doet als bellen niet lukt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wanneer het schuilen eindigt > tabel "Blijf binnen" | "blijf luisteren naar de officiële kanalen" | herschreven | radio en de andere officiële kanalen (blok C) |
| Wanneer het schuilen eindigt | "Volg de media en de officiële kanalen." | aangevuld met offline alternatief | radio op batterijen of autoradio, omroepwagens van de politie; BE-Alert en websites als het netwerk werkt (Crisiscentrum informatie tijdens een noodsituatie) |
| Wanneer het schuilen eindigt > BBK | "radio, internet of de waarschuwingsapp" | houden | letterlijk Duits advies, benoemd als buitenlands, radio staat eerst |
| Terugkeer > hoe je het weet | "volg de website van de gemeente, luister naar de radio of bel het informatienummer" | herschreven | radio eerst; website en informatienummer "werkt het netwerk" (Crisiscentrum evacueren) |
| Metingen > Telerad, EURDEP | "Als je weer verbinding hebt" | houden | stond al als tweede stap |
| Gezondheid > medisch advies | "Volg de officiële kanalen" | herschreven | radio eerst |
| Gezondheid > ziek of gewond | "In België: bel 112 bij een medische noodsituatie." | aangevuld met offline alternatief | personeel in de opvang stond al eerst; 112 met korte vorm van blok A en verwijzing naar Noodnummers, Als bellen niet lukt (112.be, FOD Economie) |
| Mentale opvang > wat je zelf kunt doen | praten met familie, huisarts | houden | geen telefoon nodig |
| Mentale opvang > nieuw | ontbrak | aangevuld met offline alternatief | "Elkaar ter plaatse steunen": blok D (WHO 2011, IFRC PS Centre 2018) met verwijzing naar de gids mentale veerkracht |
| Mentale opvang > "Waar je terechtkunt" (106, 102, 1712, 1813) | tabel in de acute sectie | naar "Na de crisis" | nieuwe sectie "## Na de crisis, als de telefoon weer werkt"; nummers ongewijzigd (Crisiscentrum Praat erover, Samen voorbereid) |
| Mentale opvang > kinderen, "zoek samen antwoorden bij betrouwbare bronnen" | | houden | Crisiscentrum |
| Juiste informatie en geruchten | gaat over sociale media | aangevuld met offline alternatief | valt het netwerk weg: radio, omroepwagens, informatieborden, folders, deur-aan-deur (Samen voorbereid, Crisiscentrum informatie tijdens een noodsituatie) |
| Elkaar helpen > "Gebruik WhatsApp, Signal of sociale media in plaats van te bellen" | merknamen, netwerk vanzelfsprekend | herschreven | "Werkt het netwerk, stuur liever een bericht ..." zonder merknamen (schrijfwijzer § 1) |
| Elkaar helpen > kwetsbare buren, contactpersoon | | houden | al offline |
| Checklist > "waar je terechtkunt voor medische controle of een gesprek" | | houden | geen acute belstap |

Bronnen toegevoegd aan de frontmatter (domeinen staan al in het register): Crisiscentrum Informatie tijdens een noodsituatie, 112.be Veelgestelde vragen, FOD Economie, WHO PFA 2011, IFRC PS Centre 2018.

#### gidsen/navigatie-zonder-gps.md

Samenvatting: De gids ging al uit van geen gsm. Stap 4 "bel om hulp" werd een volgorde zonder netwerk (mensen aanspreken, anders blijven en signalen geven), de app 112 BE staat als "als het netwerk werkt", en de plaatsbeschrijving geldt ook voor wie hulp gaat halen.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| kort (frontmatter) | "zonder gsm of gps" | houden | klopt al |
| Waarom dit nodig is | kaart, kompas, gps | houden | NPS |
| Voor je vertrekt | "Druk ze af, download ze, of haal ze op voorhand" | houden | voorbereiding; toegevoegd "Oefen het kaartlezen" (NPS "Practice reading the map") |
| Kaarten van België | Topomapviewer heeft internet nodig, pdf vooraf afdrukken | houden | al realistisch |
| Coördinaten > tabel | "De app 112 BE" | houden | "(als het netwerk werkt)" toegevoegd |
| Coördinaten > tabel | "Een gsm met gps" | houden | gps werkt zonder netwerk zolang de batterij werkt; NPS |
| Coördinaten | (geen) | aangevuld met offline alternatief | dezelfde gegevens meegeven aan wie hulp gaat halen; sluit aan op Iemand is gewond ("precieze plaatsbeschrijving meegeven"), NPS |
| Verdwaald > Stap 4 | "bel om hulp als dat niet lukt" | herschreven | bereik: 112; geen bereik: iemand aanspreken die naar een plek met bereik gaat; niemand: blijven en signalen; NPS Outdoor Emergency Plan |
| Iemand is gewond | twee of meer sturen | houden | al correct; NPS |
| Per plek > Bos | "Bel 112 met herkenbare punten" | aangevuld met offline alternatief | geen bereik bij brand: evacueren en mensen aanspreken; Crisiscentrum Natuurbrand |
| Per plek > Bergen | alpien noodsignaal zonder telefoon | houden | DAV |
| Afstand meten | "Telefoondraden" (treffer) | houden | geen telefoonverwijzing |

#### gidsen/noodoproep.md

Samenvatting: De sectie "Geen bereik, geen simkaart of een netwerkstoring" staat nu vlak na "Je plaats doorgeven" en is uitgewerkt tot het volledige blok voor als bellen niet lukt: toestel, stroomuitval (FOD Economie), de vijf stappen van 112.be, de tijdelijke nummers, wat je zonder enig toestel doet (slachtoffer, buurt, radio, onthaalpunt), daarna apart het buitenlandse advies (BBK, Nederland 2019, Zweden) en wat je vooraf regelt. De hulplijnen 116 000, 1813, 106, 102 en 1712 zijn uit de nummertabel gehaald en staan in een nieuwe slotsectie "Na de crisis, als de telefoon weer werkt".

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "... bellen zonder bereik of vanuit het buitenland ..." | herschreven | "wat je doet als bellen niet lukt" toegevoegd; volgt de nieuwe opbouw |
| frontmatter bronnen | 18 bronnen | aangevuld met offline alternatief | 17 bronnen toegevoegd, alle al in het register (FOD Economie, Crisiscentrum x6, RKV stroomuitval, Jeugd RK-poster, G&W reanimeren, ERC 2021 FA/BLS/PLS, IFRC 2020, BBK x2, inspectierapport NL 2019, Krisinformation) |
| Welk nummer, inleiding | (geen) | aangevuld met offline alternatief | "Al deze nummers werken alleen als je kunt bellen", verwijzing naar de sectie Geen bereik, nummers vooraf op papier; Crisiscentrum Samen voorbereid (papieren lijst met belangrijke telefoonnummers) |
| Welk nummer, tabel 112/101 | "112 ... 101 ..." | houden | 112.be Andere noodnummers |
| Welk nummer, tabel 1722, 1733, Antigifcentrum, 1711, Speleohulp | nummers in de tabel | houden | blijven, onder de inleiding "werken alleen als je kunt bellen"; 112.be |
| Welk nummer, tabel 116 000, 1813, 106, 102, 1712 | hulplijnen in de nummertabel | naar "Na de crisis" | nieuwe sectie onderaan met dezelfde nummers en bron (112.be Andere noodnummers); verwijzende zin in de oude sectie |
| Welk nummer, Bel 112 niet | "gebruik dan 1722.be of 1722" | herschreven | eerst "bel 1722", e-loket "als het internet werkt"; 112.be |
| Wat er gebeurt, slot | (geen) | aangevuld met offline alternatief | geen beltoon of foutmelding: verwijzing naar Geen bereik; 112.be FAQ |
| Welke vragen, slot | "telefoongesprek beter dan een bericht" | houden | plus: wie hulp gaat halen krijgt waar, wat, wie mee; IFRC 2020 p. 403 (aantal slachtoffers doorgeven), RKV Waar? Wat? Wie? |
| Je plaats doorgeven | "Laat iemand de hulpdiensten opwachten" | houden | niet netwerkafhankelijk |
| Geen bereik (verplaatst naar positie 5) | sectie stond na "Als je niet kunt praten" | herschreven | naar voren gehaald, opgesplitst in ### Je toestel, Bij een stroomuitval, Als 112 niet antwoordt, Als bellen helemaal niet lukt, Advies uit het buitenland, Vooraf regelen; elk met eigen bronregel |
| Geen bereik > Je toestel | simkaart, vergrendeld, "alleen noodnummer" | houden | 112.be FAQ, vlaanderen.be |
| Geen bereik > Bij een stroomuitval | (geen) | aangevuld met offline alternatief | gsm-masten 1 tot 2 uur, mobiel internet snel weg, vaste lijn weinig waarschijnlijk, 112 via elke operator met signaal, 101 niet gegarandeerd, bel alleen als het echt nodig is; FOD Economie; "Bel of surf niet onnodig": Crisiscentrum digitale infrastructuur. 100 weggelaten om verwarring te vermijden |
| Geen bereik > stap 1 | "Vraag buren of omstanders om te bellen" | houden | 112.be FAQ ("helpen en te bellen") |
| Geen bereik > stap 4 | tijdelijke gsm-nummers | houden | plus "alleen in geval van nood"; Crisiscentrum digitale infrastructuur |
| Geen bereik > stap 5 | "Werkt niets: neem rechtstreeks contact op met ziekenhuis, brandweerzone, lokale politie" | herschreven | "Kun je nog bellen, maar ..." en "bel rechtstreeks": 112.be zet dit onder "als u wel nog kan bellen"; niet als fysiek naar de kazerne gaan geschreven |
| Geen bereik > tabel tijdelijke nummers | 11 provincies | houden | ongewijzigd; 112.be FAQ en Andere noodnummers |
| Geen bereik > Volledig zonder netwerk | "Zoek een plek met bereik ... stuur twee of meer ... alleen: help eerst ... laat alleen als geen andere mogelijkheid" | herschreven | nu "Als bellen helemaal niet lukt" met kernzin FOD Economie ("vraag hulp in je buurt"); NPS en DAV-punten gehouden; toegevoegd: luid om hulp roepen en een omstander rechtstreeks aanspreken (G&W Hoe moet je reanimeren, IFRC 2020 p. 101, 136), waar/wat/hoeveel/toestand meegeven (blok B; IFRC p. 403), slachtoffer alleen als het niet anders kan (ERC 2021 FA p. 272), reanimatieregel alleen zonder telefoon volwassene/kind (ERC 2021 BLS p. 99, 104; PLS p. 328, 335), zeg aan de operator dat je niet ter plaatse belt (112.be Hoe bel ik) |
| Geen bereik > Hulp en informatie in je buurt | (geen) | aangevuld met offline alternatief | buren en omstanders, radio op batterijen/opwindradio/autoradio, omroepwagens van de politie, informatieborden, folders, deur aan deur, informatie- en onthaalpunt (vooraf navragen bij de gemeente), onthaalcentrum met contactpersoon, omkijken naar buren; FOD Economie, Crisiscentrum Informatie tijdens een noodsituatie, Samen voorbereid, Evacueren, RKV Stroom- en communicatie-uitval |
| Geen bereik > Advies uit het buitenland | (geen) | aangevuld met offline alternatief | apart benoemd: Duitsland (BBK Ratgeber: politiepost of ziekenhuis, gemeentehuis of Notfalltreffpunkt; BBK Stromausfall: gemeente vragen waar je een noodmelding doet, stroomuitval is geen noodgeval), Nederland 2019 (inspectierapport: NL-Alert naar kazerne of politiebureau, agenten aanspreken, ziekenhuis, niet alle kazernes bemand), Zweden (Krisinformation: dichtstbijzijnde brandweerkazerne, aangeduide plaatsen). Vooraf de zin dat we geen Belgische bron vonden die naar kazerne of politie stuurt (bronnenkaart). Kaart in de app (knop Dichtstbij) erna |
| Geen bereik > Vooraf regelen | (geen) | naar voorbereiding | papieren lijst met tijdelijke nummers en nummers van ziekenhuis, brandweerzone, lokale politie; gemeente vragen naar het onthaalpunt; ontmoetingsplaats met familie; afspraken met buren zonder telefoon; radio DAB+ en FM; Samen voorbereid, 112.be FAQ, FOD Economie, Crisiscentrum digitale infrastructuur en buurt |
| Geen bereik, Zweeds advies simkaart uitnemen | (niet in de tekst) | verwijderd | niet opgenomen: botst met de Belgische regel dat een simkaart nodig is (vlaanderen.be, 112.be) |
| Bij een grote ramp of storm | "gebruik dan het e-loket 1722.be of bel 1722" | herschreven | eerst bellen, e-loket "als het internet werkt"; verplaatst naar direct na Geen bereik |
| Bij een grote ramp, levensgevaar | "bel dan altijd 112" | aangevuld met offline alternatief | verwijzing naar Geen bereik; plus "Bel 112 alleen bij direct gevaar en beperk je telefoongebruik": RKV Stroom- en communicatie-uitval |
| AML | persbericht 2017 | houden | informatief, geen handeling tijdens de crisis |
| De app 112 BE | "Installeer, registreer" | houden | voorbereiding; plus: de app heeft het gsm-netwerk nodig (internet of sms, zoals in de tabel), valt het weg: verwijzing naar Geen bereik; 112.be Mobiele applicatie |
| Doof, slechthorend | app met chat, sms-dienst | aangevuld met offline alternatief | "alleen als het gsm-netwerk werkt"; nieuw blok "Zonder netwerk": alternatieven om te communiceren zonder telefoon of internet, afspraken met buren; Crisiscentrum Een plan voor wie extra hulp nodig heeft, Een plan in jouw buurt |
| Doof, "112@ibz.fgov.be" | e-mailadres | houden | voorbereiding (nummers opvragen) |
| Als je niet kunt praten | app, iemand anders laten bellen | houden | "Iemand anders kan bellen" is al het offline alternatief; 112.be |
| Vanuit het buitenland | "vraag een familielid ... om te bellen", sms van provider | houden | reizen, geen crisisstap; 112.be, Europese Commissie |
| eCall en snelweg | "Bel 101", "Bel 112" | aangevuld met offline alternatief | één verwijzing naar Geen bereik onder de tabel |
| Kinderen leren bellen, wat een kind moet kennen | 5 punten over 112 | aangevuld met offline alternatief | punt 6: ook een volwassene of een dokter verwittigen; Jeugd Rode Kruis-poster (Verwittig hulp: een volwassene, een dokter, de Noodcentrale 112) |
| Kinderen, oefenen | sjabloon, kidsfilm en quiz op 112.be | houden | voorbereiding, vooraf te downloaden |
| Valse oproepen, Kosten en privacy | | houden | niet netwerkafhankelijk |
| Voorbereiden per persoon, Iedereen | "Installeer de app ... Schrijf de tijdelijke nummers op" | herschreven | papieren lijst, ontmoetingsplaats, afspraak met buren eerst, app daarna; Samen voorbereid, Crisiscentrum digitale infrastructuur |
| Voorbereiden per persoon, Doven | app en nood-sms | aangevuld met offline alternatief | "Spreek af hoe je zonder telefoon of internet met anderen communiceert"; Crisiscentrum Een plan voor wie extra hulp nodig heeft |
| Na de crisis, als de telefoon weer werkt | (nieuw) | naar "Na de crisis" | 116 000, 1813, 106, 102, 1712 met de oorspronkelijke omschrijving; bij levensgevaar of zelfmoordpoging 112 (112.be); steun tijdens de crisis: verwijzing naar de gids Mentale veerkracht |
| datum | "2026-11-17" | herschreven | "2026-11-18" |

Niet bevestigd en dus weggelaten: een Belgische bron die je bij een volledige uitval fysiek naar kazerne, commissariaat of ziekenhuis stuurt; de Zweedse tip om de simkaart te verwijderen; Zwitserse en Luxemburgse voorbeelden (bewust niet opgenomen om de sectie kort te houden). Geen nieuwe bronnen buiten het register gebruikt, dus geen bestand `data/bronnen/nieuw-realisme-alarmeren.json` nodig.

#### gidsen/noodpakket-en-vluchttas.md

Samenvatting: Kleine aanpassingen: de lijst met nummers moet op papier en met adressen, samen met de afgesproken ontmoetingsplaats. Bij de powerbank staat nu dat je er niet op mag rekenen dat je altijd kunt bellen. Voor mensen met een beperking staat er nu: denk aan communicatie zonder telefoon of internet.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Inleiding (r. 47) | voorraad voor een tijd zonder telefonie en internet | houden | |
| Vluchttas > nummers (r. 60) | "lijst met belangrijke telefoonnummers" | aangevuld met offline alternatief | op papier, met adressen, ontmoetingsplaats (Samen voorbereid; Een plan bij je thuis) |
| Vluchttas > powerbank (r. 78) | "opgeladen powerbank en gsm-oplader" | aangevuld met offline alternatief | houden als voorbereiding, met de vermelding dat internet en mobiele netwerken kunnen uitvallen (Samen voorbereid) |
| Andere landen > kaart en kompas (r. 99) | als gps en telefoon niet werken | houden | |
| Documenten > digitale kopie | cloud, harde schijf, usb-stick | houden | voorbereiding naast de papieren kopie |
| Cash (r. 152) | cash als je niet online kunt betalen | houden | |
| Ouderen > contactgegevens | contactgegevens van artsen en familie | aangevuld met offline alternatief | op een lijst in een waterdichte verpakking (Ready.gov, People with Disabilities) |
| Mensen met een beperking | Crisiscentrum, BBK, Ready.gov | aangevuld met offline alternatief | "Denk aan alternatieven om met anderen te communiceren, ook als je geen telefoon of internet hebt" (Crisiscentrum, plan voor wie extra hulp nodig heeft) |
| Tabel beperking (r. 208) | opgeladen toestellen met video's | houden | voorbereiding |
| In de auto (r. 258) | gsm-lader in de auto | houden | voorbereiding |
| Checklist (r. 290) | "Noodplan of lijst met telefoonnummers op papier" | aangevuld met offline alternatief | met adressen en de afgesproken ontmoetingsplaats (Samen voorbereid) |
| Checklist (r. 299) | powerbank en gsm-oplader | houden | voorbereiding |

#### gidsen/noodvoorraad.md

Samenvatting: geen wijziging nodig. De gids gaat over wat je vooraf in huis haalt en bevat geen handeling die van telefoon, app of website afhangt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Water (r. 83) | tabel 36, 120, 168 liter | houden | geen netwerkafhankelijkheid; treffer komt alleen van een getal |
| De rest van de voorraad (r. 212) | jodiumtabletten bij de apotheek | houden | voorbereiding; geen bellen |
| Roteren (r. 248) | "Kies voedingsmiddelen die je normaal ook gebruikt" | houden | treffer op het woord "gebruikt", geen netwerkafhankelijkheid |
| Licht, warmte en elektronica | opwindbare radio of radio op batterijen | houden | al de offline informatiebron (Crisiscentrum) |
| Weinig plaats | radio delen met buren | houden | Crisiscentrum |

#### gidsen/nucleair-schuilen-en-straling.md

Samenvatting: "Hoe je gewaarschuwd wordt" begint nu bij de radio op batterijen en de omroepwagens. BE-Alert, websites en sociale media gelden als het netwerk werkt, en je krijgt de informatie ook zonder telefoon (FAQ Nucleair risico). De 112-stappen kregen "Lukt bellen niet". Bij de voorbereiding kwamen een radio en een ontmoetingsplek met de familie.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat er gebeurt | "veelgestelde vragen op nucleairrisico.be" | houden | Bronvermelding |
| Sites en zones > De zone op het moment zelf | "Op nucleairrisico.be staat een kaart ..." | naar voorbereiding | "Kijk vooraf na ..." |
| Hoe je gewaarschuwd wordt | BE-Alert eerst, daarna radio, websites, sociale media, omroepwagens | herschreven | Radio en omroepwagens eerst; BE-Alert (nummers ongewijzigd) en websites als het netwerk werkt; Nucleair risico Waarschuwen, FAQ ("noch telefoon, noch gsm"), Samen voorbereid, Crisiscentrum Noodpakket (stroompanne) |
| Hoe je gewaarschuwd wordt | "Heb je geen telefoon: omroepwagens, radio, tv en websites" | herschreven | "websites" geschrapt in die zin, want zonder netwerk niet bruikbaar; FAQ noemt omroepwagens, media en sociale media |
| Hoe je gewaarschuwd wordt | "Telefoneer niet onnodig" | houden | Met de uitzondering uit de FAQ (medische noodsituatie) |
| Schuilen > Thuis, stap 9 | "Luister via radio, tv, websites, sociale media" | herschreven | Radio eerst, websites als het internet werkt; Nucleair risico Schuilen |
| Schuilen > Per plek | "Te voet zonder gebouwen: Bel 112" | aangevuld met offline alternatief | Crisiscentrum Schuilen, onderweg |
| Kwetsbare personen | "bel dan zoals altijd 112" | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Evacuatie > Wat je doet | "gsm en oplader" | houden | Meeneemlijst uit de bron |
| Evacuatie > auto | "Zet de radio aan" | houden | Al offline |
| Niet doen | "Bel niet onnodig" | houden | Nucleair risico FAQ |
| Voorbereiden | "Schrijf je in op BE-Alert" | houden | Voorbereiding; radio op batterijen en ontmoetingsplek met de familie toegevoegd; Samen voorbereid, Crisiscentrum Verstoring digitale infrastructuur |

#### gidsen/openbare-schuilplekken.md

Samenvatting: Bij "dan bel je 112" staan nu wat je doet als bellen niet lukt en het Belgische advies voor wie onderweg is. Bij wat er in België bestaat kwamen het informatie- en onthaalpunt van de gemeente (FOD Economie) en de contactpersoon in het onthaalcentrum erbij.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat er in België bestaat | "Haal je geen veilig gebouw ..., dan bel je 112" | aangevuld met offline alternatief | korte vorm blok A; Crisiscentrum Schuilen, onderweg: verder weg tot een veilig, toegankelijk gebouw; 112.be, FOD Economie |
| Wat er in België bestaat > Onthaalcentra | Sporthal of feestzaal | aangevuld met offline alternatief | Contactpersoon ter plaatse geeft informatie; Crisiscentrum Evacueren |
| Wat er in België bestaat | (nieuw) | aangevuld met offline alternatief | Informatie- en onthaalpunt (voorbereid voor afschakeling), vooraf vragen bij de gemeente; kaart in de app toont gemeentehuizen; FOD Economie |
| Gebouw met ondergrondse verdiepingen | "telefoonnummer van de eigenaar noteren" (Oekraïne) | houden | Voorbereiding |
| Je buurt verkennen 6 en 8 | Telefoonnummer noteren; adressen op papier | houden | Voorbereiding; Samen voorbereid noemt de uitval van netwerken al |
| Wat je doet als een plek dicht is | "Probeer de eigenaar te bereiken" | houden | Kan ter plaatse; Oekraïne |
| Wat je meeneemt | "gsm en lader of powerbank" (Zweden, Finland) | houden | Meeneemlijsten uit de bron |
| Hoe buurlanden het regelen | Apps en websites (Gdzie się ukryć, lt72.lt) | houden | Beschrijving van buitenlandse systemen, geen handeling tijdens de crisis; de Poolse app werkt offline |

#### gidsen/schuilen-per-dreiging.md

Samenvatting: Radio op batterijen en omroepwagens staan nu voor BE-Alert, websites en sociale media. Elke 112-stap kreeg een korte "Lukt bellen niet" met een verwijzing naar Noodnummers. Apps, sms, 1722 en de huisarts staan er nu bij met "als het netwerk werkt". Familie verwittigen steunt nu op een vooraf afgesproken plek.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Hoe je deze gids gebruikt, stap 3 | "Volg de instructies via BE-Alert, radio, tv, websites, sociale media" | herschreven | Eerst radio op batterijen en omroepwagens, dan BE-Alert, websites, sociale media als het netwerk werkt; Crisiscentrum Schuilen (kanalen met omroepwagens), Samen voorbereid (radio) |
| Hoe je deze gids gebruikt | (nieuw) | aangevuld met offline alternatief | Alinea over 112 als het netwerk uitvalt, met de kaart in de app (Dichtstbij); blok A kort; 112.be FAQ, FOD Economie |
| Luchtaanval > Hoe lang | "gsm en lader of powerbank" (Zweedse lijst) | houden | Wat je meeneemt, geen handeling met netwerk |
| Luchtaanval > Drones | "Bel 112 als je een drone ziet ..." | aangevuld met offline alternatief | korte vorm blok A; 112.be, FOD Economie |
| Explosie > Volgorde | "bel niet onderweg (Ready.gov)" | houden | Raadt bellen juist af |
| Explosie > Wat je meteen doet | "Spreek andere mensen aan ... of bel 112"; "ga naar een veilige plaats en bel 112" | aangevuld met offline alternatief | Aanspreken stond al eerst; korte vorm blok A toegevoegd |
| Explosie > Hoe lang | "Laat je familie weten ... via sms of sociale media" | herschreven | "Werkt het netwerk" + vooraf ontmoetingsplek afspreken; Crisiscentrum Verstoring digitale infrastructuur. Instructies "op de radio" |
| Radioactieve neerslag > Per plek | "Open terrein zonder gebouwen: Bel 112" | aangevuld met offline alternatief | Crisiscentrum Schuilen, onderweg: ga verder weg tot je een veilig en toegankelijk gebouw vindt |
| Radioactieve neerslag > Auto | "luister naar de radio" | houden | Al offline |
| Chemische wolk > Hoe lang | "Gebruik sms of internet in plaats van te bellen" | herschreven | "Luister naar de radio"; sms/internet alleen als het netwerk werkt; bron ongewijzigd |
| Overstroming > Voorbereiden | "Finland: gsm opladen" | houden | Voorbereiding |
| Storm > Hoe lang | "Voor niet-dringende hulp: 1722 of 1722.be" | herschreven | "Werkt het netwerk, gebruik dan ..." |
| Natuurbrand > Volgorde 1 | "bel 112 als je brand ziet" | aangevuld met offline alternatief | korte vorm; 112.be, FOD Economie |
| Natuurbrand > Volgorde 4 | "bel 112 en geef je locatie; lichten aan" | houden | Lichten aan is al offline (Ready.gov) |
| Natuurbrand > Wat je meteen doet | "Gebruik de app 112 als dat kan" | herschreven | "Werkt het netwerk, gebruik dan ook de app 112" |
| Natuurbrand > Wat je meteen doet | "Geen gsm of bereik: evacueer en spreek mensen aan" | houden | Al offline (Crisiscentrum); verwijzing naar Noodnummers toegevoegd |
| Aardbeving > Daarna | "Zit je vast: stuur een bericht, klop ..." | herschreven | Kloppen en fluitje eerst, bericht als het netwerk werkt; Ready.gov |
| Gewapend geweld > Alarmeren | "bel 112 of gebruik de app 112" | aangevuld met offline alternatief | App alleen als het netwerk werkt; korte vorm blok A |
| Gewapend geweld > Veilige plaats | "Laat je familie weten ... via sms" | herschreven | Als het netwerk werkt; anders de vooraf afgesproken plek; Crisiscentrum Verstoring digitale infrastructuur |
| Gewapend geweld > Voorbereiden | "bel 101 bij verdacht voorwerp" | houden | Geen 112-stap; 101 is zelf het alternatief volgens 112.be |
| Hittegolf > Wat je doet | "Bel je huisarts ...; 112 enkel bij levensgevaar" | aangevuld met offline alternatief | Huisarts als het netwerk werkt; korte vorm blok A. Geen offline alternatief voor de huisarts gevonden in de bron |
| Tunnel bij brand | "Bel om hulp vanaf een noodtelefoon in de tunnel" | houden | Vaste noodtelefoon in de tunnel, Crisiscentrum |
| Kinderen | "Registreer het adres van de school ook in BE-Alert" | naar voorbereiding | "Registreer vooraf" |
| Kinderen | "Verwittig anderen via WhatsApp, Signal ..." | herschreven | Verwittig mensen in je omgeving; apps alleen als het netwerk werkt; Crisiscentrum Schuilen |

#### gidsen/schuilplek-in-huis.md

Samenvatting: Tijdens het schuilen komt de informatie nu eerst van de radio op batterijen en de omroepwagens; BE-Alert en websites gelden als het netwerk werkt. Bij de voorbereiding kwamen een afspraak met de buren voor als er geen telefoon is en een papieren lijst met nummers.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Waarom je de plek vooraf kiest | (nieuw) | aangevuld met offline alternatief | Met buren afspreken hoe je elkaar bereikt zonder telefoon of internet; Samen voorbereid |
| Wat je klaarlegt > Basis | Radio op batterijen | houden | Uitleg toegevoegd: zonder stroom kunnen internet en gsm uitvallen; Samen voorbereid |
| Wat je klaarlegt > Basis | (nieuw) | aangevuld met offline alternatief | Papieren lijst met belangrijke telefoonnummers; Samen voorbereid |
| Wat je klaarlegt > Basis | "opgeladen powerbank" | houden | Bronlijst Crisiscentrum |
| Gedrag tijdens het schuilen | "Volg de instructies via radio, tv, BE-Alert en officiële websites" | herschreven | Radio op batterijen en omroepwagens eerst, BE-Alert en websites als het netwerk werkt; Crisiscentrum Schuilen, Samen voorbereid (bron toegevoegd aan de bronregel) |
| Gedrag tijdens het schuilen | "Bel niet onnodig" | houden | Nucleair risico |
| Gedrag tijdens het schuilen | "Kun je de ruimte niet zelfstandig verlaten, zeg het tegen je buren" | houden | Al offline (Oekraïne) |
| Waarom je vooraf kiest | "archiefversie op de website van het Tsjechische ministerie" | houden | Bronvermelding, geen handeling |

#### gidsen/signalen-en-noodcodes.md

Samenvatting: De gids begint nu als gids voor zonder netwerk: eerst mensen in de buurt aanspreken en iemand hulp laten halen, dan signalen; bellen met 112 of de app staat als laatste rij ("Je hebt toch bereik"). De waarschuwingskanalen zijn herschikt: eerst wat zonder stroom of netwerk werkt (radio, politie, deur aan deur, borden), daarna BE-Alert, tv en sociale media als het netwerk werkt. Bij het briefje komen buren verwittigen en een vooraf afgesproken ontmoetingsplaats; contact via telefoon alleen als het netwerk werkt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "... sirenes en BE-Alert ..." | herschreven | "hoe je gewaarschuwd wordt zonder netwerk" |
| frontmatter bronnen | 21 bronnen | aangevuld met offline alternatief | 5 toegevoegd, alle al in het register: FOD Economie, Crisiscentrum Informatie tijdens een noodsituatie, Samen voorbereid, Verstoring van de digitale infrastructuur, Evacueren |
| Eerst, kop | "## Eerst: kun je bellen?" | herschreven | "## Eerst: hulp vragen zonder netwerk" |
| Eerst, inleiding | "Een telefoon of de app 112 BE is altijd de beste keuze." | herschreven | gids voor wie niet kan bellen; eerst mensen in de buurt aanspreken en iemand hulp laten halen (FOD Economie: "vraag hulp in uw buurt"; NPS: twee of meer mensen sturen); verwijzing naar Noodoproep, Als bellen helemaal niet lukt, voor dorp of stad; daarna "Werkt je telefoon toch, bel dan 112 of gebruik de app" |
| Eerst, tabel rij "Je hebt bereik" | eerste rij | herschreven | naar de laatste rij als "Je hebt toch bereik", met noodoplossing "Antwoordt 112 niet: zie de gids Noodoproep" |
| Eerst, tabel rij "Geen bereik, iemand in de buurt" | "Iemand naar een plek met bereik sturen" | aangevuld met offline alternatief | "Iemand hulp laten halen of naar een plek met bereik sturen"; NPS Outdoor Emergency Plan |
| Alpiene noodsignaal | "als je geen telefoonverbinding hebt" | houden | beschrijft al de situatie zonder netwerk; DAV |
| Spiegel en licht, piloten tot 160 km | | houden | geen netwerk nodig |
| Grond-luchtsignalen | "aandacht trekken: radio, licht, rook" | houden | radio als signaalmiddel; FM 21-76 |
| Helikopter landen, Rega 100 m | | houden | geen netwerk nodig |
| Sirenes en BE-Alert, kanalen | "Via BE-Alert (sms, ...), radio en tv, sociale media, deur aan deur, luidsprekers van de politie" | herschreven | eerst zonder stroom of netwerk: radio op batterijen, opwindradio of autoradio, luidsprekers en omroepwagens van de politie, deur aan deur, informatieborden en folders; daarna "Werkt het netwerk": BE-Alert, tv, sociale media (blok C); BE-Alert, Crisiscentrum Informatie tijdens een noodsituatie, Samen voorbereid, FOD Economie |
| Sirenes en BE-Alert, inschrijven | "Inschrijven bij BE-Alert is gratis." | naar voorbereiding | nieuw "Vooraf": radio op batterijen of opwindradio met DAB+ en FM (Samen voorbereid), inschrijven bij BE-Alert |
| Testberichten | "een link of infonummer" | houden | beschrijving van het testbericht, geen handeling |
| Sirene in Nederland | "volg het nieuws" | houden | Nederlands advies, als zodanig benoemd |
| Markeringen en geluidssignalen reddingsteams | | houden | geen netwerk nodig; INSARAG |
| Briefje, evacuatie | "Contacteer als je tijd hebt ook je contactpersoon ... Laat familie en vrienden weten ..." | herschreven | briefje eerst; nieuw: buren helpen verwittigen (Crisiscentrum Evacueren); contact met contactpersoon en familie alleen "Werkt het netwerk en heb je tijd" (Ready.gov) |
| Briefje, vooraf afspreken | (geen) | naar voorbereiding | ontmoetingsplaats met familie als jullie elkaar niet bereiken; Crisiscentrum Verstoring van de digitale infrastructuur |
| Mayday en pan-pan, marifoon | | houden | eigen radioverbinding, geen gsm-netwerk; BIPT, MCA |
| Noodfrequenties, B-EARS | | houden | IARU, UBA |
| Per persoon | fluit, lamp, groep blijft samen, twee of meer sturen | houden | al offline; NPS |
| datum | "2026-11-17" | herschreven | "2026-11-18" |

Geen nieuwe bronnen buiten het register gebruikt.

#### gidsen/voedsel-zonder-stroom.md

Samenvatting: Eén zin aangepast: recepten van het Voedingscentrum vooraf printen of opschrijven, omdat je ze zonder internet niet meer kunt opzoeken. Daarnaast Ready.gov: Water toegevoegd aan de frontmatter. Die bron stond al in een bronregel, maar ontbrak in de lijst.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Koken > brandstof sparen | "Denk vooruit verwijst naar het Voedingscentrum; print ze of schrijf ze op" | naar voorbereiding | "vooraf" expliciet (Denk vooruit: "Print deze uit of schrijf ze op") |
| Koken > BBK-noodkookboek | noodkookboek met recepten zonder stroom | houden | publicatie; voorbereiding |
| Tijdens > droogijs | "Weet vooraf waar je droogijs kunt krijgen" | houden | al voorbereiding |
| Babyvoeding (r. 275) | borstvoeding: meer water (Ready.gov) | houden | treffer op "Ready.gov", geen netwerkafhankelijkheid |
| Babyvoeding > kookadvies | kookadvies De Watergroep | houden | |
| frontmatter | Ready.gov: Water ontbrak | houden | bron toegevoegd aan de frontmatter, inhoud ongewijzigd |

#### gidsen/warmte-en-koelte.md

Samenvatting: Bij kou staat nu het Belgische advies (Rode Kruis: in één ruimte blijven; FOD Economie: informatie- en onthaalpunt, radio, hulp in de buurt). Ook staat er nu dat je vooraf met buren afspreekt waar je samenkomt voor licht en warmte. Bij CO staat nu wat je doet als bellen niet lukt (blok B). De huisarts, de zorgverlener en het Antigifcentrum krijgen "als het netwerk werkt". Bij hitte staat er een plan met ziekenhuis of woonzorgcentrum voor wie stroomafhankelijk is.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| In één kamer leven | BBK, MCF, Crisiscentrum (licht en warmte delen) | aangevuld met offline alternatief | Rode Kruis-Vlaanderen: ramen en deuren dicht, één ruimte; vooraf met buren afspreken bij wie je terechtkunt (Crisiscentrum, noodpakket) |
| Naar een warme plek | "Vraag de lokale overheid welke warme of koele plekken open zijn" | herschreven | Ready.gov benoemd als buitenlands; Belgisch: informatie- en onthaalpunt, vooraf vragen, tijdens radio of hulp in de buurt (FOD Economie) |
| CO > stap 2 (r. 176) | "Bel meteen de hulpdiensten." | aangevuld met offline alternatief | "of laat iemand bellen"; verwijzing naar Noodnummers, Als bellen niet lukt |
| CO > stap 4 (r. 178) | "bel 112 en zeg dat het vermoedelijk om CO gaat" | houden | met de nieuwe alinea "Lukt bellen niet" eronder (blok B: ERC 2021, IFRC 2020, 112.be) |
| CO > stap 5 (r. 179) | "bel de huisarts" | aangevuld met offline alternatief | "als het netwerk werkt"; alinea "Lukt bellen niet" geldt ook hier |
| CO > Antigifcentrum | "24 uur op 24 bereikbaar op 070 245 245" | naar voorbereiding | "als het netwerk werkt", nummer vooraf noteren; nummer ongewijzigd |
| Hitte > KMI | "Volg de weersvoorspelling van het KMI" | aangevuld met offline alternatief | "bijvoorbeeld via radio of tv" (Crisiscentrum Hittegolf) |
| Hitte > huisarts vooraf | huisarts en apotheker naar risico's vragen | houden | voorbereiding |
| Hitteziekte > hittekrampen (r. 273) | "bel je zorgverlener als het erger wordt" | aangevuld met offline alternatief | "als het netwerk werkt" |
| Hitteziekte > hitteberoerte (r. 275) | "bel 112 of breng de persoon naar een ziekenhuis" | houden | Ready.gov geeft zelf het offline alternatief |
| Hitteziekte > Crisiscentrum (r. 277) | "bel je huisarts. Bel 112 alleen bij levensbedreigende situatie" | aangevuld met offline alternatief | korte vorm blok A (FOD Economie, 112.be); hitteberoerte: naar een ziekenhuis (Ready.gov) |
| Hitte per persoon > medische toestellen | voorrang bij energieleverancier (Ready.gov) | aangevuld met offline alternatief | vooraf plan met ziekenhuis of woonzorgcentrum als je niet thuis kunt blijven (Ready.gov, People with Disabilities) |
| Hitte per persoon > na de hitte (r. 291) | "raadpleeg je huisarts" | houden | na de crisis |

#### gidsen/water.md

Samenvatting: Vier plaatsen waar je "de overheid volgt" of "contact opneemt" zeggen nu hoe dat zonder netwerk gaat: radio en de andere kanalen van de overheid (blok C). Het kookadvies volg je via de radio, en als het netwerk werkt ook via BE-Alert en websites. De gezondheidsdienst contacteer je als het netwerk werkt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Rond huis > water van de overheid | flessen verdelen, watertanks | aangevuld met offline alternatief | waar en wanneer via radio, omroepwagens, informatieborden, folders, deur-aan-deur (Crisiscentrum Informatie tijdens een noodsituatie, Samen voorbereid) |
| Koken > kookadvies | "volg altijd het kookadvies van je drinkwatermaatschappij" | aangevuld met offline alternatief | radio eerst; "werkt het netwerk" BE-Alert en officiële websites (Crisiscentrum) |
| Chemische vervuiling > CDC | "neem contact op met de gezondheidsdienst" | aangevuld met offline alternatief | "als het netwerk werkt" |
| Chemische vervuiling > instructies overheid | "volg de instructies van de overheid" | aangevuld met offline alternatief | via radio, tv, omroepwagens van de politie (Crisiscentrum) |
| Na de onderbreking > overstroming | "luister naar de aanbevelingen van de overheid" | aangevuld met offline alternatief | "bijvoorbeeld via een radio op batterijen" (Crisiscentrum) |
| Hoeveelheden, opslag, zuiveren | geen netwerkafhankelijkheid | houden | getallen ongewijzigd |

#### gidsen/weer-en-terrein.md

Samenvatting: Nieuw kader "Hoe je de waarschuwingen krijgt": radio eerst, KMI-website en app als het internet werkt, en zelf het weer lezen. 1722, Waterinfo, kustweerbericht.be en de KMI-app staan nu als "als het netwerk werkt" of als voorbereiding; getijtafels vooraf opzoeken; 112 kreeg telkens een korte terugvaloptie.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Waarschuwingscodes | (geen kanaal genoemd) | aangevuld met offline alternatief | radio eerst (Crisiscentrum Wind en storm: "via radio, tv, de website of app van het KMI"), radio op batterijen of autoradio (brochure Samen voorbereid, FOD Economie), KMI-website en app als het internet werkt, zelf wolken en donder lezen |
| Waarschuwingscodes | "gebruik het e-loket 1722.be of bel 1722. Bel 112 alleen bij levensgevaar" | aangevuld met offline alternatief | 1722 "als het netwerk werkt" en "als dat nummer actief is" (Crisiscentrum Wind en storm); bij 112 korte vorm: buren of omstanders laten bellen, hulp in je buurt, verwijzing naar Noodnummers (112.be, FOD Economie) |
| Wolken en onweer lezen | inleiding | herschreven | zin toegevoegd dat je buiten of zonder radio en internet zelf op tekens in de lucht let; inhoud ongewijzigd (KMI) |
| Storm en wind | "Hou de weersvoorspelling in het oog" / "Volg het weerbericht" | herschreven | "bijvoorbeeld via de radio, tv, of de website of app van het KMI"; "Luister naar het weerbericht en volg de aanbevelingen"; Crisiscentrum Wind en storm |
| Overstromingsgevoelige plekken | Watertoets-kaart, Waterinfo | naar voorbereiding | vooraf opzoeken als het internet werkt; Waterinfo tijdens hoogwater "zolang het internet werkt", anders radio |
| Kust en getijden | kustweerbericht.be, Getijtafels Kust | naar voorbereiding | getijtafels vooraf opzoeken of afdrukken; kustweerbericht.be "als het internet werkt" |
| Rivieren oversteken | "bel 112" | aangevuld met offline alternatief | "of laat iemand bellen"; anders iemand hulp laten halen; NPS toegevoegd |
| Sneeuw en gladheid | "Volg het weerbericht" | herschreven | "Luister naar het weerbericht" (Crisiscentrum Sneeuw) |
| Sneeuw en gladheid | "Meld gladheid via de app van het KMI" | houden | "Werkt het netwerk" toegevoegd |
| Bergen en sneeuw | Rega 1414, app, nummers in telefoon opslaan | houden | buitenlandse nummers ongewijzigd; alpien noodsignaal zonder bereik stond er al; toegevoegd: twee of meer mensen sturen bij een gewonde (NPS) |
| Per plek > Thuis | "KMI-waarschuwingen volgen ... 1722" | herschreven | via de radio, of KMI als het netwerk werkt; 1722 als het netwerk werkt |
| Per plek > Aan de kust | "via kustweerbericht.be en de KMI" | herschreven | getijtafels vooraf, stormtij via de radio, websites als het netwerk werkt |
| Per plek > In de bergen | "Noodnummers opslaan" | houden | voorbereiding |

Niet bevestigd: of de openbare radio de KMI-waarschuwingen letterlijk uitzendt. De tekst zegt alleen wat het Crisiscentrum zegt: de weersvoorspelling volgen via radio en tv.

### Eerste hulp

#### eerstehulp/01-levensreddend-handelen.md

Samenvatting: Onderwerp 1 is nu de vaste plek voor hulp halen zonder telefoon: een uitgewerkt blok "Lukt bellen niet: hulp halen zonder telefoon" onder Bel 112 als (omstanders een taak geven, wat de loper meekrijgt, het slachtoffer alleen laten als het niet anders kan, verwijzing naar de reanimatieregel in onderwerp 2). De 112 BE-app staat er nu als "als het netwerk werkt", met installeren als voorbereiding.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "... 112 bellen, verdere eerste hulp." | herschreven | "hulp alarmeren (112 of iemand sturen)"; RKV-affiche Vier stappen spreekt van "Raadpleeg gespecialiseerde hulp" |
| Herkennen, vier stappen | "3. Raadpleeg gespecialiseerde hulp." | houden | letterlijk de RKV-affiche; niet telefoonafhankelijk |
| Wat doen, stap 7 | "roep luid om hulp. Duid iemand aan om te helpen." | aangevuld met offline alternatief | ook roepen als je alleen bent, iemand rechtstreeks aanspreken; G&W Hoe moet je reanimeren ("Duid iemand aan en vraag om je te helpen. Als je alleen bent, roep je luid om hulp") |
| Wat doen, stap 10 | "Bel 112 ... luidspreker ... De operator helpt je bij de verdere stappen." | aangevuld met offline alternatief | luidspreker gehouden; operatorbegeleiding alleen "als de verbinding werkt"; lukt bellen niet: iemand sturen met dezelfde informatie, verwijzing naar Bel 112 als; RKV, G&W Bewusteloosheid, IFRC 2020 p. 136 |
| Wat doen, stap 16 | "bel 112 eerst om de ernst te melden en bel opnieuw" | aangevuld met offline alternatief | zonder telefoon: tel de slachtoffers en geef het aantal mee aan de loper; IFRC 2020 p. 403 |
| Als hulp lang, "via telefoon of radio" | "Soms kan je onder begeleiding van een arts ... via telefoon of radio." | houden | voorwaardelijk geformuleerd, IFRC 2020 |
| Als hulp lang, loper | "geef die persoon dan nauwkeurige informatie mee" | houden | verwijzing naar Bel 112 als toegevoegd; IFRC 2020 |
| Als hulp lang, nieuw | (niet aanwezig) | aangevuld met offline alternatief | andere medische hulp dan de ziekenwagen (veldhospitaal, plaatselijke zorgverlener, Rode Kruis): IFRC 2020 p. 405; voorbereiding: weten waar de hulpdiensten zijn en hoe je ze bereikt, kaart in de app (knop Dichtstbij), signaal om hulp in afgelegen gebied (gids Signalen en noodcodes): IFRC 2020 p. 50, 101 |
| Als hulp lang, 112 BE-app | "Is 112 niet bereikbaar ... de 112 BE-app laat je ... oproepen" | naar voorbereiding | verplaatst naar Bel 112 als, Lukt bellen niet: "Werkt het netwerk ... Installeer de app vooraf"; "112 is gratis in heel Europa" verhuisd naar de alinea onder de lijst; 112.be. Bron 112.be uit de bronregel van Als hulp lang gehaald |
| Bel 112 als | lijst en "112 ... 101 ... stormschade" | houden | G&W Bewusteloosheid, 112.be |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok A + B, uitgewerkt: ander toestel, verplaatsen, 101 (112.be FAQ); bij het slachtoffer blijven en alleen laten als het niet anders kan (ERC 2021 First aid p. 272, FEMA p. 42); niet wachten, omstander aanwijzen, taken (IFRC 2020 p. 101, 136-137, 403-405; FEMA p. 26; G&W); loperinformatie waar, wat, hoeveel, toestand (blok B; FEMA p. 27, RKV "Waar? Wat? Wie?"); bellen van een andere plek melden (112.be Hoe bel ik); alleen weg: eerst zijligging (onderwerp 5), reanimatieregel (onderwerp 2); België "vraag hulp in je buurt" (FOD Economie), Duitsland BBK, Nederland Inspecties 2019, kaart knop Dichtstbij |
| Niet doen | "Wacht niet om te helpen omdat niemand anders iets doet." | houden | IFRC 2020 |

Niet bevestigd en daarom niet opgenomen: een vaste "boodschap voor de loper" als formulier (geen bron); een tweede loper bij meerdere slachtoffers (eigen koppeling op IFRC p. 101); dat de 112 BE-app zonder datanetwerk werkt of niet (niet nagegaan, daarom alleen "als het netwerk werkt").

#### eerstehulp/02-reanimatie-en-aed.md

Samenvatting: De ERC-regel voor wie alleen is zonder telefoon staat nu in Wat doen en in Bel 112 als (volwassene: eerst hulp alarmeren, dan reanimeren; kind: eerst 1 minuut reanimeren, dan hulp halen, ERC 2021). Begeleiding door de operator is overal "als de verbinding werkt"; blok B toegevoegd met taakverdeling bij twee helpers.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "bel 112, druk 30 keer ..." | herschreven | "laat 112 bellen of hulp halen" |
| Wat doen, Volwassene stap 4 | "Bel 112 ... luidspreker. ... de operator geeft telefonische instructies." | aangevuld met offline alternatief | luidspreker gehouden; operator "als de verbinding werkt"; lukt bellen niet: iemand sturen; alleen zonder werkende telefoon: eerst alarmeren, terugkomen, dan reanimeren; ERC 2021 BLS p. 99 en 104 |
| Wat doen, Volwassene stap 7 en 12 | "100 tot 120 keer per minuut" (treffer op "min") | houden | geen telefoonverwijzing |
| Wat doen, Met twee helpers stap 1 | "instructies aan de andere helper: 112 bellen en de AED halen" | aangevuld met offline alternatief | "of hulp gaan halen als bellen niet lukt"; IFRC 2020 p. 137, ERC 2021 PLS p. 337, CRB BEPS 2024 p. 3 |
| Wat doen, Kind stap 4 | "reanimeer dan eerst 1 minuut en bel daarna" | aangevuld met offline alternatief | "of ga dan hulp halen"; ERC 2021 PLS p. 328 en 335 ("perform 1 min of CPR before leaving the child") |
| Wat doen, Kind stap 6 | "100 tot 120 per minuut" (treffer) | houden | geen telefoonverwijzing |
| Wat doen, Kind stap 8 | "De operator kan je daarbij begeleiden." | aangevuld met offline alternatief | "Werkt de verbinding, dan ..." |
| Bel 112 als | lijst | houden | G&W Reanimatie, IFRC 2020 |
| Bel 112 als, slotzin | "Bel met de luidspreker aan ... De operator kan je stap voor stap begeleiden." | aangevuld met offline alternatief | luidspreker gehouden; operator "als de verbinding werkt", anders de stappen van de pagina volgen |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B met reanimatieregel; twee helpers: de ene reanimeert, de andere haalt hulp en een AED (ERC 2021 PLS p. 337, IFRC 2020 p. 137); alleen: geen AED halen tenzij vlakbij en zichtbaar (ERC 2021 BLS-poster, IFRC 2020 p. 158, G&W) |
| Als hulp lang, steun voor helpers | "Praat erover en zoek hulp als je het moeilijk hebt." | houden | geen hulplijn genoemd; ERC 2025 |

Niet bevestigd: of ERC 2025 de regel van 1 minuut voor kinderen behoudt (volledige tekst gaf HTTP 403); daarom vermeld als ERC 2021. Verdrinking: geen regel gevonden, niets toegevoegd.

#### eerstehulp/03-ernstige-bloeding.md

Samenvatting: "Bel 112" aangevuld met laten bellen en, als bellen niet lukt, iemand sturen terwijl je blijft drukken; blok B toegevoegd onder Bel 112 als.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat doen, stap 4 | "Bel 112. Ben je alleen, bel dan met de luidspreker aan terwijl je drukt." | aangevuld met offline alternatief | luidspreker gehouden; "of laat iemand bellen"; lukt bellen niet: iemand sturen en zelf blijven drukken (stap 11 van de G&W-richtlijn); blok B |
| Wat doen, voorwerp in de wonde, stap 3 | "Verwittig zo snel mogelijk de hulpdiensten." | aangevuld met offline alternatief | "bel 112 of laat iemand hulp halen" |
| Als hulp lang, loper | "geef die persoon dan nauwkeurige informatie mee" | houden | verwijst naar onderwerp 1; IFRC 2020 |
| Bel 112 als | lijst en uitleg | houden | G&W, IFRC, Indiana DHS |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; ERC 2021 First aid p. 272, 112.be FAQ, IFRC 2020 |

#### eerstehulp/04-verslikking.md

Samenvatting: De drie "Bel 112"-stappen zijn aangevuld met laten bellen en iemand anders hulp laten halen; bij een kind dat zich ernstig verslikt blijf je bij het kind (ERC 2021 PLS). Blok B toegevoegd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat doen, ernstige verslikking volwassene of kind, stap 1 | "Bel 112 of laat bellen, of doe dat zodra de eerste reeks niet helpt." | aangevuld met offline alternatief | lukt bellen niet: iemand anders hulp laten halen; blok B |
| Wat doen, baby, stap 4 | "Bel 112 als de borststoten niet helpen." | aangevuld met offline alternatief | "of laat bellen"; lukt bellen niet: iemand anders laten gaan en bij de baby blijven; ERC 2021 PLS p. 335 ("Do not leave the child") |
| Wat doen, bewusteloos, stap 2 | "Bel 112 als dat nog niet gebeurd is." | aangevuld met offline alternatief | "of laat bellen"; verwijzing naar Bel 112 als en onderwerp 2 (regel alleen zonder telefoon) |
| Als hulp lang, arts | "Laat de persoon zo snel als het kan door een arts onderzoeken" | houden | niet telefoonafhankelijk; IFRC, CRB |
| Bel 112 als | lijst | houden | G&W |
| Bel 112 als, arts en CRB | "Ga ook naar een arts ... medisch advies of een oproep naar 112" | houden | CRB BEPS 2024; naar een arts gaan kan zonder netwerk |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B plus "blijf bij het kind"; ERC 2021 First aid p. 272, ERC 2021 PLS p. 335, 112.be FAQ |

#### eerstehulp/05-bewusteloosheid-en-stabiele-zijligging.md

Samenvatting: Alarmeringsstappen aangevuld met iemand hulp laten halen als bellen niet lukt; de verwijzing naar de app en filmpjes is voorbereiding geworden; blok B uitgebreid met zijligging als je toch weg moet en taakverdeling bij twee.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "bel 112, leg hem in stabiele zijligging" | herschreven | "laat 112 bellen of hulp halen" |
| Wat doen, stap 3 | "laat 112 bellen, of bel zelf. Zeg ... je naam en het exacte adres." | aangevuld met offline alternatief | lukt bellen niet: iemand met die informatie hulp laten halen; G&W Bewusteloosheid |
| Wat doen, stap 4 | "Laat iemand 112 bellen ... Ben je alleen, bel dan zelf" | aangevuld met offline alternatief | verwijzing naar Bel 112 als |
| Wat doen, zijligging "alleen moet blijven omdat jij moet gaan alarmeren" | idem | houden | ERC 2021 First aid p. 272 toegevoegd aan de bronregel |
| Wat doen, app Eerste hulp | "toont de handgreep ... in de app Eerste hulp. Oefen hem in een cursus." | naar voorbereiding | "Oefen vooraf in een cursus ... Bekijk die voor er iets gebeurt." |
| Wat doen, flauwte stap 7 | "... en bel 112." | aangevuld met offline alternatief | "of laat bellen" |
| Bel 112 als | lijst, door te geven informatie, arts raadplegen | houden | G&W; een arts raadplegen is niet telefoonafhankelijk |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; moet je toch weg: eerst zijligging (ERC 2021 First aid p. 272, G&W, Niet doen van deze pagina); met twee: de ene bewaakt, de andere haalt hulp (G&W Bewusteloosheid "Iemand bewaakt het slachtoffer") |
| Niet doen | "Laat een bewusteloze persoon niet alleen, tenzij je moet gaan alarmeren." | houden | ERC, ResQ |

#### eerstehulp/06-shock.md

Samenvatting: "Bel 112" aangevuld met laten bellen en een verwijzing naar Bel 112 als; opnieuw melden aan 112 alleen als de telefoon werkt; blok B toegevoegd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "bel 112 en hou hem warm" | herschreven | "laat 112 bellen of hulp halen" |
| Wat doen, stap 4 | "Bel 112 onmiddellijk." | aangevuld met offline alternatief | "of laat iemand bellen. Lukt bellen niet, zie Bel 112 als." |
| Als hulp lang, laatste punt | "Verandert de toestand, meld dat dan opnieuw aan 112. Moet iemand om hulp gaan ..." | aangevuld met offline alternatief | "en werkt de telefoon"; de loperzin bleef; IFRC 2020 |
| Bel 112 als | lijst en uitleg | houden | G&W, IFRC |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; ERC 2021 First aid p. 272, 112.be FAQ |
| Niet doen | "Laat het slachtoffer niet alleen." | houden | consistent met blok B |

#### eerstehulp/07-brandwonden.md

Samenvatting: Elke "Bel 112" is "of laat bellen", met één verwijzing naar Bel 112 als in Wat doen; het Antigifcentrum blijft, als tweede stap "als de telefoon werkt"; blok B toegevoegd.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "Chemische en elektrische brandwonden: altijd 112." | herschreven | "altijd 112 bellen of hulp laten halen" |
| Wat doen, grote brandwonde (stap 8) | "Bel 112." | aangevuld met offline alternatief | "of laat bellen. Lukt bellen niet, zie Bel 112 als." |
| Wat doen, risico op shock stap 4 | "Bel 112 (zie onderwerp 6)." | aangevuld met offline alternatief | "of laat bellen" |
| Wat doen, chemische brandwonde stap 2 | "Bel 112. Bel daarna het Antigifcentrum op 070 245 245 ..." | aangevuld met offline alternatief | 112 of laten bellen; Antigifcentrum "werkt de telefoon"; nummer ongewijzigd; geen offline alternatief in de bron gevonden |
| Wat doen, elektrische brandwonde stap 2 | "Bel 112." | aangevuld met offline alternatief | "of laat bellen" |
| Als hulp lang | "zoek dan zo snel mogelijk medisch advies", "Bespreek dat met een arts zodra het kan" | houden | al uitgesteld geformuleerd; IFRC, G&W Tetanus |
| Bel 112 als, lijst | "ernstige symptomen ... toestand verslechtert" | houden | G&W |
| Bel 112 als, arts raadplegen | "Raadpleeg een arts bij ..." | houden | niet telefoonafhankelijk |
| Bel 112 als, Antigifcentrum | "Bel bij een chemisch product altijd ook het Antigifcentrum: 070 245 245." | aangevuld met offline alternatief | "Werkt de telefoon, ..."; antigifcentrum.be |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; ERC 2021 First aid p. 272, 112.be FAQ |
| Niet doen | "Bel het Antigifcentrum of 112." | aangevuld met offline alternatief | 112 eerst, verwijzing naar Bel 112 als |

#### eerstehulp/08-breuken-verstuikingen-en-ontwrichting.md

Samenvatting: "Bel 112" aangevuld met laten bellen en een verwijzing naar Bel 112 als; blok B toegevoegd. Zelf naar het ziekenhuis bij een gesloten breuk van arm, pols of hand bleef staan.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat doen, gesloten breuk stap 7 | "Bel 112 bij een breuk van been ... mag het slachtoffer zelf naar het ziekenhuis." | aangevuld met offline alternatief | "of laat bellen. Lukt bellen niet, zie Bel 112 als."; zelf naar het ziekenhuis gehouden (G&W Breuken) |
| Wat doen, open breuk stap 2 | "niet-verkleurend ontsmettingsmiddel" (treffer) | houden | geen telefoonverwijzing |
| Wat doen, open breuk stap 5 | "Bel 112." | aangevuld met offline alternatief | "of laat bellen" |
| Als hulp lang | spalken voor vervoer, "Zoek die zorg zodra het kan" | houden | IFRC 2020, G&W |
| Bel 112 als | lijst en "Ga naar een arts als ..." | houden | G&W, IFRC |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; ERC 2021 First aid p. 272, 112.be FAQ |

#### eerstehulp/09-hoofd-nek-en-rugletsel.md

Samenvatting: De drie "Bel 112"-stappen zijn "of laat bellen", met één verwijzing naar Bel 112 als; blok B toegevoegd. Geen zijligging-advies voor wie weg moet bij een wervelletsel, omdat de bronnen dat niet zeggen.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| frontmatter kort | "kantel het hoofd niet en bel 112" | herschreven | "laat 112 bellen of hulp halen" |
| Wat doen, wervelletsel stap 3 | "Bel 112." | aangevuld met offline alternatief | "of laat bellen. Lukt bellen niet, zie Bel 112 als." |
| Wat doen, bekkenbreuk stap 3 | "Bel 112." | aangevuld met offline alternatief | "of laat bellen" |
| Wat doen, hoofdwonde stap 5 | "ontsmettingsmiddel" (treffer) | houden | geen telefoonverwijzing |
| Wat doen, klap op het hoofd stap 3 | "bel 112" | aangevuld met offline alternatief | "of laat bellen" |
| Bel 112 als | lijst en "Raadpleeg een arts ..." | houden | G&W, IFRC |
| Bel 112 als, nieuw blok | (niet aanwezig) | aangevuld met offline alternatief | blok B; ERC 2021 First aid p. 272, 112.be FAQ |

#### eerstehulp/10-onderkoeling-en-bevriezing.md

Samenvatting: stap "Bel 112" kreeg "of laat iemand bellen" met verwijzing; onder Bel 112 als kwam blok B, aangepast aan onderkoeling (iemand anders laten blijven en warm houden, wind en regen tegenhouden). Kort-zin ongewijzigd (steunt niet op bellen).

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Wat doen > Onderkoeling, stap 11 | "Bel 112." | aangevuld met offline alternatief | "Bel 112 of laat iemand bellen. Lukt bellen niet, zie Bel 112 als."; blok B |
| Bel 112 als | lijst + "IFRC raadt aan medische hulp te vragen" | houden | voorwaarden blijven, bron G&W, IFRC |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B; slachtoffer niet alleen laten: ERC 2021 First aid p. 272, FEMA p. 42 (iemand anders laten blijven; natte kleding uit, iets tussen slachtoffer en grond, droge lagen, beschutting tegen wind); omstanders wind en regen laten tegenhouden met een zeil: IFRC 2020 p. 105; reanimatie alleen: verwijzing naar onderwerp 2; 112.be FAQ |
| Als hulp lang op zich laat wachten | "Laat iemand weten waar je naartoe gaat" | houden | voorbereiding, geen telefoon nodig; CDC |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, FEMA Until Help Arrives, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/11-oververhitting-en-hitteslag.md

Samenvatting: kort-zin en stap 3 kregen "of laat iemand bellen / hulp halen" met verwijzing; onder Bel 112 als kwam blok B met taken voor omstanders (koelen, schaduw) en "blijf koelen".

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "...meer dan 39 °C: bel 112." | herschreven | "bel 112 of laat hulp halen"; blok B |
| Herkennen | "39 °C als grens om 112 te bellen" | houden | feitelijke drempel uit G&W |
| Wat doen > Hitteslag, stap 3 | "Bel 112 bij de tekens van hitteslag." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Wat doen > Lichte oververhitting, stap 4 | "zoek dan medische hulp" | houden | niet telefoonafhankelijk |
| Bel 112 als | "Raadpleeg een arts als hittekrampen blijven aanhouden." | houden | niet acuut, G&W |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B; niet alleen laten in warme omgeving: G&W hitteslag + ERC 2021 First aid p. 272; omstanders helpen verzorgen en schaduw maken: IFRC 2020 p. 105, 405; blijven koelen met alles wat beschikbaar is: ERC 2025 leken (al in de tekst); 112.be FAQ |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/12-vergiftiging-en-co.md

Samenvatting: het Antigifcentrum (070 245 245) en de dokter van wacht (1733) blijven, nu met "werkt het netwerk"; elke "Bel 112" kreeg "of laat iemand bellen" en een verwijzing; onder Bel 112 als kwam blok B met wat je zonder telefoon doet: productinformatie meegeven, bij het slachtoffer in frisse lucht blijven, verpakkingen bewaren voor de hulpverleners. Kort-zin herschreven zodat ze niet alleen op bellen steunt.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "Bel het Antigifcentrum ... 112 ... Bij CO: eerst je eigen veiligheid." | herschreven | eigen veiligheid eerst; Antigifcentrum "werkt het netwerk"; "112 of laat hulp halen" |
| Wat doen > Ingeslikt, stap 3 | "Bel het Antigifcentrum op 070 245 245." | aangevuld met offline alternatief | "Werkt het netwerk, ..."; lukt bellen niet: stappen volgen en hulp halen. IFRC 2020 p. 259: "Access the poison control centre (or local equivalent) or EMS" |
| Wat doen > Ingeslikt, stap 4 | "Raak ze alleen aan als dat veilig is." | aangevuld | "Is het niet veilig, wacht dan op de hulpdiensten." IFRC 2020 p. 259 |
| Wat doen > Ingeslikt, stap 8-9 | "Bel 112." / "bel 112 en reanimeer" | aangevuld met offline alternatief | "of laat iemand bellen", verwijzing Bel 112 als |
| Wat doen > Ingeslikt, stap 10 | "Verzamel flessen ... geef ze aan de hulpdiensten." | houden | IFRC 2020 p. 258-259 |
| Wat doen > Ingeademd, stap 1 | "bel dan meteen 112 en wacht op een veilige afstand" | aangevuld met offline alternatief | "of laat iemand bellen"; lukt bellen niet: iemand hulp laten halen (blok B) |
| Wat doen > Ingeademd, stap 6 | "Bel het Antigifcentrum ..." | herschreven | "Werkt het netwerk, ..." |
| Wat doen > Ingeademd, stap 9 | "Bel 112." | aangevuld | "of laat iemand bellen" |
| Wat doen > CO, stap 2 | "Bel onmiddellijk 112." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Wat doen > Huid of ogen | "bel het Antigifcentrum" | herschreven | "Werkt het netwerk, bel dan ..." |
| Als hulp lang > dokter van wacht | "Het Antigifcentrum vermeldt ook de dokter van wacht: 1733." | herschreven | "Werkt het netwerk, dan kan je ook ... 1733" (nummer ongewijzigd) |
| Als hulp lang > noteren, verpakkingen bewaren | "Noteer wat er gebeurd is ... Bewaar verpakkingen" | houden | werkt zonder netwerk; IFRC 2020 |
| Bel 112 als > slotalinea | "Bel het Antigifcentrum (070 245 245) bij elke mogelijke vergiftiging ..." | herschreven | "Werkt het netwerk, bel dan ..." |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B; productnaam, aard en tijdstip van blootstelling doorgeven: IFRC 2020 p. 258 (bron bedoelt aan antigifcentrum of EMS; meegeven aan een loper is een koppeling zoals in blok B); bij het slachtoffer blijven in frisse lucht: ERC 2021 First aid p. 272, FEMA p. 42, IFRC (al in tekst); verpakkingen aan hulpverleners: IFRC 2020 p. 258-259. Niet opgenomen: "verpakking zelf meenemen naar het ziekenhuis" (G&W vergiftiging en IFRC zeggen dat niet; IFRC zegt: geef ze aan EMS) |
| Niet doen | "Wacht niet op klachten om het Antigifcentrum te bellen." | houden | Antigifcentrum |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, FEMA, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/13-elektrocutie.md

Samenvatting: alle "Bel 112"-stappen kregen "of laat iemand bellen" en een verwijzing; onder Bel 112 als kwam blok B met een taak voor omstanders (iedereen op 10 meter houden bij hoogspanning) en een AED laten halen. Kort-zin aangevuld.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "blijf minstens 10 meter weg en bel 112." | herschreven | "bel 112 of laat hulp halen" |
| Herkennen | "1000 volt", "230 volt" (treffer op getallen) | houden | geen telefoonverwijzing |
| Wat doen > Hoogspanning, stap 4 | "Bel 112 en laat de redding over aan de hulpdiensten." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Wat doen > Stap 2, punt 4 | "alarmeer 112" | aangevuld met offline alternatief | "of laat iemand alarmeren (lukt bellen niet, zie Bel 112 als)" |
| Wat doen > Stap 3 | "Bewusteloos: bel 112." / "Ernstige verwondingen of twijfel: bel 112." | aangevuld met offline alternatief | "of laat iemand bellen"; extra punt "Lukt bellen niet: zie Bel 112 als." |
| Wat doen > Stap 4, punt 1 | "Laat iemand een AED halen" | houden | G&W |
| Bel 112 als | "Raadpleeg een arts na een ongeval met laagspanning ..." | houden | niet acuut |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B; omstanders het gevaar laten bewaken: IFRC 2020 p. 403 ("support with hazards"), 10 meter uit G&W; AED laten halen: G&W, ERC; reanimatie alleen: verwijzing onderwerp 2; ERC 2021 First aid p. 272; 112.be FAQ |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/14-verdrinking.md

Samenvatting: "laat iemand 112 bellen" kreeg een alternatief (die persoon haalt hulp), "Bel 112 als dat nog niet gebeurd is" kreeg een verwijzing; onder Bel 112 als kwam blok B. Voor reanimeren alleen zonder telefoon verwijst de tekst naar onderwerp 2; er staat geen eigen regel voor verdrinking.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "Bel altijd 112." | herschreven | "Laat altijd 112 bellen of hulp halen." ERC 2025 leken p. 58 (roep om hulp, laat iemand anders alarmeren) |
| Wat doen > De redding, stap 1 | "Roep om hulp en laat iemand 112 bellen." | aangevuld met offline alternatief | "Lukt bellen niet, laat die persoon dan hulp halen (zie Bel 112 als)." ERC 2025 leken p. 58; blok B |
| Wat doen > Op de kant, stap 3 | "Bel 112 als dat nog niet gebeurd is." | aangevuld met offline alternatief | "of laat bellen ... Lukt bellen niet, zie Bel 112 als." |
| Bel 112 als | "laat meteen bellen", "bel altijd 112" | houden | voorwaarden, G&W en ERC |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B (ERC 2021 First aid p. 272, IFRC 2020, 112.be FAQ); AED laten halen: al in tekst; alleen zonder telefoon: verwijzing naar onderwerp 2 (ERC 2021 BLS en PLS). "Eerst 1 minuut reanimeren bij verdrinking" niet bevestigd (niet in ERC 2021, ERC 2025 leken, G&W verdrinking): niet opgenomen |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/15-allergische-reactie.md

Samenvatting: kort-zin en de 112-stappen kregen "of laat iemand bellen / hulp halen" met verwijzing; de huisarts in de buurt blijft; onder Bel 112 als kwam blok B; bij de voorbereiding kwam een IFRC-punt over jezelf helpen als je alleen bent.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "bel 112, help de persoon ..." | herschreven | "bel 112 of laat hulp halen" |
| Wat doen > Zware reactie, stap 3 | "Bel 112 en zeg dat het om een allergische reactie gaat." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Wat doen > Zware reactie, stap 4 | "Probeer ook een huisarts in de buurt te bereiken." | houden | G&W anafylactische shock; ook zonder netwerk zinvol |
| Wat doen > Steek in mond of keel, stap 1 | "Bel direct 112." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Als hulp lang | "probeer ... medische hulp te bereiken: 112 en een huisarts in de buurt" | houden | IFRC 2020 p. 281 (local adaptation) |
| Als hulp lang > voorbereiding | "Wie een allergie heeft, draagt ... allergiekaart" | aangevuld | "Denk vooraf na hoe je jezelf helpt als je alleen bent wanneer een reactie begint." IFRC 2020 p. 283 |
| Bel 112 als | "Raadpleeg een arts na een steek als ..." | houden | niet acuut, G&W |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B (ERC 2021 First aid p. 272, IFRC 2020, 112.be FAQ); lichte reactie kan op enkele minuten levensbedreigend worden: G&W (al in Herkennen); huisarts in de buurt: G&W; reanimatie alleen: verwijzing onderwerp 2 |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/16-beroerte-en-hartinfarct-herkennen.md

Samenvatting: 112-stappen kregen "of laat iemand bellen" met verwijzing; onder Bel 112 als kwam blok B (tijd telt, taken verdelen, bij hartaanval bij het slachtoffer blijven). Het punt over "richting ziekenhuis rijden en de ziekenwagen ontmoeten" (IFRC p. 177, hoofdstuk ademhalingsmoeilijkheden) is vervangen door de IFRC-passage over beroerte (p. 273): soms moet de helper het slachtoffer zelf naar een ziekenhuis brengen. Voor een hartaanval staat zelf vervoeren nergens; dat is niet opgenomen.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Frontmatter kort | "bel 112 en noteer het uur ... bel 112, ook als ..." | herschreven | eerste deel "bel 112 of laat hulp halen"; tweede deel gehouden (lengte) |
| Herkennen > FAST, T | "Bel 112." | aangevuld | "Bel 112 of laat bellen." |
| Wat doen > Beroerte, stap 2 | "Bel 112 zodra je de eerste klachten herkent." | aangevuld met offline alternatief | "of laat iemand bellen ... Lukt bellen niet, zie Bel 112 als." |
| Wat doen > Hartaanval, stap 1 | "Bel 112. Doe dat ook als ..." | aangevuld met offline alternatief | idem |
| Wat doen > Hartaanval, stap 9 | "meld dat dan aan 112" | herschreven | "aan 112 als de verbinding werkt, of aan de hulpverleners als ze aankomen"; IFRC 2020 p. 266 (update EMS) |
| Als hulp lang > rijden richting ziekenhuis | "In een afgelegen gebied ... ziekenwagen onderweg ontmoeten" | herschreven | bronpassage (IFRC p. 177) hoort bij ademhalingsmoeilijkheden, niet bij beroerte of hartaanval; vervangen door IFRC 2020 p. 273 (beroerte: "the first aid provider must transport the person to the medical facility by car, boat, or other means"; "fastest method"; "ensure it is safe to travel"), ook p. 274 en 278 ("get the person to a medical facility", "initiate transport"); plus kaart in de app (knop Dichtstbij) toont ziekenhuizen |
| Als hulp lang > angina | "112 soms niet nodig. Bel wel 112 als ..." | houden | IFRC 2020 p. 266 |
| Bel 112 als | voorwaarden | houden | G&W, IFRC |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B (ERC 2021 First aid p. 272, 112.be FAQ); tijd telt: G&W "telt elke minuut", IFRC p. 273; tijdstip begin klachten doorgeven: G&W (aan 112), hier ook aan de loper (koppeling zoals blok B); taken verdelen (hulp, in het oog houden, medicatie of AED halen): IFRC 2020 p. 266; bij hartaanval blijven tot er hulp is: ERC 2025 leken p. 58, G&W; beroerte zelf vervoeren: IFRC 2020 p. 273; IFRC 2020 p. 266 zegt bij hartaanval dat behandeling tijdens ambulancevervoer de uitkomst verbetert, dus geen advies om zelf te vervoeren |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

#### eerstehulp/17-wondverzorging-en-infectie.md

Samenvatting: onder Bel 112 als kwam blok B met verwijzing naar onderwerp 3 bij een ernstige bloeding; "Contacteer altijd een arts" bij een steekwonde werd "Laat een steekwonde altijd door een arts nakijken". De rest werkt al zonder netwerk.

| Plaats | Oorspronkelijk (kort) | Besluit | Toelichting en bron |
| --- | --- | --- | --- |
| Herkennen > sepsis | "ademhalingsmoeilijkheden" (treffer) | houden | geen telefoonverwijzing |
| Wat doen > Kleine wonde, stap 8 | "Weinig of geen water" (treffer) | houden | geen telefoonverwijzing |
| Wat doen > Steekwonde, stap 1 | "Contacteer altijd een arts." | herschreven | "Laat een steekwonde altijd door een arts nakijken."; G&W huidwonde/steekwonde ("Ga zo snel mogelijk naar een arts bij elke steekwonde", al in de tekst) |
| Wat doen > Steekwonde, stap 2 | "Verwittig zo snel mogelijk de hulpdiensten." | houden | niet telefoonafhankelijk geformuleerd; G&W |
| Wat doen > Bijtwonde, stap 4 | "Raadpleeg ... zo snel mogelijk een arts." | houden | G&W |
| Wat doen > Tetanus, stap 2 | "contacteer je huisarts" | houden | niet acuut; G&W tetanus |
| Als hulp lang | "Geen proper water: ontsmettingsmiddel" (treffer) | houden | geen telefoonverwijzing |
| Bel 112 als | voorwaarden, "Zoek meteen medische zorg", "Ga zo snel mogelijk naar een arts" | houden | werkt zonder netwerk; G&W, CDC |
| Bel 112 als > Lukt bellen niet | (nieuw) | aangevuld met offline alternatief | blok B (ERC 2021 First aid p. 272, IFRC 2020, 112.be FAQ); ernstige bloeding: blijf drukken en stuur iemand om hulp, zoals in onderwerp 3 |
| Frontmatter | bronnen | aangevuld | ERC 2021 First aid, 112.be FAQ; datum 2026-11-18 |

