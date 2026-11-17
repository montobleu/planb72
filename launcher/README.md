# PlanB72 startprogramma

Een minuscule lokale webserver (± 5 MB, alleen Go-standaardbibliotheek) die de
PlanB72-site serveert. Browsers mogen grote kaartbestanden (PMTiles) om
veiligheidsredenen niet rechtstreeks van schijf lezen; via `http://127.0.0.1`
wel, inclusief Range-aanvragen. Eén bestand per besturingssysteem, geen
installatie, geen beheerdersrechten. Het programma luistert standaard alleen op
het eigen toestel en schrijft niets naar schijf (geen logs, geen IP-adressen).

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
| `--help` | hulp (NL/EN) |

Let op: met `--hotspot` kan iedereen op hetzelfde netwerk de site lezen.

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
