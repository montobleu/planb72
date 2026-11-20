#!/usr/bin/env python3
"""Regio's per land voor de kaartpakketten op straatniveau.

Haalt de bestuurlijke grenzen uit het Geofabrik-extract (zie pipeline/pbf.py) en
schrijft per land de regio's met naam en bbox naar pipeline/regios.json:
  - Nederland: provincies (admin_level 4)
  - Duitsland: deelstaten (4) en Regierungsbezirke (5) waar die bestaan
  - Frankrijk: regio's (4) en departementen (6)
  - Luxemburg: geen onderverdeling nodig (het hele land past in één pakket)
Een onderverdeling krijgt als "ouder" de regio waarin haar middelpunt ligt.

Gebruik:
    python3 pipeline/regios.py NL DE FR
"""

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pbf  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "pipeline" / "regios.json"
NIVEAUS = {"NL": ["4"], "DE": ["4", "5"], "FR": ["4", "6"], "LU": []}
# Niveaus waarop elke regio van het land een ISO 3166-2-code heeft. Daar is de code
# verplicht: van een buurregio zit maar een rand in het extract, en het middelpunt van
# die rand kan binnen het land vallen. (Regierungsbezirke hebben geen ISO-code.)
ISO_VERPLICHT = {"NL": {"4"}, "DE": {"4"}, "FR": {"4", "6"}}


def slug(tekst):
    tekst = re.sub(r"^Regierungsbezirk\s+", "", tekst).replace("ß", "ss")
    t = unicodedata.normalize("NFKD", tekst).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def filt(land, niveau):
    return f'rel["boundary"="administrative"]["admin_level"="{niveau}"]'


def main():
    p = argparse.ArgumentParser(description="Regio's per land voor de kaartpakketten.")
    p.add_argument("landen", nargs="+")
    args = p.parse_args()
    alles = json.loads(UIT.read_text(encoding="utf-8")) if UIT.exists() else {}
    for land in (l.upper() for l in args.landen):
        niveaus = NIVEAUS.get(land, ["4"])
        if not niveaus:
            alles[land] = []
            continue
        filters = [filt(land, n) for n in niveaus]
        index = pbf.index(land, filters)
        grens = pbf.grens(land)
        lijst, vormen = [], {}
        for niveau in niveaus:
            for el in index.zoek([filt(land, niveau)], geom=True):
                tags = el["tags"]
                code = tags.get("ISO3166-2", "")
                c = el["center"]
                # Alleen regio's van dit land: ISO-code van het land, of middelpunt binnen de grens.
                if code and not code.startswith(land + "-"):
                    continue
                if not code and grens is not None and not grens.binnen(c["lat"], c["lon"]):
                    continue
                if not code and niveau in ISO_VERPLICHT.get(land, {"4"}):
                    continue
                b = el["bounds"]
                naam_lok = tags.get("name")
                naam = re.sub(r"^Regierungsbezirk\s+", "", tags.get("name:nl") or naam_lok)
                rid = slug(code.split("-", 1)[1]) if code else slug(naam_lok)
                lijnen = [[[g["lon"], g["lat"]] for g in m["geometry"]]
                          for m in el.get("members", []) if m.get("geometry")]
                item = {"id": rid, "naam": naam, "naam_lokaal": naam_lok, "niveau": niveau,
                        "iso": code or None, "osm": f"relation/{el['id']}",
                        "bbox": [round(b["minlon"], 3), round(b["minlat"], 3),
                                 round(b["maxlon"], 3), round(b["maxlat"], 3)]}
                if niveau == niveaus[0]:
                    vormen[rid] = pbf.Grens(lijnen)
                else:
                    item["ouder"] = next((o for o, v in vormen.items() if v.binnen(c["lat"], c["lon"])), None)
                lijst.append(item)
        lijst.sort(key=lambda r: (r["niveau"], r.get("ouder") or "", r["id"]))
        alles[land] = lijst
        print(f"{land}: " + ", ".join(f"{sum(1 for r in lijst if r['niveau'] == n)} op niveau {n}" for n in niveaus))
    UIT.write_text(json.dumps(alles, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
