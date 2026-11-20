#!/usr/bin/env python3
"""Dekking van een kaartlaag meten per provincie en per gemeente (België).

Vergelijkt de ruwe laag uit OpenStreetMap (pipeline/out/osm/<land>/<laag>.geojson), of met --voor een andere
toestand (bv. de laag zonder open bronnen in pipeline/out/voor/<land>/), met de gepubliceerde, verrijkte laag (site/public/data/<land>/<laag>.geojson). Elk punt krijgt de gemeente uit het adressenbestand
BeST van BOSA (pipeline/adressen.py: het dichtstbijzijnde adres, raster van ongeveer 200 m).

Uitvoer:
  pipeline/out/<land>-dekking-<laag>-gemeenten.csv   per gemeente: voor, na, per herkomst, per zekerheid
  pipeline/out/<land>-dekking-<laag>.json            samenvatting per provincie en totalen
en een Markdown-tabel op het scherm (voor docs/metingen.md).

Gebruik:
    python3 pipeline/dekking.py BE dierenarts
    python3 pipeline/dekking.py BE apotheken --gemeenten Meise Lennik
    python3 pipeline/dekking.py BE dierenarts --voor pipeline/out/voor/be   # effect van de open bronnen
"""
import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import adressen  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pipeline" / "out"


def lees(pad):
    with open(pad, encoding="utf-8") as f:
        return json.load(f)["features"]


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("land", choices=["BE"])
    p.add_argument("laag")
    p.add_argument("--gemeenten", nargs="*", default=[], help="toon de punten in deze gemeenten (steekproef)")
    p.add_argument("--voor", help="map met de laag van vóór (standaard de ruwe OSM-laag)")
    args = p.parse_args()
    land = args.land.lower()
    voor = lees((Path(args.voor) if args.voor else OUT / "osm" / land) / f"{args.laag}.geojson")
    na = lees(ROOT / "site" / "public" / "data" / land / f"{args.laag}.geojson")
    geo = adressen.geocoder()
    geo._laad_gemeenten()
    namen = geo.gemeentenamen

    def naam_van(nis):
        n = namen.get(nis, {})
        return n.get("nl") or n.get("fr") or n.get("de") or str(nis)

    per = {nis: {"voor": 0, "na": 0, "officieel": 0, "nagekeken": 0, "osm": 0, "open-bron": 0, "bevestigd": 0,
                 "zeker": 0, "onzeker": 0}
           for nis in namen}
    punten = {}
    for f in voor:
        nis = geo.gemeente(*f["geometry"]["coordinates"])
        if nis in per:
            per[nis]["voor"] += 1
    for f in na:
        nis = geo.gemeente(*f["geometry"]["coordinates"])
        if nis not in per:
            continue
        pr = f["properties"]
        per[nis]["na"] += 1
        per[nis][pr.get("betrouwbaarheid", "osm")] += 1
        per[nis]["onzeker" if pr.get("praktijk") in ("onzeker", "zetel") or pr.get("zekerheid") == "onzeker"
                  else "zeker"] += 1
        per[nis]["bevestigd"] += pr.get("zekerheid") == "bevestigd"
        punten.setdefault(nis, []).append(pr)

    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / f"{land}-dekking-{args.laag}-gemeenten.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["nis", "gemeente", "provincie", "adressen", "voor", "na", "officieel", "nagekeken", "osm",
                    "open_bron", "bevestigd", "zeker", "onzeker"])
        for nis, t in sorted(per.items()):
            w.writerow([nis, naam_van(nis), adressen.provincie(nis), namen[nis]["adressen"], t["voor"], t["na"],
                        t["officieel"], t["nagekeken"], t["osm"], t["open-bron"], t["bevestigd"], t["zeker"], t["onzeker"]])

    provs = {}
    for nis, t in per.items():
        pv = provs.setdefault(adressen.provincie(nis), {"gemeenten": 0, "zonder_voor": 0, "zonder_na": 0,
                                                         "voor": 0, "na": 0, "officieel": 0, "osm": 0, "open-bron": 0,
                                                         "bevestigd": 0, "onzeker": 0})
        pv["gemeenten"] += 1
        pv["zonder_voor"] += t["voor"] == 0
        pv["zonder_na"] += t["na"] == 0
        for k in ("voor", "na", "officieel", "osm", "open-bron", "bevestigd", "onzeker"):
            pv[k] += t[k]
    totaal = {k: sum(v[k] for v in provs.values()) for k in next(iter(provs.values()))}
    with open(OUT / f"{land}-dekking-{args.laag}.json", "w", encoding="utf-8") as f:
        json.dump({"provincies": provs, "totaal": totaal}, f, ensure_ascii=False, indent=2)

    print("| Provincie | Gemeenten | Zonder punt voor | Zonder punt na | Voor | Na | Officieel | OSM | Open bron | "
          "Bevestigd | Waarvan onzeker |")
    print("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
    for naam, v in sorted(provs.items()):
        print(f"| {naam} | {v['gemeenten']} | {v['zonder_voor']} | {v['zonder_na']} | {v['voor']} | {v['na']} | "
              f"{v['officieel']} | {v['osm']} | {v['open-bron']} | {v['bevestigd']} | {v['onzeker']} |")
    v = totaal
    print(f"| **totaal** | **{v['gemeenten']}** | **{v['zonder_voor']}** | **{v['zonder_na']}** | **{v['voor']}** | "
          f"**{v['na']}** | **{v['officieel']}** | **{v['osm']}** | **{v['open-bron']}** | **{v['bevestigd']}** | "
          f"**{v['onzeker']}** |")

    gezocht = {x.lower() for x in args.gemeenten}
    for nis in sorted(per):
        if {naam_van(nis).lower(), str(namen[nis].get("fr", "")).lower()} & gezocht:
            print(f"\n{naam_van(nis)} ({nis}): voor {per[nis]['voor']}, na {per[nis]['na']}")
            for pr in punten.get(nis, []):
                print(f"  - {pr.get('naam')} | {pr.get('adres')} | {pr.get('betrouwbaarheid')} | {pr.get('praktijk', '')} | "
                      f"{pr.get('zekerheid', '')} | {pr.get('herkomst', '')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
