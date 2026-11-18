#!/usr/bin/env python3
"""Kaartpakketten maken voor offline gebruik.

Knipt uit de dagelijkse Protomaps-build (OpenStreetMap, ODbL) een reeks PMTiles-
bestanden: een overzicht van Europa, en per land een overzicht (zoom 9), een
standaardkaart (zoom 12) en regio's op straatniveau (zoom 15, het maximum van de
Protomaps-builds). Schrijft een
overzicht naar site/public/data/kaarten.json dat de app gebruikt om de pakketten
aan te bieden.

Een pakket mag niet groter zijn dan 300 MB: zo past het in één upload met
wrangler en blijft een download op een telefoon haalbaar. Is een land of regio
groter, dan wordt het opgedeeld:
  - de standaardkaart per regio (provincie, deelstaat, regio);
  - straatniveau (zoom 15) per regio, anders per onderverdeling (Regierungsbezirk,
    departement), anders in vakken (noordwest, noordoost, ...).
De indeling (het plan) komt in pipeline/kaartpakketten-plan.json en wordt met
--plan opnieuw berekend uit pipeline/regios.json en een proefmeting
(pmtiles extract --dry-run) van elke kandidaat.

Gebruik:
  python3 pipeline/kaartpakketten.py --plan BE NL LU DE FR  # indeling berekenen
  python3 pipeline/kaartpakketten.py                     # alles maken
  python3 pipeline/kaartpakketten.py --land de           # alleen de pakketten van één land
  python3 pipeline/kaartpakketten.py --alleen be-z12     # één pakket
  python3 pipeline/kaartpakketten.py --upload            # ook naar R2 (wrangler, --remote)

Vereist de opdracht `pmtiles` (brew install pmtiles). Alleen de standaardbibliotheek.
"""
import argparse
import datetime as dt
import json
import math
import os
import re
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UIT = os.path.join(ROOT, "pipeline", "out", "kaarten")
OVERZICHT = os.path.join(ROOT, "site", "public", "data", "kaarten.json")
PLAN = os.path.join(ROOT, "pipeline", "kaartpakketten-plan.json")
REGIOS = os.path.join(ROOT, "pipeline", "regios.json")
BUCKET = "planb72-pakketten"
WRANGLER_LIMIET = 300 * 1024 * 1024  # één PUT via wrangler
# Doel voor één pakket bij het plannen; ruim onder de limiet van wrangler.
PAKKET_DOEL = 280 * 1000 * 1000
STRAAT = "Straten, gebouwen en paden"

# Vaste pakketten: Europa en België (zoals in de eerste versie).
# id, naam, omschrijving, groep, land, bbox (west, zuid, oost, noord), maxzoom, standaard in het Zak-pakket
VAST = [
    ("eu-z6", "Europa, overzicht", "Landen, grote steden en snelwegen", "europa", None, [-25, 34, 45, 72], 6, True),
    ("eu-z7", "Europa, uitgebreid overzicht", "Ook middelgrote steden en hoofdwegen", "europa", None, [-25, 34, 45, 72], 7, False),
    ("be-z9", "België, overzicht", "Gemeenten, hoofdwegen, rivieren", "land", "be", [2.54, 49.49, 6.41, 51.51], 9, True),
    ("be-z12", "België, standaard", "Alle wegen en dorpen, geen gebouwen", "land", "be", [2.54, 49.49, 6.41, 51.51], 12, False),
]
# Zoomniveau voor straatniveau: 15 is het hoogste niveau in de Protomaps-builds; de kaart
# vergroot daarboven verder uit (maxZoom in de kaartpagina).
ZOOM_STRAAT = 15

