#!/usr/bin/env python3
"""Lijst van mogelijke schuilplekken uit OpenStreetMap (klasse B en C).

Je geeft een landcode op en krijgt:
  - site/public/data/<land>/schuilplekken.geojson (kaartlaag, compact)
  - pipeline/out/<land>-schuilplekken.csv (tabel, voor gemeenten en hulpdiensten)

Acht soorten plekken:
  B  ondergrondse parking          amenity=parking + parking=underground
  B  metrostation                  station=subway
  B  ondergronds station           station/halte/tramhalte met location=underground of layer<0
  B  voetgangerstunnel  (>= 10 m)  voetpad, pad, trap of fietspad met tunnel=yes
  B  wegtunnel          (>= 50 m)  andere weg met tunnel=yes
  B  spoortunnel        (>= 50 m)  spoor, metro, tram met tunnel=yes
  B  gebouw met ondergrondse verdiepingen   building:levels:underground > 0 (geen woningen)
  C  historische bunker            military=bunker of historic=bunker

Elke plek krijgt het vaste label "Mogelijke schuilplek. Niet officieel
aangewezen. Toegang en toestand onbekend."

Tunnels komen als lijn binnen (`out geom`). Stukken die aan elkaar hangen
worden één tunnel; de lengte wordt met haversine over de geometrie berekend,
en het punt is het midden van de lijn.

De gemeente ("plaats") komt uit addr:city, en anders uit de gemeentegrenzen
van OpenStreetMap (admin_level 8, één keer opgehaald en bewaard in pipeline/out).

Gebruik:
    python3 pipeline/schuilplekken.py            # België
    python3 pipeline/schuilplekken.py NL
    python3 pipeline/schuilplekken.py BE --zonder-gemeenten
    python3 pipeline/schuilplekken.py BE --forceer

Grote landen: met "per_regio" in pipeline/budget.json (landen -> code) wordt per
regio opgehaald; met "plaats": "dichtstbij" komt de plaats van de dichtstbijzijnde
plaatsnaam (city, town, village) binnen 10 km in plaats van uit de gemeentegrenzen.
"""

import argparse
import csv
import datetime as dt
import json
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import overpass as op  # noqa: E402
import pbf  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "pipeline" / "out"
LABEL = "Mogelijke schuilplek. Niet officieel aangewezen. Toegang en toestand onbekend."
BRON = "© OpenStreetMap-bijdragers, ODbL"
MAX_DALING = 0.05

KOLOMMEN = ["id", "klasse", "soort", "naam", "plaats", "lat", "lon", "capaciteit",
            "toegang", "openingsuren", "betalend", "verdiepingen_ondergronds",
            "lengte_m", "waarschuwing", "label", "bron", "datum"]

VOETPADEN = "footway|pedestrian|path|steps|cycleway"
GEEN_WEG = VOETPADEN + "|corridor|construction|proposed|platform|bridleway|elevator|raceway"
SPOREN = "rail|subway|light_rail|tram|narrow_gauge|monorail"
STATIONS = "station|halt|tram_stop"

# Gebouwtypes die we nooit opnemen: woningen en privébijgebouwen.
WONINGEN = {"house", "detached", "semidetached_house", "terrace", "bungalow",
            "residential", "apartments", "farm", "cabin", "hut", "shed", "garage",
            "garages", "static_caravan", "houseboat", "dormitory", "villa", "barn",
            "farm_auxiliary", "carport", "allotment_house"}
# Tags die aantonen dat een gebouw (building=yes) geen woning is.
NIET_WONING = ("amenity", "shop", "office", "tourism", "leisure", "government",
               "healthcare", "public_transport", "railway", "historic", "military")

