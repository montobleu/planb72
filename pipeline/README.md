# Datapijplijn

Scripts die de data voor PlanB72 ophalen en klaarzetten. Alleen Python 3.9+ met de
standaardbibliotheek; geen pakketten te installeren. De basiskaart vraagt daarnaast
de opdracht `pmtiles` (`brew install pmtiles`), de routepakketten `osmium`
(`brew install osmium-tool`).

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

Landen: `BE`, `NL`, `LU`, `FR`, `DE` (een bestand per land in `data/landen/`).

### Bron per land: Overpass of Geofabrik

België komt uit Overpass. Nederland, Luxemburg, Frankrijk en Duitsland komen uit het
landextract van Geofabrik (`"bron": "geofabrik"` in `pipeline/budget.json`), lokaal gefilterd
met `osmium` (`brew install osmium-tool` of `apt install osmium-tool`). Voor Frankrijk en
Duitsland zou Overpass honderden aanvragen vragen; het extract (4 à 5 GB) is in enkele
minuten verwerkt. `pipeline/pbf.py` geeft dezelfde elementen terug als Overpass, zodat
`lagen.py` en `schuilplekken.py` voor beide bronnen dezelfde logica gebruiken. Punten
buiten de landsgrens van OpenStreetMap (admin_level 2) vallen weg; het extract loopt
een stukje over de grens. De extracten en tussenbestanden staan in `pipeline/out/pbf/`
en worden na een week opnieuw gedownload. Met `PLANB72_BRON=geofabrik` kies je het
extract ook voor België.

Andere instellingen per land in `pipeline/budget.json` (`landen` -> code):

- `lagen`: budget per laag, twee keer de meting van november 2026;
- `plaats: "dichtstbij"`: de plaats van een schuilplek is de dichtstbijzijnde plaatsnaam
  (city, town, village) binnen 10 km, in plaats van de gemeentegrenzen (Frankrijk en
  Duitsland: tienduizenden gemeenten);
- `per_regio`: met Overpass per regio (admin_level) ophalen in plaats van in één keer.

### Kaartpakketten

```sh
python3 pipeline/regios.py NL DE FR                    # regio's met bbox -> pipeline/regios.json
python3 pipeline/kaartpakketten.py --plan NL LU DE FR  # indeling -> pipeline/kaartpakketten-plan.json
python3 pipeline/kaartpakketten.py --land nl --upload  # uitknippen en naar R2
```

Per land een overzicht (zoom 9, in het basispakket), een standaardkaart (zoom 12) en
straatniveau (zoom 14). Elk pakket blijft onder 280 MB (upload met wrangler kan tot
300 MB): de standaardkaart van Frankrijk en Duitsland is per regio, straatniveau per
provincie, deelstaat of Regierungsbezirk, departement, of in vakken (noordwest, ...).
De indeling komt uit een proefmeting (`pmtiles extract --dry-run`). België en Europa staan
vast in `kaartpakketten.py`. Het resultaat staat in `site/public/data/kaarten.json`.

| Script | Uitvoer |
| --- | --- |
| `lagen.py` | `site/public/data/<land>/<laag>.geojson` voor ziekenhuizen, medisch, politie, brandweer, apotheken, aed, drinkwater, overheid, dierenarts; plus `meta.json` |
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

## Routepakketten

```sh
brew install osmium-tool
python3 pipeline/routegraaf.py                  # alle regio's (downloadt belgium-latest.osm.pbf als dat nog niet in pipeline/out/osm staat)
python3 pipeline/routegraaf.py --alleen be-ant  # één regio
python3 pipeline/routegraaf.py --upload         # ook naar R2 (route/<regio>.pb72r)
```

Maakt per regio (dezelfde bboxen als de kaartpakketten op straatniveau) een routenetwerk en
een zoekindex uit het Geofabrik-extract van OpenStreetMap, en schrijft het overzicht naar
`site/public/data/routes.json`. Een volledige run voor België duurt ongeveer 2,5 minuten en
gebruikt 2 GB geheugen. Metingen en rekentijden: `docs/routeplanning.md`.

Wat er in het netwerk zit:

- **Knopen**: alleen kruispunten, uiteinden van wegen en versperringen (paaltjes, draaihekken).
  Elke knoop en elk segment krijgt een landelijk volgnummer in ruimtelijke volgorde (Z-curve),
  zodat de app regio's naadloos aan elkaar koppelt en de verschillen klein blijven.
- **Segmenten** tussen twee knopen: lengte (dm), wegtype, toegang te voet, fiets en auto,
  eenrichting (auto en fiets apart, met `oneway:bicycle=no`), rotonde, fietsinfrastructuur,
  onverhard, maximumsnelheid (ook `BE-VLG:urban` en dergelijke) en straatnaam (anders het
  wegnummer, voor op- en afritten de bestemming op het richtingbord).
- **Vorm**: de tussenliggende punten als stappen van 1e-5 graad (int16).
- **Zoekindex**: plaatsen (stad tot gehucht, met Franse, Nederlandse en Duitse naam) en straten
  met de dichtstbijzijnde gemeente of het dorp als context.

Toegang volgt de Belgische standaarden van
[OSM tags for routing](https://wiki.openstreetmap.org/wiki/OSM_tags_for_routing/Access_restrictions#Belgium):
geen voetgangers of fietsers op autosnelwegen en `motorroad=yes`, fietsers niet op `footway`
en `pedestrian`, auto's niet op `track`, `path` of `cycleway`. `private`, `agricultural` en
`forestry` gelden als verboden. Afslagverboden (relaties `restriction`) zitten er nog niet in.

Bestandsformaat (`.pb72r`, little-endian):

| Bytes | Inhoud |
| --- | --- |
| 8 | `PB72PAK1` |
| 4 × 3 | versie, lengte zoekdeel, lengte netwerkdeel |
| … | zoekdeel, gzip |
| … | netwerkdeel, gzip |

Elk deel pakt uit tot: u32 koplengte, JSON-kop (id, bbox, OSM-datum, sectietabel) en de secties
op 4 bytes uitgelijnd. Het zoekdeel staat apart, zodat de app kan zoeken in alle regio's zonder
het netwerk uit te pakken. De app leest het formaat in `site/src/lib/routegraaf.ts`; wie de lijst
met wegtypes of vlaggen wijzigt, past beide bestanden aan en verhoogt `VERSIE`.

## Downloadcatalogus

```sh
python3 pipeline/catalogus.py               # site/public/data/catalogus.json
python3 pipeline/catalogus.py --controleer  # foutcode 1 als ze verouderd is
```

Eén lijst van alles wat je kunt downloaden, per land en detailniveau (nooit per provincie),
voor de website, de app, het startprogramma en later de apps. Draai het script na elke
wijziging aan `kaarten.json`, `routes.json` of de kaartlagen, en na `npm run build` (grootte
van de app per taal). `controleer_inhoud.py` faalt als de catalogus verouderd is. Zie
[docs/downloaden.md](../docs/downloaden.md).

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
