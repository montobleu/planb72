# Schrijfwijzer PlanB72

Geldt voor alle inhoud in `site/src/content/`. Doel: de meest volledige, betrouwbare noodbibliotheek die bestaat, zonder ooit eigen advies te verzinnen.

## 1. Bronnen

- **Elke inhoudelijke bewering is terug te voeren op een officiële of erkende bron.** Sluit elke `##`-sectie af met een regel `Bron: [Naam](url)` (meerdere bronnen gescheiden door ` · `).
- Lees de bron zelf (open de pagina). Citeer nooit uit het geheugen. Kun je iets niet bevestigen, laat het weg.
- Volgorde van voorkeur:
  1. Belgische overheid: Nationaal Crisiscentrum (crisiscentrum.be), risico-info.be, FOD Volksgezondheid, FANC (fanc.fgov.be), Antigifcentrum (antigifcentrum.be), KMI (meteo.be), brandweer en civiele bescherming, Vlaamse en Waalse overheid.
  2. Erkende hulporganisaties: Rode Kruis-Vlaanderen (rodekruis.be), Croix-Rouge de Belgique, IFRC, European Resuscitation Council (cprguidelines.eu).
  3. Andere Europese overheden: Denk vooruit en rijksoverheid.nl, RIVM, BBK (bbk.bund.de), MCF Zweden (mcf.se), Finland (72tuntia.fi), BABS Zwitserland, NCTV.
  4. Internationaal: WHO, ECDC, IAEA, UNICEF, Sphere.
  5. Publiek domein (vrij over te nemen): Ready.gov, FEMA, CDC, NRC, US Army-handboeken.
- Wijkt een buitenlandse bron af van de Belgische, dan geldt de Belgische en vermeld je het verschil.
- **Nooit**: doseringen van geneesmiddelen (ook geen jodium), eigen berekeningen van stralingsdosis, telefoonnummers of adressen die je niet in de bron zag, merknamen, winkels.

## 2. Toon

- Zakelijk, feitelijk, rustig. Gebiedende wijs voor handelingen ("Sluit de ramen."), anders "je".
- Korte zinnen. Eén handeling per opsommingspunt. Concreet: hoeveel, hoe lang, waar, wat precies.
- Geen slogans, geen retorische vragen, geen emoji, geen uitroeptekens, geen "belangrijk!".
- Geen gedachtestreepjes als stijlmiddel. Gebruik een punt of een dubbele punt.
- Leg het waarom kort uit als dat helpt om het juiste te doen ("Sluit de ventilatie: zo komt buitenlucht niet binnen.").

## 3. Realisme

PlanB72 is er voor het moment waarop niets meer werkt. Schrijf voor die situatie, niet voor een gewone dag.

1. **Ga ervan uit dat stroom, gsm, vaste lijn en internet uitgevallen kunnen zijn.** Elke handeling moet dan nog uitvoerbaar zijn. Een stap die alleen werkt met een telefoon, een app of een website is geen stap, maar een tweede keuze.
2. **Zet eerst wat je ter plaatse en zonder netwerk kunt doen**: zelf handelen, buren en omstanders aanspreken, iemand sturen, je fysiek melden bij de dichtstbijzijnde brandweerkazerne, het politiekantoor, het gemeentehuis, de spoedgevallendienst of een opvang- of noodsteunpunt (de offline kaart en de knop Dichtstbij in de app tonen die), een hulpvoertuig aanhouden, de radio op batterijen, signalen, een briefje achterlaten, het afgesproken ontmoetingspunt. Elk van die alternatieven alleen als een bron het zegt (zie punt 4 en 6).
3. **Telefoonnummers, apps en websites mogen blijven, maar als tweede stap** en uitdrukkelijk "als het netwerk werkt", of als voorbereiding: vooraf noteren, afdrukken, downloaden. Schrijf dus niet "kijk op de website van je gemeente" als handeling tijdens de crisis, maar "luister naar de radio; werkt het internet, kijk dan ook op ...".
4. **112 blijft altijd vermeld, met meteen erbij wat je doet als bellen niet lukt.** Gebruik de volgorde van de bronnen: probeer een ander toestel of een andere plek, of laat buren of omstanders bellen; kun je bellen maar is 112 onbereikbaar, probeer 101 (112.be); werkt bellen helemaal niet, vraag hulp in je buurt en volg de overheidsinformatie op de radio, en ga naar het informatie- en onthaalpunt van de gemeente als dat er is (FOD Economie). Laat een slachtoffer alleen als het niet anders kan en stuur iemand om hulp (ERC, IFRC). Buitenlands advies (Duitsland: politiebureau of ziekenhuis; Nederland 2019: brandweerkazerne of politiebureau) mag erna, benoemd als buitenlands. Geen enkele Belgische bron wijst een kazerne of commissariaat aan als meldpunt: schrijf dat dus niet als Belgisch advies. De volledige tekst staat op de app-pagina Noodnummers onder "Als bellen niet lukt"; verwijs daarheen in plaats van het blok overal te herhalen.
5. **Hulplijnen horen niet in de acute stappen.** Tele-Onthaal, de Zelfmoordlijn, Child Focus, Awel en dergelijke staan alleen in een apart onderdeel met de kop "Na de crisis, als de telefoon weer werkt". Mentale steun tijdens een crisis is wat mensen ter plaatse voor elkaar kunnen doen: psychologische eerste hulp volgens WHO, IFRC en Rode Kruis (veiligheid en rust, luisteren, praktische hulp, samen blijven, kinderen bij hun ouders, rouw, wie erg overstuur is niet alleen laten).
6. **Ook de offline alternatieven komen uit bronnen.** Wat een officiële bron niet zegt, schrijf je niet. Kun je een offline alternatief niet bevestigen, laat het dan weg en vermeld alleen wat wel bevestigd is.