# soort -> (klasse, query, uitvoer, minimumlengte, waarschuwing)
SOORTEN = {
    "ondergrondse parking": ("B", [
        'nwr["amenity"="parking"]["parking"="underground"]',
        'nwr["amenity"="parking"]["location"="underground"]',
    ], "center", 0, None),
    "metrostation": ("B", [
        'nwr["railway"="station"]["station"="subway"]',
        'nwr["public_transport"="station"]["station"="subway"]',
    ], "center", 0, None),
    "ondergronds station": ("B", [
        f'nwr["railway"~"^({STATIONS})$"]["location"="underground"]',
        f'nwr["railway"~"^({STATIONS})$"]["layer"~"^-"]',
        'nwr["public_transport"="station"]["location"="underground"]',
    ], "center", 0, None),
    "voetgangerstunnel": ("B", [
        f'way["highway"~"^({VOETPADEN})$"]["tunnel"="yes"]',
    ], "geom", 10, None),
    "wegtunnel": ("B", [
        f'way["highway"]["tunnel"="yes"]["highway"!~"^({GEEN_WEG})$"]'
        '["service"!="parking_aisle"]',
    ], "geom", 50, "Verkeer en rook zijn een risico in een wegtunnel."),
    "spoortunnel": ("B", [
        f'way["railway"~"^({SPOREN})$"]["tunnel"="yes"]',
    ], "geom", 50, "Treinen en stroomvoerende rails zijn een risico; niet op de sporen lopen."),
    "gebouw met ondergrondse verdiepingen": ("B", [
        'nwr["building"]["building:levels:underground"]',
    ], "center", 0, None),
    "historische bunker": ("C", [
        'nwr["military"="bunker"]',
        'nwr["historic"="bunker"]',
    ], "center", 0, "Vaak afgesloten, overwoekerd of onveilig."),
}


PLAATS_FILTER = 'node["place"~"^(city|town|village)$"]["name"]'


def gemeente_filter(niveau):
    return f'rel["boundary"="administrative"]["admin_level"="{niveau}"]'


NIVEAU = ["8"]  # admin_level van gemeenten; main() zet de waarde van --gemeente-niveau


def alle_filters(land, niveau="8"):
    """Alles wat dit script uit een Geofabrik-extract nodig heeft: één filterronde.

    Gemeentegrenzen alleen als het land ze gebruikt (niet bij "plaats": "dichtstbij").
    """
    fs = [f for s in SOORTEN.values() for f in s[1]] + [PLAATS_FILTER]
    if op.landinstellingen(land).get("plaats") != "dichtstbij":
        fs.append(gemeente_filter(niveau))
    return fs

# ---------------------------------------------------------------- gemeenten