# België: vaste indeling per provincie (Brabant en Brussel samen); straatniveau gaat door de
# planner, zodat een provincie die te groot is in vakken wordt opgedeeld.
BE_REGIOS = [
    {"id": "wvl", "naam": "West-Vlaanderen", "omschrijving": STRAAT, "bbox": [2.54, 50.68, 3.47, 51.38]},
    {"id": "ovl", "naam": "Oost-Vlaanderen", "omschrijving": STRAAT, "bbox": [3.33, 50.71, 4.33, 51.35]},
    {"id": "ant", "naam": "Antwerpen", "omschrijving": STRAAT, "bbox": [4.10, 51.00, 5.25, 51.51]},
    {"id": "lim", "naam": "Limburg", "omschrijving": STRAAT, "bbox": [4.95, 50.68, 5.92, 51.26]},
    {"id": "bra", "naam": "Brabant en Brussel", "omschrijving": "Vlaams-Brabant, Brussel en Waals-Brabant", "bbox": [3.98, 50.53, 5.17, 51.06]},
    {"id": "hen", "naam": "Henegouwen", "omschrijving": STRAAT, "bbox": [3.10, 50.00, 4.62, 50.82]},
    {"id": "nam", "naam": "Namen", "omschrijving": STRAAT, "bbox": [4.30, 49.79, 5.41, 50.66]},
    {"id": "lui", "naam": "Luik", "omschrijving": STRAAT, "bbox": [5.02, 50.12, 6.41, 50.82]},
    {"id": "lux", "naam": "Luxemburg (provincie)", "omschrijving": STRAAT, "bbox": [4.96, 49.49, 6.05, 50.43]},
]
VELDEN = ("id", "naam", "omschrijving", "groep", "land", "bbox", "maxzoom", "zak")


def als_dict(rij):
    return dict(zip(VELDEN, rij))


def alle_pakketten():
    """Vaste pakketten plus het plan voor de andere landen, in vaste volgorde."""
    lijst = [als_dict(p) for p in VAST]
    if os.path.exists(PLAN):
        with open(PLAN, encoding="utf-8") as f:
            for land in json.load(f)["landen"].values():
                lijst.extend(land)
    return lijst


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


# ---------------------------------------------------------------- plannen

