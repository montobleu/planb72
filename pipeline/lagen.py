#!/usr/bin/env python3
"""Kaartlagen uit OpenStreetMap halen via de Overpass API.

Per laag één query, uitvoer als compacte GeoJSON in
site/public/data/<land>/<laag>.geojson, plus meta.json met aantallen en groottes.

Kwaliteitscontrole:
  - daalt een laag meer dan 5% in aantal tegenover de vorige meta.json,
    dan stopt het script met foutcode 2 (tenzij --forceer);
  - overschrijdt een laag haar budget uit pipeline/budget.json, dan stopt
    het script met foutcode 3.
In beide gevallen wordt er niets weggeschreven.

Gebruik:
    python3 pipeline/lagen.py              # België
    python3 pipeline/lagen.py NL
    python3 pipeline/lagen.py BE --lagen ziekenhuizen aed
    python3 pipeline/lagen.py BE --forceer

Grote landen (Frankrijk, Duitsland) worden per regio opgehaald: zet in
pipeline/budget.json onder "landen" -> code het veld "per_regio" op het
admin_level van de regio's. Het resultaat blijft één bestand per laag en land.
Met "bron": "geofabrik" (of PLANB72_BRON=geofabrik) komt de data uit het
landextract van Geofabrik, lokaal gefilterd met osmium (zie pipeline/pbf.py).
Punten buiten de bbox uit data/landen/<land>.json (overzeese gebieden) vallen weg.
"""

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import overpass as op  # noqa: E402
import pbf  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MAX_DALING = 0.05

# id -> (leesbare naam, lijst Overpass-filters zonder gebiedsfilter)
LAGEN = {
    "ziekenhuizen": ("Ziekenhuizen", ['nwr["amenity"="hospital"]']),
    "medisch": ("Medische posten", ['nwr["amenity"="clinic"]', 'nwr["amenity"="doctors"]',
                                    'nwr["healthcare"="centre"]']),
    "politie": ("Politie", ['nwr["amenity"="police"]']),
    "brandweer": ("Brandweer", ['nwr["amenity"="fire_station"]']),
    "apotheken": ("Apotheken", ['nwr["amenity"="pharmacy"]']),
    "aed": ("AED's", ['nwr["emergency"="defibrillator"]']),
    "drinkwater": ("Drinkwater", ['nwr["amenity"="drinking_water"]',
                                  'nwr["man_made"="water_tap"]["drinking_water"="yes"]']),
    "overheid": ("Gemeentehuizen", ['nwr["amenity"="townhall"]']),
    "dierenarts": ("Dierenartsen", ['nwr["amenity"="veterinary"]']),
}

# Vertaling van OSM-waarden naar het veld "soort".
SOORTEN = {
    ("amenity", "hospital"): "ziekenhuis",
    ("amenity", "clinic"): "kliniek",
    ("amenity", "doctors"): "huisarts of praktijk",
    ("healthcare", "centre"): "gezondheidscentrum",
    ("amenity", "police"): "politie",
    ("amenity", "fire_station"): "brandweer",
    ("amenity", "pharmacy"): "apotheek",
    ("emergency", "defibrillator"): "AED",
    ("amenity", "drinking_water"): "drinkwaterpunt",
    ("man_made", "water_tap"): "waterkraan",
    ("amenity", "townhall"): "gemeentehuis",
    ("amenity", "veterinary"): "dierenarts",
}

# Fijnere soort voor overheid (townhall=* onderscheidt soms stadhuis/provinciehuis).
TOWNHALL = {"city": "stadhuis", "municipality": "gemeentehuis", "village": "gemeentehuis",
            "province": "provinciehuis", "district": "districtshuis"}


def soort_van(laag, tags):
    if laag == "overheid":
        return TOWNHALL.get(tags.get("townhall:type", ""), "gemeentehuis")
    for (k, v), soort in SOORTEN.items():
        if tags.get(k) == v:
            return soort
    return laag


def query_voor(gebiedsregel, filters):
    delen = "\n  ".join(f"{f}(area.land);" for f in filters)
    return (f"[out:json][timeout:900];\n{gebiedsregel}\n(\n  {delen}\n);\n"
            "out center tags;")


def maak_feature(laag, el):
    tags = el.get("tags", {})
    punt = op.punt_van(el)
    if not punt:
        return None
    props = {
        "id": op.osm_id(el),
        "naam": op.naam_van(tags),
        "soort": soort_van(laag, tags),
    }
    if laag == "ziekenhuizen":
        props["emergency"] = op.ja_nee(tags.get("emergency"))
    props["openingsuren"] = tags.get("opening_hours")
    props["toegang"] = tags.get("access")
    if laag in ("aed", "drinkwater", "apotheken"):
        props["binnen"] = op.ja_nee(tags.get("indoor"))
    props["adres"] = op.adres_van(tags)
    props["betrouwbaarheid"] = "osm"
    return op.feature(punt[0], punt[1], props)


