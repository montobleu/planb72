#!/usr/bin/env python3
"""Routepakketten maken voor offline routeplanning.

Leest een Geofabrik-extract van OpenStreetMap (ODbL), houdt alleen de wegen over
die te voet, met de fiets of met de auto bruikbaar zijn, en maakt per regio een
compact routenetwerk met een zoekindex voor plaatsen en straten. Dezelfde regio's
(bboxen) als de kaartpakketten in kaartpakketten.py.

Knopen zijn alleen kruispunten, uiteinden en versperringen; de tussenliggende
punten van een weg worden als vorm van het segment bewaard. Knopen en segmenten
krijgen een landelijk volgnummer in ruimtelijke volgorde, zodat de app regio's
naadloos aan elkaar kan koppelen.

Gebruik:
  python3 pipeline/routegraaf.py                      # alle regio's
  python3 pipeline/routegraaf.py --alleen be-ant      # één regio
  python3 pipeline/routegraaf.py --upload             # ook naar R2 (wrangler, --remote)
  python3 pipeline/routegraaf.py --pbf pad/naar/belgium-latest.osm.pbf

Vereist osmium (brew install osmium-tool). Verder alleen de standaardbibliotheek.
Bestandsformaat: zie pipeline/README.md, deel Routepakketten.
"""
import argparse
import array
import datetime as dt
import gzip
import json
import math
import os
import re
import struct
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UIT = os.path.join(ROOT, "pipeline", "out", "route")
OSM = os.path.join(ROOT, "pipeline", "out", "osm")
OVERZICHT = os.path.join(ROOT, "site", "public", "data", "routes.json")
BUCKET = "planb72-pakketten"
GEOFABRIK = "https://download.geofabrik.de/europe/belgium-latest.osm.pbf"
WRANGLER_LIMIET = 300 * 1024 * 1024
VERSIE = 1
SCHAAL = 100000  # coördinaten in 1e-5 graad (ongeveer 1,1 m)

# id, naam, omschrijving, bbox (west, zuid, oost, noord); gelijk aan de regio's in kaartpakketten.py
REGIOS = [
    ("be-wvl", "West-Vlaanderen", "Routes en zoeken in West-Vlaanderen", [2.54, 50.68, 3.47, 51.38]),
    ("be-ovl", "Oost-Vlaanderen", "Routes en zoeken in Oost-Vlaanderen", [3.33, 50.71, 4.33, 51.35]),
    ("be-ant", "Antwerpen", "Routes en zoeken in de provincie Antwerpen", [4.10, 51.00, 5.25, 51.51]),
    ("be-lim", "Limburg", "Routes en zoeken in Limburg", [4.95, 50.68, 5.92, 51.26]),
    ("be-bra", "Brabant en Brussel", "Vlaams-Brabant, Brussel en Waals-Brabant", [3.98, 50.53, 5.17, 51.06]),
    ("be-hen", "Henegouwen", "Routes en zoeken in Henegouwen", [3.10, 50.00, 4.62, 50.82]),
    ("be-nam", "Namen", "Routes en zoeken in de provincie Namen", [4.30, 49.79, 5.41, 50.66]),
    ("be-lui", "Luik", "Routes en zoeken in de provincie Luik", [5.02, 50.12, 6.41, 50.82]),
    ("be-lux", "Luxemburg (provincie)", "Routes en zoeken in de provincie Luxemburg", [4.96, 49.49, 6.05, 50.43]),
]

