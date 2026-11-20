#!/usr/bin/env python3
"""Catalogus van alles wat je van PlanB72 kunt downloaden.

Eén lijst voor de website, de web-app, het startprogramma en later de apps voor iOS en
Android (zie docs/downloaden.md). Gemaakt uit de bestaande bronnen, die hun eigen formaat
houden:

- site/public/data/kaarten.json     kaartpakketten (Europa, land, regio op straatniveau)
- site/public/data/routes.json      routepakketten per regio (zie lib/routepakketten.ts)
- site/public/data/<land>/meta.json kaartlagen per land (geojson in dezelfde map)
- data/landen/<land>.json           landnamen en talen
- site/dist/<taal>/app/             grootte van de app per taal (na `npm run build`)

Per blok: id, soort, land, niveau, grootte, versie, bestanden (id, pad, grootte,
controlesom) en afhankelijkheden. Je kiest per land, nooit per provincie: een blok als
"België, straatniveau" bundelt alle regiobestanden die in R2 staan (een bestand per land
zou te groot zijn voor de upload en voor telefoons). Zie docs/downloaden.md. De controlesom (sha256) staat er voor wat lokaal
staat; voor de grote pakketten in R2 is ze null tot de pijplijn ze meelevert.

Gebruik:
  python3 pipeline/catalogus.py               # schrijf site/public/data/catalogus.json
  python3 pipeline/catalogus.py --controleer  # foutcode 1 als de catalogus verouderd is
Alleen de standaardbibliotheek.
"""
import argparse
import glob
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "site", "public", "data")
DIST = os.path.join(ROOT, "site", "dist")
UIT = os.path.join(DATA, "catalogus.json")
TALEN = ["nl", "fr", "de", "en"]

# Landgrenzen (over land of een korte brug). Alleen landen die PlanB72 heeft, tellen mee.
BUREN = {
    "be": ["nl", "lu", "fr", "de"],
    "nl": ["be", "de"],
    "lu": ["be", "fr", "de"],
    "fr": ["be", "lu", "de", "ch", "it", "es", "ad", "mc"],
    "de": ["nl", "be", "lu", "fr", "dk", "pl", "cz", "at", "ch"],
}


def lees(pad):
    with open(pad, encoding="utf-8") as f:
        return json.load(f)


def sha256(pad):
    h = hashlib.sha256()
    with open(pad, "rb") as f:
        for stuk in iter(lambda: f.read(1 << 20), b""):
            h.update(stuk)
    return h.hexdigest()


def niveau_van(p):
    if p["groep"] == "europa":
        return "europa"
    if p["groep"] == "regio":
        return "straat"
    return "standaard" if p["maxzoom"] >= 12 else "overzicht"


def deel(p, sleutel="id"):
    return {"id": p[sleutel], "pad": p["pad"], "bytes": p["bytes"], "sha256": p.get("sha256")}


def samen(bbox):
    return [min(b[0] for b in bbox), min(b[1] for b in bbox), max(b[2] for b in bbox), max(b[3] for b in bbox)]


NIVEAUNAAM = {"overzicht": "overzicht", "standaard": "standaard", "straat": "straatniveau"}


def kaartblokken(kaarten, landnamen):
    """Eén blok per land en detailniveau. Grote landen (en elk straatniveau) staan in R2 in
    stukken per regio; die stukken zijn de bestanden van het blok, nooit een keuze op zich."""
    blokken = []
    pakketten = kaarten["pakketten"]
    europa = [p for p in pakketten if p["groep"] == "europa"]
    for p in europa:
        blokken.append({
            "id": p["id"], "soort": "basiskaart", "niveau": "europa",
            "naam": p["naam"], "omschrijving": p["omschrijving"], "bytes": p["bytes"],
            "versie": p.get("build"), "maxzoom": p["maxzoom"], "zak": bool(p.get("zak")),
            "bestanden": [deel(p)], "vereist": [],
        })
    zak_europa = next((p["id"] for p in europa if p.get("zak")), None)
    landen = sorted({p["land"] for p in pakketten if p.get("land")})
    for land in landen:
        for niveau in ("overzicht", "standaard", "straat"):
            delen = [p for p in pakketten if p.get("land") == land and p["groep"] != "europa" and niveau_van(p) == niveau]
            if not delen:
                continue
            vereist = [zak_europa] if niveau == "overzicht" and zak_europa else [f"{land}-overzicht"]
            blokken.append({
                "id": f"{land}-{niveau}",
                "soort": "straat" if niveau == "straat" else "basiskaart",
                "niveau": niveau,
                "land": land,
                "naam": f"{landnamen.get(land, land.upper())}, {NIVEAUNAAM[niveau]}",
                "omschrijving": delen[0]["omschrijving"],
                "bytes": sum(p["bytes"] for p in delen),
                "versie": max((p.get("build") or "") for p in delen) or None,
                "maxzoom": max(p["maxzoom"] for p in delen),
                "bbox": samen([p["bbox"] for p in delen]),
                "zak": all(p.get("zak") for p in delen),
                "bestanden": [deel(p) for p in delen],
                "vereist": vereist,
            })
    return blokken


