#!/usr/bin/env python3
"""Kaartpakketten maken voor offline gebruik.

Knipt uit de dagelijkse Protomaps-build (OpenStreetMap, ODbL) een reeks PMTiles-
bestanden: een overzicht van Europa, België op drie detailniveaus en de Belgische
regio's op straatniveau. Schrijft een overzicht naar site/public/data/kaarten.json
dat de app gebruikt om de pakketten aan te bieden.

Gebruik:
  python3 pipeline/kaartpakketten.py                 # alles maken
  python3 pipeline/kaartpakketten.py --alleen be-z12 # één pakket
  python3 pipeline/kaartpakketten.py --upload        # ook naar R2 (wrangler, --remote)

Vereist de opdracht `pmtiles` (brew install pmtiles). Alleen de standaardbibliotheek.
"""
import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UIT = os.path.join(ROOT, "pipeline", "out", "kaarten")
OVERZICHT = os.path.join(ROOT, "site", "public", "data", "kaarten.json")
BUCKET = "planb72-pakketten"
WRANGLER_LIMIET = 300 * 1024 * 1024  # één PUT via wrangler

# id, naam, omschrijving, groep, bbox (west, zuid, oost, noord), maxzoom, standaard in het Zak-pakket
PAKKETTEN = [
    ("eu-z6", "Europa, overzicht", "Landen, grote steden en snelwegen", "europa", [-25, 34, 45, 72], 6, True),
    ("eu-z7", "Europa, uitgebreid overzicht", "Ook middelgrote steden en hoofdwegen", "europa", [-25, 34, 45, 72], 7, False),
    ("be-z9", "België, overzicht", "Gemeenten, hoofdwegen, rivieren", "belgie", [2.54, 49.49, 6.41, 51.51], 9, True),
    ("be-z12", "België, standaard", "Alle wegen en dorpen, geen gebouwen", "belgie", [2.54, 49.49, 6.41, 51.51], 12, False),
    ("be-wvl-z14", "West-Vlaanderen, straatniveau", "Straten, gebouwen en paden", "regio", [2.54, 50.68, 3.47, 51.38], 14, False),
    ("be-ovl-z14", "Oost-Vlaanderen, straatniveau", "Straten, gebouwen en paden", "regio", [3.33, 50.71, 4.33, 51.35], 14, False),
    ("be-ant-z14", "Antwerpen, straatniveau", "Straten, gebouwen en paden", "regio", [4.10, 51.00, 5.25, 51.51], 14, False),
    ("be-lim-z14", "Limburg, straatniveau", "Straten, gebouwen en paden", "regio", [4.95, 50.68, 5.92, 51.26], 14, False),
    ("be-bra-z14", "Brabant en Brussel, straatniveau", "Vlaams-Brabant, Brussel en Waals-Brabant", "regio", [3.98, 50.53, 5.17, 51.06], 14, False),
    ("be-hen-z14", "Henegouwen, straatniveau", "Straten, gebouwen en paden", "regio", [3.10, 50.00, 4.62, 50.82], 14, False),
    ("be-nam-z14", "Namen, straatniveau", "Straten, gebouwen en paden", "regio", [4.30, 49.79, 5.41, 50.66], 14, False),
    ("be-lui-z14", "Luik, straatniveau", "Straten, gebouwen en paden", "regio", [5.02, 50.12, 6.41, 50.82], 14, False),
    ("be-lux-z14", "Luxemburg (provincie), straatniveau", "Straten, gebouwen en paden", "regio", [4.96, 49.49, 6.05, 50.43], 14, False),
]


def recentste_build():
    """Zoek de recentste dagelijkse build (vandaag of de dagen ervoor)."""
    vandaag = dt.date.today()
    for d in range(0, 8):
        datum = (vandaag - dt.timedelta(days=d)).strftime("%Y%m%d")
        url = f"https://build.protomaps.com/{datum}.pmtiles"
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "PlanB72-build/0.1 (+https://planb72.org)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status == 200:
                    return datum, url
        except Exception:
            continue
    sys.exit("Geen recente Protomaps-build gevonden.")


def maak(pakket, build_url, hergebruik=False):
    pid, naam, oms, groep, bbox, maxzoom, zak = pakket
    os.makedirs(UIT, exist_ok=True)
    doel = os.path.join(UIT, f"{pid}.pmtiles")
    begin = time.time()
    if hergebruik and os.path.exists(doel) and os.path.getsize(doel) > 0:
        pass  # bestaand bestand gebruiken
    else:
        for poging in range(1, 4):
            r = subprocess.run(
                ["pmtiles", "extract", build_url, doel, f"--bbox={','.join(map(str, bbox))}", f"--maxzoom={maxzoom}"],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
            )
            if r.returncode == 0:
                break
            print(f"  {pid}: poging {poging} mislukt ({r.stderr.strip()[-120:]}); opnieuw")
            time.sleep(10 * poging)
        else:
            raise SystemExit(f"{pid}: uitknippen mislukt")
    grootte = os.path.getsize(doel)
    print(f"  {pid:12} {grootte / 1048576:8.1f} MB  ({time.time() - begin:.0f} s)")
    return {
        "id": pid, "naam": naam, "omschrijving": oms, "groep": groep, "bbox": bbox, "maxzoom": maxzoom,
        "zak": zak, "bytes": grootte, "pad": f"/data/{pid}.pmtiles", "r2": pid + ".pmtiles",
    }


def upload(item):
    bron = os.path.join(UIT, f"{item['id']}.pmtiles")
    if item["bytes"] > WRANGLER_LIMIET:
        print(f"  {item['id']}: groter dan 300 MB, upload via de S3-API van R2 (rclone) in plaats van wrangler")
        return False
    subprocess.run(
        ["npx", "wrangler", "r2", "object", "put", f"{BUCKET}/{item['r2']}", "--file", bron, "--remote",
         "--content-type", "application/octet-stream"],
        check=True, cwd=os.path.join(ROOT, "site"), stdout=subprocess.DEVNULL,
    )
    print(f"  {item['id']}: geüpload naar R2")
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--alleen", nargs="*", help="alleen deze pakket-id's")
    ap.add_argument("--upload", action="store_true", help="na het maken naar R2 uploaden")
    ap.add_argument("--hergebruik", action="store_true", help="bestaande bestanden in pipeline/out/kaarten niet opnieuw uitknippen")
    args = ap.parse_args()

    datum, url = recentste_build()
    print(f"Protomaps-build {datum}")
    vorige = {}
    if os.path.exists(OVERZICHT):
        vorige = {p["id"]: p for p in json.load(open(OVERZICHT, encoding="utf-8"))["pakketten"]}

    resultaat = dict(vorige)
    for p in PAKKETTEN:
        if args.alleen and p[0] not in args.alleen:
            continue
        item = maak(p, url, args.hergebruik)
        item["build"] = datum
        if args.upload:
            upload(item)
        resultaat[item["id"]] = item

    volgorde = [p[0] for p in PAKKETTEN]
    lijst = [resultaat[i] for i in volgorde if i in resultaat]
    json.dump({
        "bijgewerkt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "bron": "© OpenStreetMap-bijdragers (ODbL), basiskaart Protomaps",
        "pakketten": lijst,
    }, open(OVERZICHT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    totaal = sum(p["bytes"] for p in lijst)
    print(f"{len(lijst)} pakketten, samen {totaal / 1048576:.0f} MB -> {os.path.relpath(OVERZICHT, ROOT)}")


if __name__ == "__main__":
    main()