# Wegtypes: code in het bestand en standaardtoegang (te voet, fiets, auto) volgens de
# Belgische standaarden op wiki.openstreetmap.org/wiki/OSM_tags_for_routing/Access_restrictions.
# Dezelfde lijst staat in site/src/lib/routegraaf.ts.
KLASSEN = [
    ("motorway", (0, 0, 1)), ("motorway_link", (0, 0, 1)),
    ("trunk", (1, 1, 1)), ("trunk_link", (1, 1, 1)),
    ("primary", (1, 1, 1)), ("primary_link", (1, 1, 1)),
    ("secondary", (1, 1, 1)), ("secondary_link", (1, 1, 1)),
    ("tertiary", (1, 1, 1)), ("tertiary_link", (1, 1, 1)),
    ("unclassified", (1, 1, 1)), ("residential", (1, 1, 1)),
    ("living_street", (1, 1, 1)), ("service", (1, 1, 1)),
    ("track", (1, 1, 0)), ("road", (1, 1, 1)),
    ("pedestrian", (1, 0, 0)), ("footway", (1, 0, 0)),
    ("cycleway", (1, 1, 0)), ("path", (1, 1, 0)),
    ("bridleway", (1, 0, 0)), ("steps", (1, 0, 0)),
]
KLASSE = {naam: i for i, (naam, _) in enumerate(KLASSEN)}
STANDAARD = {naam: t for naam, t in KLASSEN}

VOET, FIETS, AUTO, EENR_AUTO, EENR_FIETS, ROTONDE, FIETSINFRA, ONVERHARD = 1, 2, 4, 8, 16, 32, 64, 128

JA = {"yes", "designated", "permissive", "destination", "delivery", "customers", "official", "use_sidepath", "discouraged", "permit"}
NEE = {"no", "private", "agricultural", "forestry", "agricultural;forestry", "military", "emergency", "dismount"}
ONVERHARDE = {"unpaved", "gravel", "fine_gravel", "dirt", "ground", "grass", "sand", "mud", "earth", "pebblestone", "woodchips", "compacted"}
# Versperringen op een knoop: (auto geblokkeerd, fiets geblokkeerd)
VERSPERRING = {
    "bollard": (1, 0), "block": (1, 0), "jersey_barrier": (1, 0), "cycle_barrier": (1, 0),
    "bus_trap": (1, 0), "debris": (1, 0), "log": (1, 0), "chain": (1, 0), "rope": (1, 0),
    "kissing_gate": (1, 1), "stile": (1, 1), "turnstile": (1, 1), "full-height_turnstile": (1, 1),
    "planter": (1, 0), "barrier_board": (1, 0), "spikes": (1, 0),
}
PLAATS_SOORT = {"city": 1, "town": 2, "village": 3, "hamlet": 4, "suburb": 5, "quarter": 5, "neighbourhood": 6, "isolated_dwelling": 6, "locality": 6}
SNELHEID_ZONE = {
    "be:urban": 50, "be-vlg:urban": 50, "be-wal:urban": 50, "be-bru:urban": 30,
    "be:rural": 70, "be-vlg:rural": 70, "be-wal:rural": 90, "be-bru:rural": 70,
    "be:motorway": 120, "be-vlg:motorway": 120, "be-wal:motorway": 120,
    "be:zone30": 30, "be:30": 30, "be-vlg:zone30": 30, "be:living_street": 20,
    "be:cyclestreet": 30, "be:bicycle_road": 30, "walk": 6,
}

ESC = re.compile(r"%([0-9a-fA-F]+)%")


def ontsnap(s):
    return ESC.sub(lambda m: chr(int(m.group(1), 16)), s) if "%" in s else s


def tags(veld):
    uit = {}
    if not veld:
        return uit
    for paar in veld.split(","):
        k, _, v = paar.partition("=")
        uit[ontsnap(k)] = ontsnap(v)
    return uit


def opl_velden(regel):
    """Splits een OPL-regel in id en velden per letter."""
    delen = regel.rstrip("\n").split(" ")
    return delen[0], {d[0]: d[1:] for d in delen[1:] if d}


# ---------- Toegang en eigenschappen per weg ----------

def waarde(t, sleutels):
    """Eerste toegangswaarde van specifiek naar algemeen (motorcar > motor_vehicle > vehicle > access)."""
    for s in sleutels:
        v = t.get(s)
        if v:
            v = v.split(";")[0].strip()
            if v in JA:
                return 1
            if v in NEE:
                return 0
    return None


