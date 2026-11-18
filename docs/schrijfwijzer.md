# Schrijfwijzer PlanB72

Geldt voor alle inhoud in `site/src/content/`. Doel: de meest volledige, betrouwbare noodbibliotheek die bestaat, zonder ooit eigen advies te verzinnen.

## 1. Bronnen

**Weergave:** de lezer ziet de bronnen alleen samen onderaan de pagina. Geen verwijsnummers in de tekst, geen kolom "Bron" in tabellen, geen bron achter elke zin. Noem een instantie in de lopende tekst alleen als dat inhoudelijk telt, bijvoorbeeld wanneer Belgisch en buitenlands advies verschillen of wanneer de lezer moet weten wie iets officieel vraagt ("Het Crisiscentrum vraagt om binnen te blijven"). Eenvoudige, algemeen bekende zaken (een EHBO-set meenemen) krijgen geen eigen bronvermelding.

**In het bronbestand** blijft per `##`-sectie een regel `Bron: [Naam](url)` staan: die is onzichtbaar voor de lezer, maar laat het nazicht en de inhoudscontrole nagaan waar elke bewering vandaan komt. De site zet alle bronregels om in de lijst onderaan.

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

## 3. Volledigheid: geef opties

Geef niet één antwoord maar de **mogelijkheden in volgorde van voorkeur**, met de omstandigheden waarin elke optie past:

- **Beste keuze → goede keuze → noodoplossing**, met waarom.
- Per **plek**: thuis (appartement, huis met kelder, huis zonder kelder), op het werk, op school, onderweg te voet, in de auto, in het openbaar vervoer, buiten in open terrein.
- Per **persoon**: kinderen en baby's, zwangeren, ouderen, mensen met een beperking of chronische ziekte, mensen die afhankelijk zijn van stroom (zuurstof, dialyse), huisdieren en vee.
- Per **fase**: voorbereiden, eerste minuten, eerste uren, eerste dagen, daarna.
- Vermeld wat je doet als de eerste keuze niet kan.

## 4. Opbouw van een scenariokaart (`scenarios/*.md`)

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

## 5. Opbouw van een gids (`gidsen/*.md`)

Frontmatter: `titel`, `module`, `volgorde`, `kort`, `status: concept`, `datum`, `bronnen`. Vrije `##`-structuur, tabellen toegestaan (Markdown). Richtlengte: 1.500 tot 3.500 woorden.

## 6. Opbouw van eerste hulp (`eerstehulp/*.md`)

Frontmatter: `titel`, `volgorde`, `kort`, `status: concept`, `datum`, `bronnen`. Koppen:

```
## Herkennen
## Wat doen
## Als hulp lang op zich laat wachten
## Bel 112 als
## Niet doen
```

`## Wat doen` is een genummerde lijst. Geen doseringen. Richtlengte: 500 tot 1.200 woorden.

## 7. Nazicht

Alle nieuwe inhoud krijgt `status: concept`. Pas na goedkeuring door een deskundige wordt dat `nagekeken`, met `nagekeken_door`.