def gemeenten_ophalen(land, niveau):
    """Gemeentegrenzen ophalen (en bewaren) als lijst van {naam, bbox, segmenten}."""
    cache = UIT / f"{land.lower()}-gemeenten-{niveau}.json"
    if cache.exists() and time.time() - cache.stat().st_mtime < 30 * 86400:
        with open(cache, encoding="utf-8") as f:
            return json.load(f)
    print(f"gemeentegrenzen (admin_level {niveau}) ophalen ...", flush=True)
    q = (f"[out:json][timeout:900];\n{op.gebied(land)}\n"
         f'rel["boundary"="administrative"]["admin_level"="{niveau}"](area.land);\n'
         "out tags geom;")
    if pbf.gekozen(land):
        antwoord = {"elements": pbf.index(land, alle_filters(land, niveau)).zoek(
            [gemeente_filter(niveau)], geom=True)}
    else:
        antwoord = op.vraag(q)
    gemeenten = []
    for rel in antwoord.get("elements", []):
        lijnen = []
        for m in rel.get("members", []):
            if m.get("type") == "way" and m.get("role") in ("outer", "inner", "") \
                    and m.get("geometry"):
                lijnen.append([[round(g["lon"], 5), round(g["lat"], 5)]
                               for g in m["geometry"] if g])
        if not lijnen:
            continue
        xs = [p[0] for lijn in lijnen for p in lijn]
        ys = [p[1] for lijn in lijnen for p in lijn]
        tags = rel.get("tags", {})
        gemeenten.append({"naam": tags.get("name"), "naam_nl": tags.get("name:nl"),
                          "bbox": [min(xs), min(ys), max(xs), max(ys)], "lijnen": lijnen})
    UIT.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8") as f:
        json.dump(gemeenten, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {len(gemeenten)} gemeenten", flush=True)
    return gemeenten


def in_gemeente(lon, lat, gem):
    """Even-oneven regel over alle randsegmenten; de volgorde van de stukken doet er niet toe."""
    b = gem["bbox"]
    if not (b[0] <= lon <= b[2] and b[1] <= lat <= b[3]):
        return False
    binnen = False
    for lijn in gem["lijnen"]:
        for (x1, y1), (x2, y2) in zip(lijn, lijn[1:]):
            if (y1 > lat) != (y2 > lat):
                x = x1 + (lat - y1) * (x2 - x1) / (y2 - y1)
                if x > lon:
                    binnen = not binnen
    return binnen


def zoek_gemeente(lon, lat, gemeenten):
    for gem in gemeenten:
        if in_gemeente(lon, lat, gem):
            return gem["naam"]
    return None


def plaatsen_ophalen(land, gebieden):
    """Plaatsnamen (city, town, village) als punten, voor grote landen.

    De grenzen van tienduizenden gemeenten ophalen is voor Frankrijk en
    Duitsland te zwaar; daar krijgt een plek de naam van de dichtstbijzijnde
    plaats binnen 10 km. Bewaard in pipeline/out.
    """
    cache = UIT / f"{land.lower()}-plaatsen.json"
    if cache.exists() and time.time() - cache.stat().st_mtime < 30 * 86400:
        with open(cache, encoding="utf-8") as f:
            return json.load(f)
    print("plaatsnamen ophalen ...", flush=True)
    plaatsen = {}
    for label, regel in gebieden:
        if regel is None:
            elementen = pbf.index(land, alle_filters(land, NIVEAU[0])).zoek([PLAATS_FILTER])
        else:
            q = (f"[out:json][timeout:900];\n{regel}\n{PLAATS_FILTER}(area.land);\nout;")
            elementen = op.vraag(q).get("elements", [])
        for el in elementen:
            plaatsen[el["id"]] = [el["tags"]["name"], round(el["lat"], 5), round(el["lon"], 5)]
    lijst = list(plaatsen.values())
    UIT.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8") as f:
        json.dump(lijst, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {len(lijst)} plaatsen", flush=True)
    return lijst


class Plaatsrooster:
    """Rooster van 0,1 graad om snel de dichtstbijzijnde plaats te vinden."""

    def __init__(self, plaatsen):
        self.cellen = defaultdict(list)
        for naam, lat, lon in plaatsen:
            self.cellen[(int(lat * 10), int(lon * 10))].append((naam, lat, lon))

    def zoek(self, lat, lon, max_m=10000):
        cy, cx = int(lat * 10), int(lon * 10)
        beste, afstand = None, max_m
        for dy in range(-1, 2):
            for dx in range(-2, 3):
                for naam, plat, plon in self.cellen.get((cy + dy, cx + dx), ()):
                    d = op.haversine(lat, lon, plat, plon)
                    if d < afstand:
                        beste, afstand = naam, d
        return beste


# ---------------------------------------------------------------- tunnels

def ketens(ways):
    """Voegt tunnelstukken samen die aan hun uiteinden aan elkaar hangen.

    Op een knooppunt waar meer dan twee stukken samenkomen stopt een keten,
    zodat een heel metronet niet één tunnel wordt. Geeft lijsten van
    (way, omgekeerd) terug, in volgorde langs de lijn.
    """
    eind = defaultdict(list)
    for w in ways:
        eind[w["nodes"][0]].append(w)
        eind[w["nodes"][-1]].append(w)
    gebruikt = set()
    uitkomst = []

    def verleng(keten, knoop, vooraan):
        while len(eind[knoop]) == 2:
            volgende = [w for w in eind[knoop] if w["id"] not in gebruikt]
            if not volgende:
                break
            w = volgende[0]
            gebruikt.add(w["id"])
            begint_hier = w["nodes"][0] == knoop
            if vooraan:
                # nieuw stuk moet eindigen op knoop
                keten.insert(0, (w, begint_hier))
                knoop = w["nodes"][-1] if begint_hier else w["nodes"][0]
            else:
                keten.append((w, not begint_hier))
                knoop = w["nodes"][-1] if begint_hier else w["nodes"][0]

    for w in ways:
        if w["id"] in gebruikt:
            continue
        gebruikt.add(w["id"])
        keten = [(w, False)]
        verleng(keten, w["nodes"][-1], vooraan=False)
        verleng(keten, w["nodes"][0], vooraan=True)
        uitkomst.append(keten)
    return uitkomst


def keten_punten(keten):
    punten = []
    for w, omgekeerd in keten:
        geom = [g for g in w["geometry"] if g]
        if omgekeerd:
            geom = geom[::-1]
        if punten and geom and punten[-1] == geom[0]:
            geom = geom[1:]
        punten.extend(geom)
    return punten


def midden_van_lijn(punten):
    """Punt halverwege de lijn, gemeten langs de geometrie."""
    totaal = op.lijnlengte(punten)
    if totaal == 0:
        return punten[0]["lat"], punten[0]["lon"]
    doel = totaal / 2
    afgelegd = 0.0
    for a, b in zip(punten, punten[1:]):
        d = op.haversine(a["lat"], a["lon"], b["lat"], b["lon"])
        if afgelegd + d >= doel and d > 0:
            t = (doel - afgelegd) / d
            return a["lat"] + t * (b["lat"] - a["lat"]), a["lon"] + t * (b["lon"] - a["lon"])
        afgelegd += d
    return punten[-1]["lat"], punten[-1]["lon"]


def tunnelnaam(tags):
    return tags.get("tunnel:name") or tags.get("name")


def tunnels_samenvoegen(ways, minimum):
    """Geeft per tunnel (way, lengte, lat, lon, aantal_stukken).

    Stap 1: aaneengesloten stukken worden één keten.
    Stap 2: ketens met dezelfde naam die dicht bij elkaar liggen (twee kokers
    van één tunnel, of rijrichtingen) worden één tunnel; de lengte is dan die
    van de langste koker, niet de som.
    """
    rijen = []
    for keten in ketens(ways):
        punten = keten_punten(keten)
        if len(punten) < 2:
            continue
        lengte = op.lijnlengte(punten)
        lat, lon = midden_van_lijn(punten)
        hoofd = max(keten, key=lambda x: op.lijnlengte([g for g in x[0]["geometry"] if g]))[0]
        rijen.append({"way": hoofd, "lengte": lengte, "lat": lat, "lon": lon,
                      "naam": tunnelnaam(hoofd.get("tags", {})), "stukken": len(keten)})

    # Stap 2: zelfde naam, binnen 300 m van elkaar.
    groepen = []
    for r in sorted(rijen, key=lambda r: -r["lengte"]):
        if r["naam"]:
            for g in groepen:
                if g["naam"] == r["naam"] and \
                        op.haversine(g["lat"], g["lon"], r["lat"], r["lon"]) < 300:
                    g["stukken"] += r["stukken"]
                    break
            else:
                groepen.append(dict(r))
        else:
            groepen.append(dict(r))
    return [g for g in groepen if g["lengte"] >= minimum]


# ---------------------------------------------------------------- rijen

def getal(waarde):
    if not waarde:
        return None
    try:
        return int(float(waarde.split(";")[0].strip()))
    except ValueError:
        return None


def is_woning(tags):
    b = tags.get("building", "")
    if b in WONINGEN:
        return True
    if tags.get("building:use", "").startswith("residential"):
        return True
    if b == "yes":
        return not (tags.get("name") or any(k in tags for k in NIET_WONING))
    return False


def maak_rij(soort, el, datum, lat=None, lon=None, lengte=None):
    klasse, _, _, _, waarschuwing = SOORTEN[soort]
    tags = el.get("tags", {})
    if lat is None:
        punt = op.punt_van(el)
        if not punt:
            return None
        lat, lon = punt
    naam = op.naam_van(tags)
    return {
        "id": op.osm_id(el),
        "klasse": klasse,
        "soort": soort,
        "naam": naam,
        "plaats": tags.get("addr:city") or tags.get("addr:municipality"),
        "lat": op.rond(lat),
        "lon": op.rond(lon),
        "capaciteit": getal(tags.get("capacity")) if soort == "ondergrondse parking" else None,
        "toegang": tags.get("access"),
        "openingsuren": tags.get("opening_hours"),
        "betalend": op.ja_nee(tags.get("fee")),
        "verdiepingen_ondergronds": getal(tags.get("building:levels:underground")
                                          or tags.get("parking:levels:underground")),
        "lengte_m": round(lengte) if lengte is not None else None,
        "waarschuwing": waarschuwing,
        "label": LABEL,
        "bron": BRON,
        "datum": datum,
    }


def ontdubbel_punten(rijen, afstand=150):
    """Zelfde soort en naam binnen enkele honderden meter: één plek (vlak gaat voor knoop)."""
    gehouden = []
    per_naam = defaultdict(list)
    volgorde = {"relation": 0, "way": 1, "node": 2}
    for r in sorted(rijen, key=lambda r: volgorde[r["id"].split("/")[0]]):
        if r["naam"]:
            sleutel = (r["soort"], r["naam"].lower())
            if any(op.haversine(r["lat"], r["lon"], g["lat"], g["lon"]) < afstand
                   for g in per_naam[sleutel]):
                continue
            per_naam[sleutel].append(r)
        gehouden.append(r)
    return gehouden


def haal_soort(land, soort, datum, gebieden=None, bbox=None, grens=None):
    klasse, filters, uitvoer, minimum, _ = SOORTEN[soort]
    delen = "\n  ".join(f"{f}(area.land);" for f in filters)
    out = "out center tags;" if uitvoer == "center" else "out geom;"
    elementen = {}
    seconden = 0.0
    for label, regel in gebieden or [(land, op.gebied(land))]:
        if regel is None:  # Geofabrik-extract in plaats van Overpass
            t0 = time.time()
            antwoord = pbf.antwoord(pbf.index(land, alle_filters(land, NIVEAU[0])).zoek(filters, uitvoer == "geom"), t0)
        else:
            q = f"[out:json][timeout:900];\n{regel}\n(\n  {delen}\n);\n{out}"
            antwoord = op.vraag(q)
        seconden += antwoord["_seconden"]
        for e in antwoord.get("elements", []):
            elementen.setdefault(op.osm_id(e), e)
        if gebieden and len(gebieden) > 1:
            print(f"    {label}: {len(antwoord.get('elements', []))} "
                  f"({antwoord['_seconden']} s)", flush=True)
    print(f"  {len(elementen)} objecten ({seconden:.0f} s)", flush=True)
    rijen = []
    if uitvoer == "geom":
        ways = [e for e in elementen.values() if e["type"] == "way" and e.get("geometry")]
        for t in tunnels_samenvoegen(ways, minimum):
            r = maak_rij(soort, t["way"], datum, t["lat"], t["lon"], t["lengte"])
            if r:
                rijen.append(r)
        return [r for r in rijen if op.in_bbox(r["lat"], r["lon"], bbox)
            and (grens is None or grens.binnen(r["lat"], r["lon"]))]
    for el in elementen.values():
        tags = el.get("tags", {})
        if soort == "gebouw met ondergrondse verdiepingen":
            if is_woning(tags) or not getal(tags.get("building:levels:underground")):
                continue
        r = maak_rij(soort, el, datum)
        if r:
            rijen.append(r)
    return [r for r in rijen if op.in_bbox(r["lat"], r["lon"], bbox)
            and (grens is None or grens.binnen(r["lat"], r["lon"]))]


def main():
    p = argparse.ArgumentParser(description="Mogelijke schuilplekken uit OpenStreetMap.")
    p.add_argument("land", nargs="?", default="BE", help="ISO-landcode (standaard BE)")
    p.add_argument("--zonder-gemeenten", action="store_true",
                   help="plaats niet aanvullen uit de gemeentegrenzen")
    p.add_argument("--gemeente-niveau", default="8", help="admin_level van gemeenten")
    p.add_argument("--forceer", action="store_true",
                   help="schrijf ook weg als het aantal meer dan 5%% daalt")
    args = p.parse_args()

    land = args.land.upper()
    NIVEAU[0] = args.gemeente_niveau
    datum = dt.date.today().isoformat()
    t0 = time.time()

    instellingen = op.landinstellingen(land)
    gebieden = [(land, None)] if pbf.gekozen(land) else op.gebieden(land)
    bbox = op.lees_land(land).get("bbox")
    grens = pbf.grens(land) if pbf.gekozen(land) else None
    if len(gebieden) > 1:
        print(f"{land}: per regio, {len(gebieden)} gebieden", flush=True)

    rijen = []
    for soort in SOORTEN:
        print(f"{soort}: ophalen ...", flush=True)
        nieuw = haal_soort(land, soort, datum, gebieden, bbox, grens)
        print(f"  {len(nieuw)} plekken", flush=True)
        rijen.extend(nieuw)

    # Een metrostation is ook "ondergronds"; tel het maar één keer.
    metro_ids = {r["id"] for r in rijen if r["soort"] == "metrostation"}
    rijen = [r for r in rijen if not (r["soort"] == "ondergronds station"
                                      and r["id"] in metro_ids)]
    rijen = ontdubbel_punten(rijen)
    # Zelfde object in twee soorten (bv. bunker met ondergrondse verdieping): eerste soort wint.
    gezien = set()
    uniek = []
    for r in rijen:
        if r["id"] not in gezien:
            gezien.add(r["id"])
            uniek.append(r)
    rijen = uniek

    if not args.zonder_gemeenten and instellingen.get("plaats") == "dichtstbij":
        rooster = Plaatsrooster(plaatsen_ophalen(land, gebieden))
        for r in rijen:
            if not r["plaats"]:
                r["plaats"] = rooster.zoek(r["lat"], r["lon"])
    elif not args.zonder_gemeenten:
        gemeenten = gemeenten_ophalen(land, args.gemeente_niveau)
        for r in rijen:
            if not r["plaats"]:
                r["plaats"] = zoek_gemeente(r["lon"], r["lat"], gemeenten)

    rijen.sort(key=lambda r: (r["plaats"] or "~", r["soort"], r["naam"] or "", r["id"]))

    features = []
    for r in rijen:
        props = {k: v for k, v in r.items()
                 if k not in ("lat", "lon", "label", "bron", "datum")}
        features.append(op.feature(r["lat"], r["lon"], props))
    collectie = {"type": "FeatureCollection",
                 # Label, bron en datum gelden voor elk punt: één keer bovenaan.
                 "label": LABEL, "bron": BRON, "datum": datum,
                 "features": features}
    tekst = op.compacte_json(collectie)
    grootte = len(tekst.encode("utf-8"))

    # Kwaliteitscontrole en budget.
    doelmap = ROOT / "site" / "public" / "data" / land.lower()
    doelmap.mkdir(parents=True, exist_ok=True)
    metapad = doelmap / "meta.json"
    meta = {}
    if metapad.exists():
        with open(metapad, encoding="utf-8") as f:
            meta = json.load(f)
    with open(ROOT / "pipeline" / "budget.json", encoding="utf-8") as f:
        budget = json.load(f)
    limiet = {**budget.get("lagen", {}),
              **budget.get("landen", {}).get(land, {}).get("lagen", {})}.get("schuilplekken")
    if limiet and grootte > limiet:
        print(f"Budget overschreden: {grootte} > {limiet} bytes; niets weggeschreven.",
              file=sys.stderr)
        return 3
    oud = meta.get("lagen", {}).get("schuilplekken", {}).get("aantal")
    if oud and len(rijen) < oud * (1 - MAX_DALING) and not args.forceer:
        print(f"Kwaliteitscontrole: daling van {oud} naar {len(rijen)}; niets weggeschreven "
              "(gebruik --forceer).", file=sys.stderr)
        return 2

    with open(doelmap / "schuilplekken.geojson", "w", encoding="utf-8") as f:
        f.write(tekst)
    UIT.mkdir(parents=True, exist_ok=True)
    csvpad = UIT / f"{land.lower()}-schuilplekken.csv"
    with open(csvpad, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=KOLOMMEN)
        w.writeheader()
        for r in rijen:
            w.writerow({k: ("" if r.get(k) is None else r[k]) for k in KOLOMMEN})

    meta.setdefault("land", land)
    meta.setdefault("bron", BRON)
    meta.setdefault("lagen", {})
    meta["lagen"]["schuilplekken"] = {"naam": "Mogelijke schuilplekken", "aantal": len(rijen),
                                      "bytes": grootte, "opgehaald": datum}
    with open(metapad, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")

    per_soort = Counter(r["soort"] for r in rijen)
    print(f"\n{len(rijen)} mogelijke schuilplekken, {grootte / 1000:.0f} kB GeoJSON "
          f"in {time.time() - t0:.0f} s")
    for soort in SOORTEN:
        print(f"  {per_soort.get(soort, 0):6d}  {soort}")
    zonder_plaats = sum(1 for r in rijen if not r["plaats"])
    per_plaats = Counter(r["plaats"] for r in rijen if r["plaats"])
    print(f"  {len(per_plaats)} gemeenten met minstens één plek; {zonder_plaats} zonder plaats")
    for plaats, n in per_plaats.most_common(10):
        print(f"    {n:5d}  {plaats}")
    # Samenvatting voor docs/metingen.md
    with open(UIT / f"{land.lower()}-schuilplekken-telling.json", "w", encoding="utf-8") as f:
        json.dump({"datum": datum, "totaal": len(rijen), "bytes": grootte,
                   "seconden": round(time.time() - t0), "per_soort": per_soort,
                   "per_plaats": dict(per_plaats.most_common()),
                   "zonder_plaats": zonder_plaats,
                   "met_openingsuren": sum(1 for r in rijen if r["openingsuren"]),
                   "met_toegang": sum(1 for r in rijen if r["toegang"])},
                  f, ensure_ascii=False, indent=2)
    print(f"Geschreven: {csvpad.relative_to(ROOT)} en "
          f"{(doelmap / 'schuilplekken.geojson').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