def routeblokken(routes, landnamen, ids):
    blokken = []
    per_land = {}
    for p in routes["pakketten"]:
        per_land.setdefault(p["id"].split("-")[0], []).append(p)
    for land, delen in sorted(per_land.items()):
        blokken.append({
            "id": f"routes-{land}",
            "soort": "routes",
            "niveau": "straat",
            "land": land,
            "naam": f"{landnamen.get(land, land.upper())}, routes en zoeken",
            "omschrijving": "Routeplanner en zoeken op plaats of straat",
            "bytes": sum(p["bytes"] for p in delen),
            "versie": max((p.get("osm") or "") for p in delen) or None,
            "bbox": samen([p["bbox"] for p in delen]),
            "zak": False,
            "bestanden": [deel(p) for p in delen],
            "vereist": [f"{land}-overzicht"] if f"{land}-overzicht" in ids else [],
        })
    return blokken


def lagenblok(code):
    map_ = os.path.join(DATA, code)
    meta = lees(os.path.join(map_, "meta.json"))
    bestanden = []
    for pad in sorted(glob.glob(os.path.join(map_, "*.geojson"))) + [os.path.join(map_, "meta.json")]:
        bestanden.append({
            "pad": "/" + os.path.relpath(pad, os.path.join(ROOT, "site", "public")).replace(os.sep, "/"),
            "bytes": os.path.getsize(pad),
            "sha256": sha256(pad),
        })
    return {
        "id": f"lagen-{code}",
        "soort": "lagen",
        "niveau": "overzicht",
        "land": code,
        "naam": "Kaartlagen",
        "omschrijving": ", ".join(l["naam"] for l in meta["lagen"].values()),
        "bytes": sum(b["bytes"] for b in bestanden),
        "versie": meta.get("opgehaald"),
        "zak": True,
        "bestanden": bestanden,
        "vereist": [],
    }


def taalgrootte(taal, vorige):
    """Grootte van de app in een taal, uit de laatste build; anders de vorige waarde."""
    map_ = os.path.join(DIST, "app") if taal == "nl" else os.path.join(DIST, taal, "app")
    if os.path.isdir(map_):
        return sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(map_) for f in fs)
    return vorige.get(f"inhoud-{taal}", {}).get("bytes", 0)


def maak(vorige_blokken):
    kaarten = lees(os.path.join(DATA, "kaarten.json"))
    routes_pad = os.path.join(DATA, "routes.json")
    routes = lees(routes_pad) if os.path.exists(routes_pad) else {"pakketten": []}
    landen = []
    for pad in sorted(glob.glob(os.path.join(ROOT, "data", "landen", "*.json"))):
        l = lees(pad)
        landen.append({"code": l["code"].lower(), "naam": l["naam"], "talen": l.get("talen", [])})
    codes = [l["code"] for l in landen]
    for l in landen:
        l["buren"] = [b for b in BUREN.get(l["code"], []) if b in codes]

    landnamen = {l["code"]: l["naam"]["nl"] for l in landen}
    blokken = kaartblokken(kaarten, landnamen)
    blokken += routeblokken(routes, landnamen, {b["id"] for b in blokken})
    blokken += [lagenblok(c) for c in codes if os.path.exists(os.path.join(DATA, c, "meta.json"))]
    # De inhoud per taal zit in de app zelf (offline kern); hier alleen ter informatie en
    # om talen die je niet nodig hebt van het toestel te kunnen halen.
    for taal in TALEN:
        blokken.append({
            "id": f"inhoud-{taal}",
            "soort": "inhoud",
            "niveau": "overzicht",
            "taal": taal,
            "naam": taal,
            "omschrijving": "App, wat nu, gidsen en landinfo",
            "bytes": taalgrootte(taal, vorige_blokken),
            "versie": None,
            "zak": True,
            "kern": True,
            "bestanden": [],
            "vereist": [],
        })

    ids = {b["id"] for b in blokken}
    for b in blokken:
        for v in b["vereist"]:
            if v not in ids:
                raise SystemExit(f"{b['id']} vereist {v}, dat niet bestaat")
    return {
        "formaat": "planb72-catalogus",
        "versie": 1,
        "bron": "https://planb72.org",
        "bronnen": {"kaarten": kaarten.get("bijgewerkt"), "routes": routes.get("bijgewerkt")},
        "landen": landen,
        "talen": TALEN,
        "blokken": blokken,
    }


def zonder_ruis(cat):
    """Voor de vergelijking: zonder datum van aanmaak en zonder de taalgroottes (die volgen de build)."""
    c = dict(cat)
    c.pop("gemaakt", None)
    c["blokken"] = [{k: v for k, v in b.items() if not (b["soort"] == "inhoud" and k == "bytes")} for b in cat["blokken"]]
    return c


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--controleer", action="store_true", help="niet schrijven; foutcode 1 als de catalogus verouderd is")
    args = ap.parse_args()

    vorige = lees(UIT) if os.path.exists(UIT) else {"blokken": []}
    vorige_blokken = {b["id"]: b for b in vorige.get("blokken", [])}
    nieuw = maak(vorige_blokken)

    if args.controleer:
        if zonder_ruis(nieuw) != zonder_ruis(vorige):
            print("FOUT  site/public/data/catalogus.json is verouderd: draai python3 pipeline/catalogus.py")
            sys.exit(1)
        print(f"Catalogus actueel: {len(nieuw['blokken'])} blokken.")
        return

    nieuw["gemaakt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    with open(UIT, "w", encoding="utf-8") as f:
        json.dump(nieuw, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    soorten = {}
    for b in nieuw["blokken"]:
        soorten[b["soort"]] = soorten.get(b["soort"], 0) + 1
    print(f"{os.path.relpath(UIT, ROOT)}: {len(nieuw['blokken'])} blokken ({', '.join(f'{k} {v}' for k, v in soorten.items())}), "
          f"{os.path.getsize(UIT) / 1024:.0f} kB")


if __name__ == "__main__":
    main()
