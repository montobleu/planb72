# Datapijplijn

Scripts die de data voor PlanB72 ophalen en klaarzetten. Alleen Python 3.9+ met de
standaardbibliotheek; geen pakketten te installeren. De basiskaart vraagt daarnaast
de opdracht `pmtiles` (`brew install pmtiles`).

Alles draait vanuit de root van de repository. Tussenbestanden komen in
`pipeline/out/` (staat in `.gitignore`); wat de website gebruikt komt in
`site/public/data/<land>/`.

## Kaartdata voor een land

```sh
python3 pipeline/lagen.py BE           # 9 kaartlagen uit OpenStreetMap (Overpass)
python3 pipeline/schuilplekken.py BE   # mogelijke schuilplekken, klasse B en C
python3 pipeline/nucleair.py BE        # nucleaire sites en zones uit data/landen/be.json
python3 pipeline/basiskaart.py BE      # basiskaart meten + overzichtskaart (pmtiles)
```

| Script | Uitvoer |
| --- | --- |
| `lagen.py` | `site/public/data/be/<laag>.geojson` voor ziekenhuizen, medisch, politie, brandweer, apotheken, aed, drinkwater, overheid, dierenarts; plus `meta.json` |
| `schuilplekken.py` | `site/public/data/be/schuilplekken.geojson` en `pipeline/out/be-schuilplekken.csv` |
| `nucleair.py` | `site/public/data/be/nucleair.geojson` (punten en cirkels) |
| `basiskaart.py` | `pipeline/out/be-z<zoom>.pmtiles`, `pipeline/out/be-basiskaart-metingen.json`, `site/public/data/be/basis.pmtiles` |

Opties:

- `lagen.py BE --lagen ziekenhuizen aed` haalt alleen die lagen op.
- `--forceer` (lagen en schuilplekken) schrijft ook weg als een laag meer dan 5% daalt.
- `schuilplekken.py BE --zonder-gemeenten` slaat het aanvullen van de gemeente over.
- `basiskaart.py BE --zooms 8 9 10 --build 20261117` kiest zoomniveaus en build.
- `PLANB72_OVERPASS=https://overpass.kumi.systems/api/interpreter` legt één Overpass-server op.

Foutcodes: `2` = kwaliteitscontrole (daling > 5% tegenover de vorige `meta.json`),
`3` = budget overschreden (`pipeline/budget.json`). In beide gevallen wordt niets weggeschreven.

Overpass: één query per laag, 10 seconden rust tussen aanvragen, bij fouten
exponentieel wachten en wisselen tussen overpass-api.de, overpass.kumi.systems en
overpass.openstreetmap.fr. Een leeg antwoord wordt pas aanvaard als een tweede
server het bevestigt. Een volledige run voor België duurt ongeveer een half uur.

## Bronnenronde

```sh
python3 pipeline/bronnenronde.py                    # elke bron uit data/bronnen/register.json
python3 pipeline/bronnenronde.py --alleen be-alert  # één bron
python3 pipeline/bronnenronde.py --forceer          # ook als vandaag al gecontroleerd
```

Schrijft `data/bronnen/status.json`. Maximaal één controle per bron per dag,
voorwaardelijke GET, robots.txt wordt gevolgd. Een bron krijgt `licentie_gewijzigd: true`
als de tekst uit haar veld `licentie_kenmerk` eerst wel en nu niet meer op de pagina staat.
Geeft altijd foutcode 0; met `--meldingen bestand.json` krijg je de lijst van issues
die de workflow aanmaakt (≥ 3 dagen onbereikbaar of licentie gewijzigd).

Een nieuwe bron toevoegen = een regel in `data/bronnen/register.json`.

## Automatisch

- `.github/workflows/bronnenronde.yml`: elke nacht om 03:17 UTC; status op de branch `bronnenronde`, issues bij problemen.
- `.github/workflows/kaartlagen.yml`: elke maandag; draait de drie kaartscripts en opent een pull request.

Meetresultaten van fase 0 staan in `docs/metingen.md`.