def haal_laag(land, laag, gebieden, bbox=None, grens=None):
    """Haalt een laag op, per gebied (heel land of per regio), zonder dubbels.

    Punten buiten de bbox van het land (overzeese gebieden) vallen weg, en bij een
    Geofabrik-extract ook punten buiten de landsgrens.
    """
    naam, filters = LAGEN[laag]
    gezien = set()
    features = []
    totaal = {"_seconden": 0.0, "_server": set()}
    for label, regel in gebieden:
        if regel is None:  # Geofabrik-extract in plaats van Overpass
            t0 = time.time()
            alle = [f for _, fs in LAGEN.values() for f in fs]
            antwoord = pbf.antwoord(pbf.index(land, alle).zoek(filters), t0)
        else:
            antwoord = op.vraag(query_voor(regel, filters))
        totaal["_seconden"] += antwoord["_seconden"]
        totaal["_server"].add(antwoord["_server"].split("/")[2])
        if len(gebieden) > 1:
            print(f"    {label}: {len(antwoord.get('elements', []))} "
                  f"({antwoord['_seconden']} s)", flush=True)
        for el in antwoord.get("elements", []):
            if op.osm_id(el) in gezien:
                continue
            gezien.add(op.osm_id(el))
            f = maak_feature(laag, el)
            if f:
                lon, lat = f["geometry"]["coordinates"]
                if op.in_bbox(lat, lon, bbox) and (grens is None or grens.binnen(lat, lon)):
                    features.append(f)
    features.sort(key=lambda f: f["properties"]["id"])
    totaal["_seconden"] = round(totaal["_seconden"], 1)
    totaal["_server"] = ", ".join(sorted(totaal["_server"]))
    return features, totaal


def main():
    p = argparse.ArgumentParser(description="Kaartlagen uit OpenStreetMap halen.")
    p.add_argument("land", nargs="?", default="BE", help="ISO-landcode (standaard BE)")
    p.add_argument("--lagen", nargs="+", choices=sorted(LAGEN), help="alleen deze lagen")
    p.add_argument("--forceer", action="store_true",
                   help="schrijf ook weg als een laag meer dan 5%% daalt")
    args = p.parse_args()

    land = args.land.upper()
    doelmap = ROOT / "site" / "public" / "data" / land.lower()
    doelmap.mkdir(parents=True, exist_ok=True)
    metapad = doelmap / "meta.json"
    vorige = {}
    if metapad.exists():
        with open(metapad, encoding="utf-8") as f:
            vorige = json.load(f)

    with open(ROOT / "pipeline" / "budget.json", encoding="utf-8") as f:
        budget = json.load(f)
    budget_lagen = {**budget.get("lagen", {}),
                    **budget.get("landen", {}).get(land, {}).get("lagen", {})}

    gekozen = args.lagen or list(LAGEN)
    gebieden = [(land, None)] if pbf.gekozen(land) else op.gebieden(land)
    bbox = op.lees_land(land).get("bbox")
    grens = pbf.grens(land) if pbf.gekozen(land) else None
    if len(gebieden) > 1:
        print(f"{land}: per regio, {len(gebieden)} gebieden", flush=True)
    resultaten = {}
    problemen = []
    t_start = time.time()
    for laag in gekozen:
        print(f"{laag}: ophalen ...", flush=True)
        features, antwoord = haal_laag(land, laag, gebieden, bbox, grens)
        tekst = op.compacte_json({"type": "FeatureCollection", "features": features})
        grootte = len(tekst.encode("utf-8"))
        resultaten[laag] = (tekst, len(features), grootte)
        print(f"  {len(features)} punten, {grootte / 1000:.0f} kB "
              f"({antwoord['_seconden']} s via {antwoord['_server']})", flush=True)

        oud = vorige.get("lagen", {}).get(laag, {}).get("aantal")
        if oud and len(features) < oud * (1 - MAX_DALING):
            problemen.append(("daling", f"{laag}: daalt van {oud} naar {len(features)} "
                                        f"(-{100 * (oud - len(features)) / oud:.1f}%)"))
        limiet = budget_lagen.get(laag, budget.get("standaard_laag"))
        if limiet and grootte > limiet:
            problemen.append(("budget", f"{laag}: {grootte} bytes > budget {limiet}"))

    for soort, tekst in problemen:
        print(f"PROBLEEM ({soort}): {tekst}", file=sys.stderr)
    if any(s == "budget" for s, _ in problemen):
        print("Budget overschreden: niets weggeschreven.", file=sys.stderr)
        return 3
    if any(s == "daling" for s, _ in problemen) and not args.forceer:
        print("Kwaliteitscontrole mislukt: niets weggeschreven. Gebruik --forceer "
              "als de daling verklaard is.", file=sys.stderr)
        return 2

    meta = {
        "land": land,
        "opgehaald": dt.date.today().isoformat(),
        "bron": "© OpenStreetMap-bijdragers, ODbL",
        # Andere blokken (schuilplekken, nucleair) blijven staan.
        "lagen": dict(vorige.get("lagen", {})),
    }
    for laag, (tekst, aantal, grootte) in resultaten.items():
        with open(doelmap / f"{laag}.geojson", "w", encoding="utf-8") as f:
            f.write(tekst)
        meta["lagen"][laag] = {"naam": LAGEN[laag][0], "aantal": aantal, "bytes": grootte}
    with open(metapad, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Klaar in {time.time() - t_start:.0f} s; {metapad.relative_to(ROOT)} bijgewerkt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
