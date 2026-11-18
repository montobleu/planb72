# Downloaden: de keuzehulp

Wie PlanB72 downloadt, kiest zelf wat er op het toestel komt, op welke manier dan ook:
de website, de app in de browser (PWA), het startprogramma voor computer en USB, en later
de apps voor iOS en Android. Overal dezelfde vragen, altijd met het eigen land als vertrekpunt.

## Wat de gebruiker kiest

1. **Mijn land.** Eerder gekozen land (Instellingen), anders afgeleid uit de taal van het toestel
   (`nl-BE` → België), anders uit de taal van de pagina. Een geraden land wordt nagevraagd.
2. **Welke landen.** Vier voorstellen:
   - *Alleen mijn land*
   - *Mijn land en buurlanden* (landgrenzen in `pipeline/catalogus.py`, `BUREN`)
   - *Kies landen* (zelf aanvinken)
   - *Alles*: alle landen op straatniveau, met routes, uitgebreid Europa en alle talen
3. **Per land**: detailniveau *overzicht*, *standaard* of *straatniveau*, en aan of uit:
   *kaartlagen* (ziekenhuizen, politie, AED, schuilplekken, nucleaire zones …) en *routes en zoeken*
   (waar beschikbaar). Standaard: eigen land *standaard* met lagen en routes, andere landen *overzicht* met lagen.
4. **Extra**: het uitgebreide overzicht van Europa.
5. **Talen** van de app. De teksten zitten in de app zelf; niet gekozen talen blijven niet op het toestel.

**Altijd per land, nooit per provincie of regio.** In R2 staan straatniveau (en de
standaardkaart van Frankrijk en Duitsland) in stukken per regio, omdat één bestand per land te
groot is voor de upload en voor telefoons (België op straatniveau ± 1,3 GB, Frankrijk en
Duitsland ± 10 à 11 GB). De catalogus bundelt die stukken tot één blok per land en niveau, bv.
*België, straatniveau, 1,3 GB, 9 bestanden*. Downloaden haalt alle bestanden na elkaar op met
één voortgangsbalk; verwijderen verwijdert ze samen.

De keuzehulp toont de werkelijke grootte per land en per niveau, het totaal, en (in de app) de
vrije ruimte (`navigator.storage.estimate`). Waarschuwingen:

| Wanneer | Melding |
|---|---|
| download groter dan 500 MB (`DREMPEL_GROOT`) | gebruik wifi, laat het toestel laden |
| één land boven 1 GB (`GROOT_LAND`, in de praktijk Frankrijk en Duitsland vanaf standaard) | omvang van dat land |
| mobiele data of databesparing (`navigator.connection`, waar beschikbaar) | wacht op wifi |
| minder dan 200 MB vrij na de download (`MARGE`) | weinig ruimte over |
| meer dan de vrije ruimte | niet genoeg ruimte; downloaden kan niet |

Groot of mobiel vraagt een bevestiging; te weinig ruimte houdt het downloaden tegen.

## Bouwstenen

```
pipeline/catalogus.py          maakt de catalogus uit kaarten.json, routes.json, <land>/meta.json, data/landen/
site/public/data/catalogus.json  de catalogus: één lijst voor alle vormen
site/src/lib/selectie.ts       keuzelogica zonder DOM: voorstellen, blokken, groottes, link, manifest
site/src/lib/downloaden.ts     opslag in de browser: OPFS / Cache API, hervatten, wachtrij, talen
site/src/lib/keuzehulp.ts      het scherm (website en app)
site/src/components/Keuzehulp.astro   de opmaak, in drie vormen: site, eerste, app
site/src/i18n/keuze.ts         teksten in NL, FR, DE, EN
launcher/pakketten.go          startprogramma: --pakketten <manifest>
```

### Catalogus

Draai na elke wijziging aan kaart-, route- of laagpakketten:

```bash
python3 pipeline/catalogus.py
```

`python3 pipeline/controleer_inhoud.py` faalt als de catalogus verouderd is. Formaat
(`formaat: "planb72-catalogus"`, `versie: 1`):

