#!/usr/bin/env python3
"""Nucleaire sites en noodplanningszones als GeoJSON.

Leest data/landen/<land>.json (blok "nucleair") en schrijft
site/public/data/<land>/nucleair.geojson met:
  - per zone een cirkel (polygoon met 64 punten) met properties
    {site, zone: "uitbreiding" | "schuilen" | "evacuatie", km};
  - per site een punt met {site, naam, soort, land, schuilen_km, jodium_km, evacuatie_km}.

Volgorde: eerst de grote cirkels, dan de kleine, dan de punten, zodat een
kaart ze in die volgorde kan tekenen.

De uitbreidingszone: een site mag een eigen veld uitbreidingszone_km hebben.
Anders geldt de landwaarde nucleair.uitbreidingszone_km, en dan alleen voor
sites van de soort "Kerncentrale" (zo staat het in de landdata en het plan).
Een zone die null is, wordt niet getekend.

Gebruik:
    python3 pipeline/nucleair.py          # België
    python3 pipeline/nucleair.py NL
"""

import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import overpass as op  # noqa: E402  (compacte_json, rond)

ROOT = Path(__file__).resolve().parent.parent
PUNTEN = 64
AARDSTRAAL = 6371008.8


def cirkel(lat, lon, km, n=PUNTEN):
    """Geodetische cirkel: n punten op afstand km van het middelpunt, gesloten ring."""
    d = km * 1000 / AARDSTRAAL
    f1, l1 = math.radians(lat), math.radians(lon)
    ring = []
    for i in range(n):
        richting = 2 * math.pi * i / n
        f2 = math.asin(math.sin(f1) * math.cos(d)
                       + math.cos(f1) * math.sin(d) * math.cos(richting))
        l2 = l1 + math.atan2(math.sin(richting) * math.sin(d) * math.cos(f1),
                             math.cos(d) - math.sin(f1) * math.sin(f2))
        ring.append([op.rond(math.degrees(l2)), op.rond(math.degrees(f2))])
    ring.append(ring[0])
    # GeoJSON (RFC 7946): buitenring tegen de klok in. Richting 0 = noord, met de
    # klok mee; dus omdraaien.
    return ring[::-1]


def main():
    p = argparse.ArgumentParser(description="Nucleaire sites en zones als GeoJSON.")
    p.add_argument("land", nargs="?", default="BE")
    args = p.parse_args()
    land = args.land.upper()

    with open(ROOT / "data" / "landen" / f"{land.lower()}.json", encoding="utf-8") as f:
        nucleair = json.load(f)["nucleair"]
    standaard_uitbreiding = nucleair.get("uitbreidingszone_km")

    zones, punten = [], []
    for s in nucleair["sites"]:
        uitbreiding = s.get("uitbreidingszone_km")
        if uitbreiding is None and s.get("soort") == "Kerncentrale":
            uitbreiding = standaard_uitbreiding
        for zone, km in (("uitbreiding", uitbreiding), ("schuilen", s.get("schuilen_km")),
                         ("evacuatie", s.get("evacuatie_km"))):
            if km is None:
                continue
            zones.append({"type": "Feature",
                          "geometry": {"type": "Polygon",
                                       "coordinates": [cirkel(s["lat"], s["lon"], km)]},
                          "properties": {"site": s["id"], "zone": zone, "km": km}})
        punten.append({"type": "Feature",
                       "geometry": {"type": "Point",
                                    "coordinates": [op.rond(s["lon"]), op.rond(s["lat"])]},
                       "properties": {k: v for k, v in {
                           "site": s["id"], "naam": s["naam"], "soort": s["soort"],
                           "land": s.get("land"), "schuilen_km": s.get("schuilen_km"),
                           "jodium_km": s.get("jodium_km"),
                           "evacuatie_km": s.get("evacuatie_km")}.items() if v is not None}})
    zones.sort(key=lambda f: -f["properties"]["km"])

    collectie = {"type": "FeatureCollection",
                 "bron": nucleair.get("zones_bron") or nucleair.get("bron"),
                 "coordinaten_status": nucleair.get("coordinaten_status"),
                 "features": zones + punten}
    tekst = op.compacte_json(collectie)
    grootte = len(tekst.encode("utf-8"))

    with open(ROOT / "pipeline" / "budget.json", encoding="utf-8") as f:
        limiet = json.load(f).get("lagen", {}).get("nucleair")
    if limiet and grootte > limiet:
        print(f"Budget overschreden: {grootte} > {limiet} bytes", file=sys.stderr)
        return 3

    doelmap = ROOT / "site" / "public" / "data" / land.lower()
    doelmap.mkdir(parents=True, exist_ok=True)
    with open(doelmap / "nucleair.geojson", "w", encoding="utf-8") as f:
        f.write(tekst)

    metapad = doelmap / "meta.json"
    meta = {}
    if metapad.exists():
        with open(metapad, encoding="utf-8") as f:
            meta = json.load(f)
    meta.setdefault("land", land)
    meta.setdefault("lagen", {})
    meta["lagen"]["nucleair"] = {"naam": "Nucleaire sites en zones", "aantal": len(punten),
                                 "zones": len(zones), "bytes": grootte,
                                 "bron": "data/landen/" + land.lower() + ".json"}
    with open(metapad, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(punten)} sites, {len(zones)} zones, {grootte / 1000:.1f} kB -> "
          f"{(doelmap / 'nucleair.geojson').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
