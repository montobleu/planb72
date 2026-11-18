#!/usr/bin/env python3
"""Dekking van de kaartlagen per regio, voor elk land (eenvoudige telling).

Vergelijkt een vorige toestand van de lagen (standaard pipeline/out/voor/<land>/, bv. de lagen vóór de open
bronnen) met de gepubliceerde lagen in site/public/data/<land>/. Elk punt telt in de regio (admin_level 4 uit
pipeline/regios.json: provincie, deelstaat, regio) met het kleinste kader waarin het ligt. Dat is een benadering
aan de randen, genoeg om te zien waar een bron punten toevoegt. Luxemburg telt als één regio; voor België per
gemeente: pipeline/dekking.py.

Gebruik:
    python3 pipeline/dekking_regio.py NL                    # alle lagen, totalen per laag
    python3 pipeline/dekking_regio.py DE --laag apotheken   # per deelstaat
Uitvoer: Markdown-tabellen op het scherm (voor docs/metingen.md) en pipeline/out/<land>-dekking-regio.json.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pipeline" / "out"
LAGEN = ["ziekenhuizen", "medisch", "politie", "brandweer", "apotheken", "aed", "drinkwater", "overheid", "dierenarts"]


def lees(pad):
    if not pad.exists():
        return []
    with open(pad, encoding="utf-8") as f:
        return json.load(f)["features"]


def regio_zoeker(land):
    regios = [r for r in json.load(open(ROOT / "pipeline" / "regios.json", encoding="utf-8")).get(land, [])
              if r.get("niveau") == "4"]

    def zoek(lon, lat):
        beste = None
        for r in regios:
            x0, y0, x1, y1 = r["bbox"]
            if x0 <= lon <= x1 and y0 <= lat <= y1:
                opp = (x1 - x0) * (y1 - y0)
                if beste is None or opp < beste[0]:
                    beste = (opp, r["naam"])
        return beste[1] if beste else ("Luxemburg" if land == "LU" else "(buiten de regio's)")
    return zoek


def telling(features, zoek):
    per = {}
    for f in features:
        lon, lat = f["geometry"]["coordinates"]
        p = f["properties"]
        t = per.setdefault(zoek(lon, lat), {"n": 0, "open-bron": 0, "bevestigd": 0, "onzeker": 0})
        t["n"] += 1
        t["open-bron"] += p.get("betrouwbaarheid") == "open-bron"
        t["bevestigd"] += p.get("zekerheid") == "bevestigd"
        t["onzeker"] += p.get("zekerheid") == "onzeker" or p.get("praktijk") == "onzeker"
    return per


def main():
    a = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    a.add_argument("land", choices=["BE", "NL", "LU", "FR", "DE"])
    a.add_argument("--laag", choices=LAGEN, help="per regio voor deze laag")
    a.add_argument("--voor", help="map met de vorige toestand (standaard pipeline/out/voor/<land>)")
    args = a.parse_args()
    land = args.land.lower()
    voor_map = Path(args.voor) if args.voor else OUT / "voor" / land
    na_map = ROOT / "site" / "public" / "data" / land
    zoek = regio_zoeker(args.land)
    resultaat = {}
    for laag in ([args.laag] if args.laag else LAGEN):
        v, n = telling(lees(voor_map / f"{laag}.geojson"), zoek), telling(lees(na_map / f"{laag}.geojson"), zoek)
        resultaat[laag] = {r: {"voor": v.get(r, {}).get("n", 0), **n.get(r, {"n": 0})} for r in sorted(set(v) | set(n))}
    with open(OUT / f"{land}-dekking-regio.json", "w", encoding="utf-8") as f:
        json.dump(resultaat, f, ensure_ascii=False, indent=2)

    if args.laag:
        print(f"| Regio | Voor | Na | Open bron (nieuw) | Bevestigd | Onzeker |")
        print("| --- | ---: | ---: | ---: | ---: | ---: |")
        for r, t in resultaat[args.laag].items():
            print(f"| {r} | {t['voor']} | {t['n']} | {t['open-bron']} | {t['bevestigd']} | {t['onzeker']} |")
    som = lambda laag, k: sum(t[k] for t in resultaat[laag].values())  # noqa: E731
    print(f"\n| Laag | Voor | Na | Open bron (nieuw) | Bevestigd | Onzeker |")
    print("| --- | ---: | ---: | ---: | ---: | ---: |")
    for laag in resultaat:
        print(f"| {laag} | {som(laag, 'voor')} | {som(laag, 'n')} | {som(laag, 'open-bron')} | "
              f"{som(laag, 'bevestigd')} | {som(laag, 'onzeker')} |")
    return 0


if __name__ == "__main__":
    sys.exit(main())
