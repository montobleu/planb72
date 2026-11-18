# PlanB72 startprogramma

Een minuscule lokale webserver (± 5 MB, alleen Go-standaardbibliotheek) die de
PlanB72-site serveert. Browsers mogen grote kaartbestanden (PMTiles) om
veiligheidsredenen niet rechtstreeks van schijf lezen; via `http://127.0.0.1`
wel, inclusief Range-aanvragen. Eén bestand per besturingssysteem, geen
installatie, geen beheerdersrechten. Het programma luistert standaard alleen op
het eigen toestel en schrijft niets naar schijf (geen logs, geen IP-adressen),
behalve de pakketten die je zelf met `--pakketten` ophaalt.

## Gebruik

Zet het startprogramma op de USB-stick naast de map met de site:

```
USB-stick/
├── planb72/                      <- de site (met index.html)
├── planb72-start-windows-amd64.exe
├── planb72-start-mac-arm64
└── planb72-start-linux-amd64
```

Dubbelklik op het bestand voor jouw systeem. PlanB72 opent in de browser. Sluit
het venster (of druk op Ctrl+C) om te stoppen.

De map met de site wordt gezocht in deze volgorde: `--map`, een map `planb72`
naast het programma, een map `site` naast het programma, de map van het
programma zelf (als daar `index.html` staat). Binnen een macOS `.app` wordt ook
naast de `.app` gezocht.

## Opties

| Optie | Betekenis |
|---|---|
| `--map <pad>` | map met de site |
| `--poort <n>` | poort (standaard 7272; als die bezet is de volgende vrije) |
| `--hotspot` | luister op alle netwerkinterfaces en toon de LAN-adressen, zodat anderen in de buurt meelezen |
| `--geen-browser` | open de browser niet automatisch |
| `--pakketten <manifest>` | haal eerst de pakketten uit dit manifest op naar `<site>/data/`, start daarna zoals gewoonlijk |
| `--bron-toestaan <host>` | extra toegestane downloadbron naast `planb72.org` (spiegel of testomgeving); herhaalbaar of komma-gescheiden |
| `--alleen-ophalen` | met `--pakketten`: alleen ophalen en stoppen, niet starten (foutcode 1 als iets mislukte) |
| `--help` | hulp (NL/EN) |

Let op: met `--hotspot` kan iedereen op hetzelfde netwerk de site lezen.

## Pakketten ophalen

Op de website (planb72.org/download/) kies je welke kaarten en gegevens je
offline wilt hebben. De website maakt daarvan een manifest,
`planb72-pakketten.json`. Geef dat aan het startprogramma:

```
planb72-start --pakketten planb72-pakketten.json
```

Het startprogramma haalt de bestanden op naar `<site>/data/` (dezelfde map die
het anders serveert, of `--map`), toont per bestand en in totaal hoeveel MB
binnen is, en start daarna PlanB72 zoals gewoonlijk. Met `--alleen-ophalen`
stopt het na het ophalen. Het gebruikte manifest komt in
`<site>/data/pakketten.json`, zodat te zien is wat er lokaal staat (de app leest
dat nog niet; zie `docs/downloaden.md`).

- Bestanden die al bestaan met de juiste grootte (en sha256) worden overgeslagen.
- Een download gaat eerst naar `<bestand>.deel`. Na Ctrl+C, een netwerkfout of
  een lege batterij hervat de volgende keer vanaf waar het bleef (Range-aanvraag).
- Na afloop worden grootte en sha256 gecontroleerd; klopt iets niet, dan wordt
  het deel weggegooid en meldt de samenvatting dat bestand als mislukt.
- Veiligheid: alleen paden binnen `data/` (geen `..`, geen absolute paden) en
  alleen `https://planb72.org` of een subdomein. Een spiegel of testomgeving
  moet je zelf toestaan, bv. `--bron-toestaan planb72.bram-664.workers.dev`.
  Doorverwijzingen naar andere hosts worden niet gevolgd.

## Bouwen

```
./build.sh
```

Bouwt met `CGO_ENABLED=0 -trimpath -ldflags "-s -w"` naar `dist/` voor
linux/amd64, linux/arm64 (Raspberry Pi), mac amd64/arm64 en windows
amd64/arm64, en meldt de groottes. Testen: `go vet ./... && go test ./...`.

## Ondertekenen

TODO — nog niet gedaan; zonder ondertekening tonen macOS en Windows een waarschuwing.

- [ ] **macOS**: ondertekenen met een Apple Developer ID (`codesign --options runtime`),
      notariseren (`xcrun notarytool submit --wait`) en `stapler staple`.
      Een kale binary kan niet gestapled worden: lever hem dan in een `.zip`/`.dmg`
      of in een `.app`-bundel. Tot die tijd: rechtsklik > Open, of
      `xattr -d com.apple.quarantine <bestand>`.
- [ ] **Windows**: gratis code signing via [SignPath Foundation](https://signpath.org/)
      voor open-sourceprojecten (aanvraag, daarna ondertekenen in CI).
- [ ] Linux: geen ondertekening nodig; eventueel een detached GPG-handtekening en
      checksums publiceren.