```jsonc
{
  "landen": [{ "code": "be", "naam": { "nl": "België", … }, "talen": ["nl", "fr", "de"], "buren": ["nl", "lu", "fr", "de"] }],
  "talen": ["nl", "fr", "de", "en"],
  "blokken": [{
    "id": "be-straat",            // eu-z6, eu-z7, <land>-overzicht|standaard|straat, routes-<land>, lagen-<land>, inhoud-<taal>
    "soort": "straat",            // basiskaart | straat | routes | lagen | inhoud
    "niveau": "straat",           // europa | overzicht | standaard | straat
    "land": "be",
    "bytes": 1342519096,
    "versie": "20261117",         // build van de kaart, OSM-datum van de routes, ophaaldatum van de lagen
    "zak": false,                 // hoort bij het kleinste pakket (Zak)
    "bestanden": [{ "id": "be-wvl-z15", "pad": "/data/be-wvl-z15.pmtiles", "bytes": 131173879, "sha256": null }, …],
    "vereist": ["be-overzicht"]   // afhankelijkheden; overzicht vereist eu-z6
  }]
}
```

`sha256` staat er voor de kleine bestanden (kaartlagen); voor de pakketten in R2 is het `null`
tot `pipeline/kaartpakketten.py` en `pipeline/routegraaf.py` het meeleveren in `kaarten.json` en
`routes.json` (veld `sha256` per pakket; de catalogus neemt het dan over). Een digitale
handtekening van de catalogus kan later naast het bestand komen (`catalogus.json.sig`).

Blokken met `kern: true` (de talen) zitten in de app zelf en worden niet apart gedownload.

Straatniveau bevat ook de lagere zoomniveaus; *straatniveau* is dus overzicht + straatbestanden,
zonder de standaardkaart.

### Keuze in een link

De website geeft de keuze mee naar de app in het `#`-deel van de link (gaat niet naar een server):

```
/app/kiezen/#eigen=be&voorstel=buren&land=be_standaard_lagen.routes&land=nl_overzicht_lagen&talen=nl.fr.de
```

`naarLink` en `uitLink` in `selectie.ts`; onbekende landen of niveaus vallen weg.

### Manifest voor computer en USB

De website maakt met `maakManifest` een `planb72-pakketten.json`:

```json
{ "formaat": "planb72-pakketten", "versie": 1, "bron": "https://planb72.org", "keuze": "eigen=be&…",
  "blokken": ["eu-z6", "be-overzicht", …], "bytes": 219000000,
  "bestanden": [{ "pad": "data/be-z9.pmtiles", "url": "https://planb72.org/data/be-z9.pmtiles", "bytes": 10538252, "sha256": null }] }
```

`planb72-start --pakketten planb72-pakketten.json` haalt de bestanden op naar `<site>/data/`,
hervat een onderbroken download (Range), controleert grootte en sha256, en start daarna de
site (zie `launcher/README.md`). Alleen `https://planb72.org` (en subdomeinen) is standaard
toegestaan; spiegels met `--bron-toestaan`. De site toont ook de losse links en een tekstbestand
met `url<TAB>pad` voor wie zelf downloadt.

## In de web-app (PWA)

- **Eerste gebruik**: `/app/kiezen/`. De startpagina verwijst ernaar zolang er geen keuze is.
- **Instellingen** (`/app/pakket/`): dezelfde keuzehulp, daaronder *Op dit toestel*: per land de
  blokken met hun stand (op dit toestel, x van y delen, nog niet, bezig, mislukt), verwijderen per
  blok, wat er nog staat maar niet meer in de keuze zit (samen op te ruimen), en **oude kaarten**:
  bestanden op het toestel die in geen enkel blok van de catalogus meer staan (bv. straatniveau tot
  zoom 14, vervangen door zoom 15), per bestand of samen te verwijderen.
