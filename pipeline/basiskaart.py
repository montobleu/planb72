#!/usr/bin/env python3
"""Basiskaart meten en een overzichtskaart maken (fase 0, "groottes meten").

Zoekt de recentste dagelijkse build van Protomaps, knipt het land eruit
(bbox uit data/landen/<land>.json) voor meerdere maximale zoomniveaus,
meet grootte en duur, en kopieert de grootste versie die onder de limiet
blijft naar site/public/data/<land>/basis.pmtiles.

Vereist de opdracht `pmtiles` (brew install pmtiles, of de release van
github.com/protomaps/go-pmtiles).

Gebruik:
    python3 pipeline/basiskaart.py                 # BE, zoom 8 10 12 14
    python3 pipeline/basiskaart.py --zooms 8 10    # alleen deze
    python3 pipeline/basiskaart.py --build 20261117
"""

import argparse
import datetime as dt
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "pipeline" / "out"
USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"
BUILDS_URL = "https://build-metadata.protomaps.dev/builds.json"
BUILD_BASIS = "https://build.protomaps.com/"


def lees_budget():
    pad = ROOT / "pipeline" / "budget.json"
    if pad.exists():
        with open(pad, encoding="utf-8") as f:
            return json.load(f)
    return {}


def zoek_build(datum=None):
    """Geeft de info van een build uit builds.json: de recentste, of die van datum."""
    req = urllib.request.Request(BUILDS_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        builds = json.load(r)
    builds = [b for b in builds if b.get("key", "").endswith(".pmtiles")]
    builds.sort(key=lambda b: b["key"])
    if datum:
        for b in builds:
            if b["key"] == f"{datum}.pmtiles":
                return b
        return {"key": f"{datum}.pmtiles"}
    return builds[-1]


def schema_versie(pad):
    """Leest de versie van het tegelschema uit de metadata van het bestand."""
    try:
        uit = subprocess.run(["pmtiles", "show", str(pad), "--metadata"],
                             capture_output=True, text=True, check=True).stdout
        meta = json.loads(uit)
        return meta.get("version") or meta.get("planetiler:version"), meta
    except Exception as e:  # noqa: BLE001
        return None, {"fout": str(e)}


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("land", nargs="?", default="BE")
    p.add_argument("--zooms", nargs="+", type=int, default=[8, 10, 12, 14])
    p.add_argument("--build", help="builddatum JJJJMMDD (standaard: recentste)")
    p.add_argument("--limiet-mb", type=float, default=None,
                   help="maximale grootte van de overzichtskaart in MB "
                        "(standaard uit budget.json, anders 20)")
    args = p.parse_args()

    land = args.land.upper()
    with open(ROOT / "data" / "landen" / f"{land.lower()}.json", encoding="utf-8") as f:
        landdata = json.load(f)
    bbox = ",".join(str(x) for x in landdata["bbox"])

    bouwinfo = zoek_build(args.build)
    sleutel = bouwinfo["key"]
    url = BUILD_BASIS + sleutel
    print(f"Build: {url} (versie {bouwinfo.get('version', '?')})")

    budget = lees_budget()
    limiet_mb = args.limiet_mb or budget.get("basiskaart_overzicht_mb", 20)
    UIT.mkdir(parents=True, exist_ok=True)

    metingen = []
    for z in sorted(args.zooms):
        doel = UIT / f"{land.lower()}-z{z}.pmtiles"
        if doel.exists():
            doel.unlink()
        print(f"  extract maxzoom {z} ...", flush=True)
        t0 = time.time()
        subprocess.run(["pmtiles", "extract", url, str(doel), f"--bbox={bbox}",
                        f"--maxzoom={z}", "--download-threads=4", "-q"], check=True)
        duur = time.time() - t0
        grootte = doel.stat().st_size
        metingen.append({"maxzoom": z, "bytes": grootte, "mb": round(grootte / 1e6, 1),
                         "seconden": round(duur, 1), "bestand": str(doel.relative_to(ROOT))})
        print(f"    {grootte / 1e6:.1f} MB in {duur:.0f} s", flush=True)

    versie, meta = schema_versie(UIT / f"{land.lower()}-z{min(args.zooms)}.pmtiles")
    passend = [m for m in metingen if m["bytes"] < limiet_mb * 1e6]
    gekozen = max(passend, key=lambda m: m["maxzoom"]) if passend else None
    if gekozen:
        doel = ROOT / "site" / "public" / "data" / land.lower() / "basis.pmtiles"
        doel.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / gekozen["bestand"], doel)
        print(f"Overzichtskaart: maxzoom {gekozen['maxzoom']} -> {doel.relative_to(ROOT)}")
    else:
        print(f"Geen enkele extract kleiner dan {limiet_mb} MB", file=sys.stderr)

    verslag = {
        "land": land,
        "gemeten": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "build": sleutel,
        "build_url": url,
        "build_info": bouwinfo,
        "bbox": landdata["bbox"],
        "schema_versie": versie,
        "metadata_kort": {k: meta.get(k) for k in ("name", "description", "version",
                                                    "planetiler:version",
                                                    "planetiler:osm:osmosisreplicationtime",
                                                    "attribution") if k in meta},
        "limiet_mb": limiet_mb,
        "overzichtskaart_maxzoom": gekozen["maxzoom"] if gekozen else None,
        "metingen": metingen,
    }
    with open(UIT / f"{land.lower()}-basiskaart-metingen.json", "w", encoding="utf-8") as f:
        json.dump(verslag, f, ensure_ascii=False, indent=2)
    return 0 if gekozen else 3


if __name__ == "__main__":
    sys.exit(main())