def toegang(t):
    hw = t.get("highway")
    if hw not in KLASSE:
        return None
    if t.get("area") == "yes" and hw not in ("pedestrian", "footway"):
        return None
    voet, fiets, auto = STANDAARD[hw]
    if t.get("motorroad") == "yes":
        voet = fiets = 0
    a = waarde(t, ["foot", "access"])
    voet = voet if a is None else a
    a = waarde(t, ["bicycle", "vehicle", "access"])
    fiets = fiets if a is None else a
    a = waarde(t, ["motorcar", "motor_vehicle", "vehicle", "access"])
    auto = auto if a is None else a
    if hw == "steps":
        fiets = auto = 0
    if hw in ("motorway", "motorway_link"):
        voet = fiets = 0
    if t.get("service") in ("emergency_access",):
        auto = 0
    if not (voet or fiets or auto):
        return None
    vlag = (VOET if voet else 0) | (FIETS if fiets else 0) | (AUTO if auto else 0)

    rotonde = t.get("junction") in ("roundabout", "circular")
    ow = t.get("oneway", "")
    omkeren = ow in ("-1", "reverse")
    eenr = ow in ("yes", "true", "1") or omkeren or (ow != "no" and (rotonde or hw in ("motorway", "motorway_link")))
    if ow in ("reversible", "alternating"):
        eenr = False
    if eenr:
        vlag |= EENR_AUTO
        fiets_tegen = t.get("oneway:bicycle") == "no" or any(
            t.get(k, "").startswith("opposite") for k in ("cycleway", "cycleway:left", "cycleway:right", "cycleway:both"))
        if not fiets_tegen:
            vlag |= EENR_FIETS
    elif t.get("oneway:bicycle") in ("yes", "1"):
        vlag |= EENR_FIETS
    if rotonde:
        vlag |= ROTONDE
    fietspad = hw == "cycleway" or t.get("bicycle") == "designated" or t.get("cyclestreet") == "yes" or t.get("bicycle_road") == "yes" or any(
        t.get(k, "").split(";")[0] in ("track", "lane", "separate", "opposite_track", "opposite_lane")
        for k in ("cycleway", "cycleway:left", "cycleway:right", "cycleway:both"))
    if fietspad:
        vlag |= FIETSINFRA
    oppervlak = t.get("surface", "")
    if oppervlak in ONVERHARDE or (hw == "track" and t.get("tracktype", "grade2") not in ("grade1",) and oppervlak not in ("asphalt", "concrete", "paved", "paving_stones")):
        vlag |= ONVERHARD
    return vlag, KLASSE[hw], snelheid(t), omkeren


def snelheid(t):
    for s in ("maxspeed", "zone:maxspeed", "maxspeed:type", "source:maxspeed"):
        v = t.get(s, "").strip().lower()
        if not v:
            continue
        m = re.match(r"^(\d+)\s*(mph)?$", v)
        if m:
            km = int(m.group(1)) * (1.609 if m.group(2) else 1)
            return max(1, min(250, int(round(km))))
        v = v.replace(" ", "")
        if v in SNELHEID_ZONE:
            return SNELHEID_ZONE[v]
        m = re.match(r"^be(?:-\w+)?:(?:zone)?(\d+)$", v)
        if m:
            return int(m.group(1))
    return 0


def straatnaam(t):
    """Naam, anders het wegnummer, anders voor op- en afritten de bestemming op het richtingbord."""
    n = t.get("name", "").strip()
    if n:
        return n
    ref = t.get("ref", "").strip()
    if ref:
        return " / ".join(r.strip() for r in ref.split(";") if r.strip())
    if t.get("highway", "").endswith("_link"):
        bord = (t.get("destination") or t.get("destination:ref") or "").strip()
        if bord:
            return "richting " + " / ".join(r.strip() for r in bord.split(";") if r.strip())
    return ""


# ---------- Geometrie ----------

def afstand(lon1, lat1, lon2, lat2):
    """Afstand in meter tussen twee punten in 1e-5 graad (equirectangulair, nauwkeurig genoeg per segment)."""
    f = math.pi / 180 / SCHAAL
    x = (lon2 - lon1) * f * math.cos((lat1 + lat2) * 0.5 * f)
    y = (lat2 - lat1) * f
    return 6371008.8 * math.hypot(x, y)