- **Opslag**: kaartbestanden onder hun eigen naam in OPFS (`kaarten/<id>.pmtiles`), routes in
  `routes/<id>.pb72r`, anders in de Cache API; kaartlagen per land in de cache `pb72-pakket-<land>`.
  Dat is dezelfde plaats als voorheen, dus de kaart en de routeplanner vinden alles zonder
  aanpassing.
- **Pauzeren en hervatten**: een bestand komt in stukken van 8 MB in `<id>.deel`; na een pauze,
  een herstart of een weggevallen verbinding vraagt de volgende poging alleen de rest
  (`Range`). Zonder schrijfbare OPFS begint een bestand opnieuw.
- **Talen**: de keuze komt in de cache `pb72-instellingen` (`/talen.json`). De service worker
  (`scripts/sw-template.js`) bewaart alleen de app-pagina's van die talen, haalt de rest van het
  toestel en vult een nieuw gekozen taal meteen aan. De taal van het scherm en `/app/offline/`
  blijven altijd.
- **Landen**: bewaren of downloaden zet ook de landkeuze (`pb72-landen`, eigen land eerst), zodat
  noodnummers, kaartlagen en voorraadplanner de gekozen landen volgen.

## Later: apps voor iOS en Android (Capacitor)

De apps worden een Capacitor-schil rond dezelfde site (zie het plan). Ze gebruiken
**dezelfde catalogus en dezelfde `selectie.ts`**; alleen de opslag en de omgeving verschillen.

1. **Catalogus**: de app haalt `https://planb72.org/data/catalogus.json` op (met verbinding) en
   bewaart een kopie; een kopie zit ook in de app-bundel voor de eerste start zonder verbinding.
2. **Keuze**: hetzelfde scherm (`Keuzehulp.astro` in modus `eerste` en `app`). `raadEigenLand`
   krijgt de landinstelling van het toestel (`Device.getLanguageCode()` / regio van het
   besturingssysteem).
3. **Ruimte en verbinding**: `beoordeel(bytes, opslag, verbinding)` krijgt de waarden van het
   toestel in plaats van `leesOpslag()` en `leesVerbinding()`: vrije ruimte via een kleine plug-in
   (iOS `volumeAvailableCapacityForImportantUsage`, Android `StatFs`), netwerktype via
   `@capacitor/network` (`connectionType === 'cellular'`).
4. **Opslag**: een variant van `downloaden.ts` met dezelfde functies (`aanwezigheid`,
   `downloadBlok`, `verwijderBlok`, `Wachtrij`), maar met het bestandssysteem van het toestel in
   plaats van OPFS:
   - bestanden via `@capacitor/filesystem` in `Directory.Data` (iOS: *Application Support*,
     uitgesloten van iCloud-back-up; Android: interne opslag van de app), onder dezelfde namen
     (`kaarten/<id>.pmtiles`, `routes/<id>.pb72r`, `lagen/<land>/…`);
   - grote downloads op de achtergrond met een native downloader (iOS `URLSession` background,
     Android `DownloadManager` of WorkManager), die zelf hervat;
   - controle van grootte en `sha256` na elke download, zoals het startprogramma.
5. **Kaart lezen**: PMTiles vanaf het toestel via een `Source` die bytes leest met
   `Filesystem.readFile` (bereik) of via een lokale URL (`Capacitor.convertFileSrc`), zodat de
   kaartcode (`kiesZichtbaar`, `basiskaart.ts`) gelijk blijft.
6. **Talen**: de app-bundel bevat alle talen (klein); de taalkeuze bepaalt alleen de weergave.

Zo blijft er één keuzelogica voor website, PWA, startprogramma en apps; elke vorm levert alleen
zijn eigen opslag en omgeving.

## Open punten

- `sha256` voor de pakketten in R2 meeleveren vanuit de pijplijn.
- Het startprogramma schrijft `data/pakketten.json`; de app leest dat nog niet. Op een computer
  met het startprogramma ziet de app de opgehaalde kaarten nu alleen als "online" pakketten van
  de lokale server.
- Een keuze die al op het toestel staat bijwerken als er een nieuwere versie van een blok is
  (`versie` in de catalogus vergelijken met de bewaarde).