Welke bronnen wat zeggen over hulp zonder netwerk, staat in `docs/audit-realisme.md`.

## 4. Volledigheid: geef opties

Geef niet één antwoord maar de **mogelijkheden in volgorde van voorkeur**, met de omstandigheden waarin elke optie past:

- **Beste keuze → goede keuze → noodoplossing**, met waarom.
- Per **plek**: thuis (appartement, huis met kelder, huis zonder kelder), op het werk, op school, onderweg te voet, in de auto, in het openbaar vervoer, buiten in open terrein.
- Per **persoon**: kinderen en baby's, zwangeren, ouderen, mensen met een beperking of chronische ziekte, mensen die afhankelijk zijn van stroom (zuurstof, dialyse), huisdieren en vee.
- Per **fase**: voorbereiden, eerste minuten, eerste uren, eerste dagen, daarna.
- Vermeld wat je doet als de eerste keuze niet kan.

## 5. Opbouw van een scenariokaart (`scenarios/*.md`)

Frontmatter blijft zoals nu (`titel`, `volgorde`, `kort`, `stappen`, `niet`, `status: concept`, `datum`, `bronnen`). `stappen` is de samenvatting voor het eerste scherm (5 tot 7 punten).

Daarna de tekst, met precies deze `##`-koppen in deze volgorde (laat een kop weg als ze niet van toepassing is):

```
## Herkennen
## Voorbereiden
## Tijdens
### Thuis
### Buiten of onderweg
### In de auto
### Op het werk of op school
### Kinderen
### Kwetsbare personen
### Huisdieren en dieren
## Daarna
## Niet doen
## Meer informatie
```

Richtlengte: 900 tot 1.800 woorden.

## 6. Opbouw van een gids (`gidsen/*.md`)

Frontmatter: `titel`, `module`, `volgorde`, `kort`, `status: concept`, `datum`, `bronnen`. Vrije `##`-structuur, tabellen toegestaan (Markdown). Richtlengte: 1.500 tot 3.500 woorden.

## 7. Opbouw van eerste hulp (`eerstehulp/*.md`)

Frontmatter: `titel`, `volgorde`, `kort`, `status: concept`, `datum`, `bronnen`. Koppen:

```
## Herkennen
## Wat doen
## Als hulp lang op zich laat wachten
## Bel 112 als
## Niet doen
```

`## Bel 112 als` eindigt met een alinea **Lukt bellen niet** (zie § 3): wie hulp haalt en wat die meekrijgt, en of je het slachtoffer alleen mag laten.

`## Wat doen` is een genummerde lijst. Geen doseringen. Richtlengte: 500 tot 1.200 woorden.

## 8. Nazicht

Alle nieuwe inhoud krijgt `status: concept`. Pas na goedkeuring door een deskundige wordt dat `nagekeken`, met `nagekeken_door`.