def morton(x, y):
    """Z-volgorde van twee 16-bitsgetallen."""
    def spreid(v):
        v &= 0xFFFF
        v = (v | (v << 8)) & 0x00FF00FF
        v = (v | (v << 4)) & 0x0F0F0F0F
        v = (v | (v << 2)) & 0x33333333
        v = (v | (v << 1)) & 0x55555555
        return v
    return spreid(x) | (spreid(y) << 1)


# ---------- Stap 1: osmium ----------

def osmium_stappen(pbf):
    filt = os.path.join(OSM, "routefilter.osm.pbf")
    opl = os.path.join(OSM, "routefilter.opl")
    if not os.path.exists(opl) or os.path.getmtime(opl) < os.path.getmtime(pbf):
        begin = time.time()
        subprocess.run(["osmium", "tags-filter", pbf, "w/highway", "n/barrier", "n/place", "-o", filt, "--overwrite"], check=True)
        subprocess.run(["osmium", "add-locations-to-ways", filt, "-f", "opl,add_metadata=false", "-o", opl, "--overwrite"], check=True)
        print(f"osmium: {os.path.getsize(opl) / 1048576:.0f} MB OPL ({time.time() - begin:.0f} s)")
    return opl


def osm_datum(pbf):
    r = subprocess.run(["osmium", "fileinfo", "-g", "header.option.osmosis_replication_timestamp", pbf], capture_output=True, text=True)
    return (r.stdout.strip() or dt.datetime.fromtimestamp(os.path.getmtime(pbf), dt.timezone.utc).isoformat())[:10]


# ---------- Stap 2: netwerk ----------