def proefmeting(build_url, bbox, maxzoom):
    """Geschatte grootte in bytes van een uitsnede (pmtiles extract --dry-run)."""
    for poging in range(1, 4):
        r = subprocess.run(
            ["pmtiles", "extract", build_url, os.devnull, f"--bbox={','.join(map(str, bbox))}",
             f"--maxzoom={maxzoom}", "--dry-run"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        m = re.search(r"archive size of ([\d.]+) (\w?B)", r.stdout)
        if r.returncode == 0 and m:
            eenheid = {"B": 1, "kB": 1e3, "KB": 1e3, "MB": 1e6, "GB": 1e9, "TB": 1e12}[m.group(2)]
            return int(float(m.group(1)) * eenheid)
        time.sleep(5 * poging)
    raise SystemExit(f"proefmeting mislukt voor {bbox} z{maxzoom}: {r.stdout[-200:]}")


def vakken(bbox, n_rijen, n_kol):
    """Deel een bbox in een rooster; geeft (label, bbox) met kompasnamen."""
    w, z, o, n = bbox
    rijnaam = {1: [""], 2: ["noord", "zuid"], 3: ["noord", "midden", "zuid"]}
    kolnaam = {1: [""], 2: ["west", "oost"], 3: ["west", "midden", "oost"]}
    uit = []
    for i in range(n_rijen):
        for j in range(n_kol):
            vak = [round(w + (o - w) * j / n_kol, 3), round(n - (n - z) * (i + 1) / n_rijen, 3),
                   round(w + (o - w) * (j + 1) / n_kol, 3), round(n - (n - z) * i / n_rijen, 3)]
            if n_rijen <= 3 and n_kol <= 3:
                r, k = rijnaam[n_rijen][i], kolnaam[n_kol][j]
                if r == "midden" and k:
                    r = ""
                if k == "midden" and r:
                    k = ""
                label = (r + k) or "midden"
            else:
                label = f"deel {i * n_kol + j + 1}"
            uit.append((label, vak))
    return uit


def opdelen(build_url, bbox, zoom, schatting):
    """Rooster zodat elk vak (bij gelijke dichtheid) onder het doel blijft.

    Vakken die toch te groot blijven, worden nog eens in vieren gedeeld.
    Vakken met (bijna) niets erin (zee) vallen weg.
    """
    stuks = math.ceil(schatting / (PAKKET_DOEL * 0.8))
    breedte = (bbox[2] - bbox[0]) * math.cos(math.radians((bbox[1] + bbox[3]) / 2))
    hoogte = bbox[3] - bbox[1]
    n_kol = max(1, round(math.sqrt(stuks * breedte / hoogte)))
    n_rijen = max(1, math.ceil(stuks / n_kol))
    uit = []
    for label, vak in vakken(bbox, n_rijen, n_kol):
        grootte = proefmeting(build_url, vak, zoom)
        if grootte < 2e6:
            continue
        if grootte > PAKKET_DOEL:
            for sub, subvak in vakken(vak, 2, 2):
                g = proefmeting(build_url, subvak, zoom)
                if g >= 2e6:
                    uit.append((f"{label} ({sub})", subvak, g))
        else:
            uit.append((label, vak, grootte))
    return uit


LANDNAMEN = {"be": "België", "de": "Duitsland", "fr": "Frankrijk", "lu": "Luxemburg", "nl": "Nederland"}


def land_bbox(code, regios):
    """bbox en naam uit data/landen/<land>.json, anders uit de regio's."""
    pad = os.path.join(ROOT, "data", "landen", f"{code}.json")
    if os.path.exists(pad):
        with open(pad, encoding="utf-8") as f:
            land = json.load(f)
        return land["bbox"], land["naam"]["nl"]
    hoofd = [r["bbox"] for r in regios if r["niveau"] == min(x["niveau"] for x in regios)]
    return ([min(b[0] for b in hoofd), min(b[1] for b in hoofd), max(b[2] for b in hoofd), max(b[3] for b in hoofd)],
            LANDNAMEN[code])


def plan_land(code, build_url, log=print):
    """Pakketten voor één land: overzicht, standaard en straatniveau."""
    with open(REGIOS, encoding="utf-8") as f:
        regios = json.load(f).get(code.upper(), [])
    bbox, landnaam = land_bbox(code, regios)
    niveaus = sorted({r["niveau"] for r in regios})
    hoofd = [r for r in regios if niveaus and r["niveau"] == niveaus[0]]
    sub = [r for r in regios if len(niveaus) > 1 and r["niveau"] == niveaus[1]]
    hoofdnaam = {r["id"]: r["naam"] for r in hoofd}
    lijst = []

    def pakket(pid, naam, oms, groep, bb, zoom, zak=False, schatting=None):
        item = {"id": pid, "naam": naam, "omschrijving": oms, "groep": groep, "land": code,
                "bbox": bb, "maxzoom": zoom, "zak": zak}
        if schatting:
            item["schatting"] = schatting
        lijst.append(item)
        log(f"  {pid:28} {(schatting or 0) / 1e6:7.0f} MB  {naam}")

    def met_opdeling(prefix, naam, oms, groep, bb, zoom):
        """Eén pakket, of vakken als het te groot is."""
        g = proefmeting(build_url, bb, zoom)
        if g <= PAKKET_DOEL:
            pakket(f"{prefix}-z{zoom}", naam, oms, groep, bb, zoom, schatting=g)
            return
        for label, vak, gv in opdelen(build_url, bb, zoom, g):
            vid = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
            pakket(f"{prefix}-{vid}-z{zoom}", f"{naam.split(',')[0]} {label}, {naam.split(', ', 1)[1]}",
                   oms, groep, vak, zoom, schatting=gv)

    # Overzicht.
    g = proefmeting(build_url, bbox, 9)
    pakket(f"{code}-z9", f"{landnaam}, overzicht", "Gemeenten, hoofdwegen, rivieren", "land", bbox, 9,
           zak=True, schatting=g)
    # Standaard: heel het land, of per regio.
    g = proefmeting(build_url, bbox, 12)
    if g <= PAKKET_DOEL or not hoofd:
        met_opdeling(code, f"{landnaam}, standaard", "Alle wegen en dorpen, geen gebouwen", "land", bbox, 12)
    else:
        for r in hoofd:
            met_opdeling(f"{code}-{r['id']}", f"{r['naam']}, standaard", "Alle wegen en dorpen, geen gebouwen",
                         "land", r["bbox"], 12)
    # Straatniveau.
    if not hoofd:
        met_opdeling(code, f"{landnaam}, straatniveau", STRAAT, "regio", bbox, ZOOM_STRAAT)
    for r in hoofd:
        g = proefmeting(build_url, r["bbox"], ZOOM_STRAAT)
        kinderen = [s for s in sub if s.get("ouder") == r["id"]]
        if g <= PAKKET_DOEL:
            pakket(f"{code}-{r['id']}-z{ZOOM_STRAAT}", f"{r['naam']}, straatniveau", STRAAT, "regio", r["bbox"], ZOOM_STRAAT, schatting=g)
        elif kinderen:
            for s in kinderen:
                met_opdeling(f"{code}-{s['id']}", f"{s['naam']}, straatniveau", f"{STRAAT}; {hoofdnaam[r['id']]}",
                             "regio", s["bbox"], ZOOM_STRAAT)
        else:
            met_opdeling(f"{code}-{r['id']}", f"{r['naam']}, straatniveau", STRAAT, "regio", r["bbox"], ZOOM_STRAAT)
    return lijst


def plan_belgie(build_url, log=print):
    """België: overzicht en standaard staan vast; straatniveau per provincie, opgedeeld als nodig."""
    lijst = []
    for r in BE_REGIOS:
        g = proefmeting(build_url, r["bbox"], ZOOM_STRAAT)
        stukken = [("", r["bbox"], g)] if g <= PAKKET_DOEL else opdelen(build_url, r["bbox"], ZOOM_STRAAT, g)
        for label, vak, gv in stukken:
            vid = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
            pid = f"be-{r['id']}-{vid}-z{ZOOM_STRAAT}" if vid else f"be-{r['id']}-z{ZOOM_STRAAT}"
            naam = f"{r['naam']} {label}, straatniveau" if label else f"{r['naam']}, straatniveau"
            lijst.append({"id": pid, "naam": naam, "omschrijving": r["omschrijving"], "groep": "regio", "land": "be",
                          "bbox": vak, "maxzoom": ZOOM_STRAAT, "zak": False, "schatting": gv})
            log(f"  {pid:28} {gv / 1e6:7.0f} MB  {naam}")
    return lijst


def maak_plan(landen, build_url):
    plan = {"landen": {}}
    if os.path.exists(PLAN):
        with open(PLAN, encoding="utf-8") as f:
            plan = json.load(f)
    for code in landen:
        print(f"{code.upper()}: plannen")
        plan["landen"][code] = plan_belgie(build_url) if code == "be" else plan_land(code, build_url)
    plan["gepland"] = dt.date.today().isoformat()
    plan["doel_bytes"] = PAKKET_DOEL
    plan["landen"] = dict(sorted(plan["landen"].items()))
    with open(PLAN, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
        f.write("\n")
    for code in landen:
        totaal = sum(p.get("schatting", 0) for p in plan["landen"][code])
        print(f"{code.upper()}: {len(plan['landen'][code])} pakketten, samen ongeveer {totaal / 1e9:.1f} GB")


# ---------------------------------------------------------------- maken en uploaden

def maak(pakket, build_url, hergebruik=False):
    pid, bbox, maxzoom = pakket["id"], pakket["bbox"], pakket["maxzoom"]
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
    print(f"  {pid:28} {grootte / 1048576:8.1f} MB  ({time.time() - begin:.0f} s)", flush=True)
    item = {k: pakket[k] for k in VELDEN if k in pakket and pakket[k] is not None}
    item.update({"bytes": grootte, "pad": f"/data/{pid}.pmtiles", "r2": pid + ".pmtiles"})
    return item


def upload(item):
    bron = os.path.join(UIT, f"{item['id']}.pmtiles")
    if item["bytes"] > WRANGLER_LIMIET:
        print(f"  {item['id']}: groter dan 300 MB, upload via de S3-API van R2 (rclone) in plaats van wrangler")
        return False
    for poging in range(1, 4):
        r = subprocess.run(
            ["npx", "wrangler", "r2", "object", "put", f"{BUCKET}/{item['r2']}", "--file", bron, "--remote",
             "--content-type", "application/octet-stream"],
            cwd=os.path.join(ROOT, "site"), stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
        )
        if r.returncode == 0:
            print(f"  {item['id']}: geüpload naar R2", flush=True)
            return True
        print(f"  {item['id']}: upload poging {poging} mislukt ({r.stderr.strip()[-160:]})", flush=True)
        time.sleep(15 * poging)
    raise SystemExit(f"{item['id']}: upload mislukt")


def schrijf_overzicht(resultaat):
    """kaarten.json: alle gemaakte pakketten, met naam en groep uit de huidige definitie."""
    definities = alle_pakketten()
    lijst = []
    for d in definities:
        if d["id"] in resultaat:
            item = dict(resultaat[d["id"]])
            item.update({k: d[k] for k in VELDEN if d.get(k) is not None})
            if d.get("land") is None:
                item.pop("land", None)
            lijst.append(item)
    with open(OVERZICHT, "w", encoding="utf-8") as f:
        json.dump({
            "bijgewerkt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "bron": "© OpenStreetMap-bijdragers (ODbL), basiskaart Protomaps",
            "pakketten": lijst,
        }, f, ensure_ascii=False, indent=2)
    return lijst


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--plan", nargs="+", metavar="LAND", help="indeling voor deze landen opnieuw berekenen")
    ap.add_argument("--land", nargs="*", help="alleen de pakketten van deze landen (be, nl, ...; eu voor Europa)")
    ap.add_argument("--alleen", nargs="*", help="alleen deze pakket-id's")
    ap.add_argument("--upload", action="store_true", help="na het maken naar R2 uploaden")
    ap.add_argument("--hergebruik", action="store_true", help="bestaande bestanden in pipeline/out/kaarten niet opnieuw uitknippen")
    ap.add_argument("--parallel", type=int, default=2, help="aantal uploads tegelijk (standaard 2)")
    args = ap.parse_args()

    datum, url = recentste_build()
    print(f"Protomaps-build {datum}")
    if args.plan:
        maak_plan([c.lower() for c in args.plan], url)
        return

    vorige = {}
    if os.path.exists(OVERZICHT):
        vorige = {p["id"]: p for p in json.load(open(OVERZICHT, encoding="utf-8"))["pakketten"]}
    resultaat = dict(vorige)
    landen = {c.lower() for c in args.land} if args.land else None
    gekozen = [p for p in alle_pakketten()
               if (not args.alleen or p["id"] in args.alleen)
               and (landen is None or (p["land"] or "eu") in landen)]

    # Uitknippen na elkaar (de build-server is gedeeld), uploaden ernaast.
    with ThreadPoolExecutor(max_workers=max(1, args.parallel)) as pool:
        lopend = []
        for p in gekozen:
            item = maak(p, url, args.hergebruik)
            item["build"] = datum
            resultaat[item["id"]] = item
            if args.upload:
                lopend.append(pool.submit(upload, item))
            schrijf_overzicht(resultaat)
        for t in lopend:
            t.result()

    lijst = schrijf_overzicht(resultaat)
    totaal = sum(p["bytes"] for p in lijst)
    print(f"{len(lijst)} pakketten, samen {totaal / 1048576:.0f} MB -> {os.path.relpath(OVERZICHT, ROOT)}")


if __name__ == "__main__":
    main()