def lees_netwerk(opl):
    begin = time.time()
    gebruik = {}          # OSM-knoop -> aantal keer gebruikt door routeerbare wegen
    versperd = {}         # OSM-knoop -> bits (1 auto, 2 fiets)
    plaatsen = []         # (soort, naam, lon, lat, alternatieve namen)
    with open(opl, encoding="utf-8") as f:
        for regel in f:
            if regel[0] == "n":
                _, v = opl_velden(regel)
                t = tags(v.get("T", ""))
                b = t.get("barrier")
                if b in VERSPERRING:
                    auto, fiets = VERSPERRING[b]
                    if waarde(t, ["motorcar", "motor_vehicle", "access"]) == 1:
                        auto = 0
                    if waarde(t, ["bicycle", "access"]) == 1:
                        fiets = 0
                    if auto or fiets:
                        versperd[int(regel[1:regel.index(" ")])] = auto | (fiets << 1)
                if t.get("place") in PLAATS_SOORT and t.get("name") and "x" in v:
                    alt = sorted({t.get(k) for k in ("name:nl", "name:fr", "name:de") if t.get(k) and t.get(k) != t["name"]})
                    plaatsen.append((PLAATS_SOORT[t["place"]], t["name"], round(float(v["x"]) * SCHAAL), round(float(v["y"]) * SCHAAL), alt))
                continue
            if regel[0] != "w":
                continue
            _, v = opl_velden(regel)
            if toegang(tags(v.get("T", ""))) is None:
                continue
            refs = v.get("N", "").split(",")
            if len(refs) < 2:
                continue
            for i, r in enumerate(refs):
                k = int(r[1:r.index("x")])
                # Uiteinden tellen dubbel, zodat ze altijd knoop worden.
                gebruik[k] = gebruik.get(k, 0) + (2 if i == 0 or i == len(refs) - 1 else 1)
    knoopnr = {}
    for k, n in gebruik.items():
        if n >= 2 or k in versperd:
            knoopnr[k] = len(knoopnr)
    del gebruik
    print(f"doorgang 1: {len(knoopnr):,} knopen, {len(plaatsen):,} plaatsen ({time.time() - begin:.0f} s)")

    begin = time.time()
    kx = array.array("i", bytes(4 * len(knoopnr)))
    ky = array.array("i", bytes(4 * len(knoopnr)))
    # Segmenten: begin, einde, lengte, klasse, vlag, snelheid, naam, vorm-begin
    ra, rb, rl, rk, rv, rs, rn, rvorm = (array.array("I"), array.array("I"), array.array("I"), array.array("B"),
                                         array.array("B"), array.array("B"), array.array("I"), array.array("I"))
    vx, vy = array.array("i"), array.array("i")  # vormpunten (absoluut)
    namen = {"": 0}
    straten = {}  # naam -> lijst van (lon, lat) middens van segmenten
    with open(opl, encoding="utf-8") as f:
        for regel in f:
            if regel[0] != "w":
                continue
            _, v = opl_velden(regel)
            t = tags(v.get("T", ""))
            eig = toegang(t)
            if eig is None:
                continue
            vlag, klasse, maxsnel, omkeren = eig
            refs = v.get("N", "").split(",")
            if len(refs) < 2:
                continue
            pts = []
            for r in refs:
                i = r.index("x")
                j = r.index("y")
                pts.append((int(r[1:i]), round(float(r[i + 1:j]) * SCHAAL), round(float(r[j + 1:]) * SCHAAL)))
            if omkeren:
                pts.reverse()
            naam = straatnaam(t)
            ni = namen.setdefault(naam, len(namen))
            if t.get("name") and klasse not in (KLASSE["motorway"], KLASSE["motorway_link"]):
                m = pts[len(pts) // 2]
                straten.setdefault(t["name"], []).append((m[1], m[2]))
            vorige = knoopnr[pts[0][0]]
            kx[vorige], ky[vorige] = pts[0][1], pts[0][2]
            lengte = 0.0
            tussen = []
            for p in range(1, len(pts)):
                osm, x, y = pts[p]
                lengte += afstand(pts[p - 1][1], pts[p - 1][2], x, y)
                nr = knoopnr.get(osm)
                if nr is None:
                    tussen.append((x, y))
                    continue
                kx[nr], ky[nr] = x, y
                if nr != vorige or tussen:
                    ra.append(vorige); rb.append(nr); rl.append(max(1, int(round(lengte * 10))))
                    rk.append(klasse); rv.append(vlag); rs.append(maxsnel); rn.append(ni)
                    rvorm.append(len(vx))
                    for tx, ty in tussen:
                        vx.append(tx); vy.append(ty)
                vorige, lengte, tussen = nr, 0.0, []
    rvorm.append(len(vx))
    print(f"doorgang 2: {len(ra):,} segmenten, {len(vx):,} vormpunten, {len(namen):,} namen ({time.time() - begin:.0f} s)")

    blok = {knoopnr[k]: b for k, b in versperd.items() if k in knoopnr}
    return {"kx": kx, "ky": ky, "ra": ra, "rb": rb, "rl": rl, "rk": rk, "rv": rv, "rs": rs, "rn": rn,
            "rvorm": rvorm, "vx": vx, "vy": vy, "namen": namen, "straten": straten, "plaatsen": plaatsen, "blok": blok}


def ruimtelijk_nummeren(net):
    """Landelijke volgnummers in Z-volgorde: aangrenzende knopen krijgen nabije nummers."""
    kx, ky = net["kx"], net["ky"]
    x0, y0 = min(kx), min(ky)
    bx, by = max(1, max(kx) - x0), max(1, max(ky) - y0)
    sleutel = [morton((kx[i] - x0) * 65535 // bx, (ky[i] - y0) * 65535 // by) for i in range(len(kx))]
    volgorde = sorted(range(len(kx)), key=sleutel.__getitem__)
    nieuw = array.array("I", bytes(4 * len(kx)))
    for n, oud in enumerate(volgorde):
        nieuw[oud] = n
    net["kx"] = array.array("i", (kx[o] for o in volgorde))
    net["ky"] = array.array("i", (ky[o] for o in volgorde))
    net["ra"] = array.array("I", (nieuw[a] for a in net["ra"]))
    net["rb"] = array.array("I", (nieuw[b] for b in net["rb"]))
    net["blok"] = {nieuw[k]: b for k, b in net["blok"].items()}
    # Segmenten sorteren op beginknoop; het volgnummer is dan de positie.
    net["rvolg"] = sorted(range(len(net["ra"])), key=lambda e: (net["ra"][e], net["rb"][e]))


# ---------- Stap 3: zoekindex ----------

class Raster:
    """Eenvoudig raster om de dichtstbijzijnde plaats te vinden."""

    def __init__(self, punten, cel=5000):
        self.cel, self.vakken = cel, {}
        for i, (x, y) in enumerate(punten):
            self.vakken.setdefault((x // cel, y // cel), []).append(i)
        self.punten = punten

    def dichtst(self, x, y, straal=3):
        cx, cy = x // self.cel, y // self.cel
        beste, bd = None, None
        for dx in range(-straal, straal + 1):
            for dy in range(-straal, straal + 1):
                for i in self.vakken.get((cx + dx, cy + dy), ()):
                    px, py = self.punten[i]
                    d = (px - x) ** 2 + ((py - y) * 1.6) ** 2
                    if bd is None or d < bd:
                        beste, bd = i, d
        return beste


def zoekindex(net):
    """Plaatsen en straten, elk met een plaats als context."""
    plaatsen = net["plaatsen"]
    kern = [p for p in plaatsen if p[0] <= 3]  # stad, gemeente, dorp: context voor straten
    raster = Raster([(p[2], p[3]) for p in kern])
    items = []  # (soort, naam, context, x, y)
    for soort, naam, x, y, alt in plaatsen:
        ctx = ""
        if soort >= 4 and kern:
            i = raster.dichtst(x, y)
            ctx = kern[i][1] if i is not None and kern[i][1] != naam else ""
        items.append((soort, naam, ctx, x, y))
        for a in alt:
            items.append((soort, a, naam, x, y))
    for naam, middens in net["straten"].items():
        # Dezelfde straatnaam in verschillende plaatsen apart houden.
        groepen = {}
        for x, y in middens:
            i = raster.dichtst(x, y) if kern else None
            groepen.setdefault(i, []).append((x, y))
        for i, pts in groepen.items():
            gx = sum(p[0] for p in pts) / len(pts)
            gy = sum(p[1] for p in pts) / len(pts)
            x, y = min(pts, key=lambda p: (p[0] - gx) ** 2 + (p[1] - gy) ** 2)
            items.append((0, naam, kern[i][1] if i is not None else "", x, y))
    print(f"zoekindex: {len(items):,} items")
    return items


# ---------- Stap 4: bestand per regio ----------

def binnen(x, y, bb):
    return bb[0] <= x <= bb[2] and bb[1] <= y <= bb[3]


def schrijf_regio(net, items, regio, datum):
    rid, naam, oms, bbox = regio
    bb = [round(c * SCHAAL) for c in bbox]
    ra, rb, rvorm, vx, vy, kx, ky = net["ra"], net["rb"], net["rvorm"], net["vx"], net["vy"], net["kx"], net["ky"]
    gekozen = []
    for gid, e in enumerate(net["rvolg"]):
        a, b = ra[e], rb[e]
        if binnen(kx[a], ky[a], bb) or binnen(kx[b], ky[b], bb) or any(binnen(vx[i], vy[i], bb) for i in range(rvorm[e], rvorm[e + 1])):
            gekozen.append((gid, e))
    knopen = sorted({ra[e] for _, e in gekozen} | {rb[e] for _, e in gekozen})
    lokaal = {g: i for i, g in enumerate(knopen)}
    namen_g = {}
    naamlijst = [""]

    def naamnr(s):
        if s not in namen_g:
            namen_g[s] = len(naamlijst)
            naamlijst.append(s)
        return namen_g[s]

    namen_g[""] = 0
    inv = {v: k for k, v in net["namen"].items()}

    E = len(gekozen)
    s = {
        "knoopId": array.array("I"), "knoopX": array.array("i"), "knoopY": array.array("i"),
        "randId": array.array("I"), "randA": array.array("I"), "randB": array.array("I"),
        "randLengte": array.array("I"), "randKlasse": array.array("B"), "randVlag": array.array("B"),
        "randSnelheid": array.array("B"), "randNaam": array.array("I"), "randVorm": array.array("I"),
        "vorm": array.array("h"),
    }
    vg, vx0, vy0 = 0, 0, 0
    for g in knopen:
        s["knoopId"].append(g - vg); vg = g
        s["knoopX"].append(kx[g] - vx0); vx0 = kx[g]
        s["knoopY"].append(ky[g] - vy0); vy0 = ky[g]
    vg = 0
    for gid, e in gekozen:
        s["randId"].append(gid - vg); vg = gid
        s["randA"].append(lokaal[ra[e]]); s["randB"].append(lokaal[rb[e]])
        s["randLengte"].append(net["rl"][e]); s["randKlasse"].append(net["rk"][e]); s["randVlag"].append(net["rv"][e])
        s["randSnelheid"].append(net["rs"][e]); s["randNaam"].append(naamnr(inv[net["rn"][e]]))
        s["randVorm"].append(len(s["vorm"]) // 2)
        px, py = kx[ra[e]], ky[ra[e]]
        for i in range(rvorm[e], rvorm[e + 1]):
            dx, dy = vx[i] - px, vy[i] - py
            if abs(dx) > 32767 or abs(dy) > 32767:
                raise SystemExit(f"{rid}: vormstap te groot ({dx}, {dy})")
            s["vorm"].append(dx); s["vorm"].append(dy)
            px, py = vx[i], vy[i]
    s["randVorm"].append(len(s["vorm"]) // 2)
    blok = sorted((lokaal[k], b) for k, b in net["blok"].items() if k in lokaal)
    s["blokKnoop"] = array.array("I", (k for k, _ in blok))
    s["blokSoort"] = array.array("B", (b for _, b in blok))

    zoek = sorted((it for it in items if binnen(it[3], it[4], bb)), key=lambda it: (it[0] == 0, it[1].lower()))
    zoeknamen = {"": 0}
    for it in zoek:
        zoeknamen.setdefault(it[1], len(zoeknamen))
        zoeknamen.setdefault(it[2], len(zoeknamen))
    z = {
        "soort": array.array("B", (it[0] for it in zoek)),
        "naam": array.array("I", (zoeknamen[it[1]] for it in zoek)),
        "plaats": array.array("I", (zoeknamen[it[2]] for it in zoek)),
        "x": array.array("i", (it[3] for it in zoek)),
        "y": array.array("i", (it[4] for it in zoek)),
        "namen": "\n".join(zoeknamen).encode("utf-8"),
    }
    s["namen"] = "\n".join(naamlijst).encode("utf-8")

    basis = {"id": rid, "versie": VERSIE, "osm": datum, "bbox": bbox, "schaal": SCHAAL, "bron": "© OpenStreetMap-bijdragers, ODbL"}
    graaf, graaf_ruw = deel(s, {**basis, "soort": "graaf", "knopen": len(knopen), "randen": E,
                                 "vormpunten": len(s["vorm"]) // 2, "klassen": [k for k, _ in KLASSEN]})
    zoekdeel, zoek_ruw = deel(z, {**basis, "soort": "zoek", "items": len(zoek)})
    # Buitenste kop niet gecomprimeerd: de app kan de zoekindex lezen zonder het netwerk uit te pakken.
    inhoud = b"PB72PAK1" + struct.pack("<III", VERSIE, len(zoekdeel), len(graaf)) + zoekdeel + graaf
    os.makedirs(UIT, exist_ok=True)
    doel = os.path.join(UIT, f"{rid}.pb72r")
    with open(doel, "wb") as f:
        f.write(inhoud)
    grootte = os.path.getsize(doel)
    ruw = graaf_ruw + zoek_ruw
    print(f"  {rid:7} {len(knopen):>9,} knopen {E:>9,} segmenten {len(zoek):>7,} zoekitems  "
          f"netwerk {len(graaf) / 1048576:5.1f} MB, zoekindex {len(zoekdeel) / 1048576:4.1f} MB (uitgepakt {ruw / 1048576:5.1f} MB)")
    return {
        "id": rid, "naam": naam, "omschrijving": oms, "groep": "regio", "bbox": bbox,
        "bytes": grootte, "ruw": ruw, "knopen": len(knopen), "randen": E, "zoek": len(zoek),
        "netwerkBytes": len(graaf), "zoekBytes": len(zoekdeel),
        "pad": f"/data/route/{rid}.pb72r", "r2": f"route/{rid}.pb72r", "osm": datum,
    }


def deel(secties_in, kop):
    """Eén deel: u32 koplengte, JSON-kop met de sectietabel, secties op 4 bytes uitgelijnd; samen gzip."""
    soorten = {"I": "u32", "i": "i32", "h": "i16", "B": "u8"}
    secties, blokken = [], []
    for k, v in secties_in.items():
        if isinstance(v, bytes):
            data = v
        else:
            w = array.array(v.typecode, v)
            if sys.byteorder != "little":
                w.byteswap()
            data = w.tobytes()
        secties.append({"naam": k, "type": "utf8" if isinstance(v, bytes) else soorten[v.typecode], "bytes": len(data)})
        blokken.append(data + b"\0" * (-len(data) % 4))
    kopbytes = json.dumps({**kop, "secties": secties}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    kopbytes += b" " * (-len(kopbytes) % 4)
    ruw = struct.pack("<I", len(kopbytes)) + kopbytes + b"".join(blokken)
    return gzip.compress(ruw, compresslevel=9, mtime=0), len(ruw)


def upload(item):
    bron = os.path.join(UIT, f"{item['id']}.pb72r")
    if item["bytes"] > WRANGLER_LIMIET:
        print(f"  {item['id']}: groter dan 300 MB, upload via de S3-API van R2")
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
    ap.add_argument("--pbf", default=os.path.join(OSM, "belgium-latest.osm.pbf"))
    ap.add_argument("--alleen", nargs="*", help="alleen deze regio-id's")
    ap.add_argument("--upload", action="store_true", help="na het maken naar R2 uploaden")
    args = ap.parse_args()

    if not os.path.exists(args.pbf):
        os.makedirs(os.path.dirname(args.pbf), exist_ok=True)
        print(f"Downloaden: {GEOFABRIK}")
        req = urllib.request.Request(GEOFABRIK, headers={"User-Agent": "PlanB72-build/0.1 (+https://planb72.org)"})
        with urllib.request.urlopen(req, timeout=120) as r, open(args.pbf + ".deel", "wb") as f:
            while True:
                stuk = r.read(1 << 20)
                if not stuk:
                    break
                f.write(stuk)
        os.replace(args.pbf + ".deel", args.pbf)

    begin = time.time()
    datum = osm_datum(args.pbf)
    print(f"OpenStreetMap-gegevens van {datum}")
    net = lees_netwerk(osmium_stappen(args.pbf))
    ruimtelijk_nummeren(net)
    items = zoekindex(net)

    vorige = {}
    if os.path.exists(OVERZICHT):
        vorige = {p["id"]: p for p in json.load(open(OVERZICHT, encoding="utf-8"))["pakketten"]}
    resultaat = dict(vorige)
    for r in REGIOS:
        if args.alleen and r[0] not in args.alleen:
            continue
        item = schrijf_regio(net, items, r, datum)
        if args.upload:
            upload(item)
        resultaat[item["id"]] = item
    lijst = [resultaat[r[0]] for r in REGIOS if r[0] in resultaat]
    os.makedirs(os.path.dirname(OVERZICHT), exist_ok=True)
    json.dump({
        "bijgewerkt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "versie": VERSIE,
        "bron": "© OpenStreetMap-bijdragers (ODbL)",
        "pakketten": lijst,
    }, open(OVERZICHT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    totaal = sum(p["bytes"] for p in lijst)
    print(f"{len(lijst)} routepakketten, samen {totaal / 1048576:.0f} MB -> {os.path.relpath(OVERZICHT, ROOT)} ({time.time() - begin:.0f} s)")


if __name__ == "__main__":
    main()
