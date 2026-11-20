#!/usr/bin/env python3
"""Kaartlagen verrijken: OpenStreetMap, officiële registers en eigen, nagekeken aanvullingen samenvoegen.

Per laag:
  1. de ruwe laag uit OpenStreetMap (pipeline/out/osm/<land>/<laag>.geojson, gemaakt door lagen.py);
  2. de officiële bronnen uit pipeline/officieel.py (alleen bronnen met een licentie die hergebruik toelaat);
  3. open bronnen van plekken (Overture Maps Places, pipeline/derden.py): als kruiscontrole en om plekken aan
     te vullen die in twee onafhankelijke bronnen staan;
  4. de eigen aanvullingen en correcties uit data/eigen/<land>/<laag>.json (zie pipeline/eigen.py).

Dubbels worden herkend op afstand en op naam of adres (pipeline/naam.py). Elk punt krijgt een veld
"betrouwbaarheid": "officieel", "nagekeken" (eigen, door PlanB72 nagekeken), "osm" of "open-bron" (alleen uit
Overture). Bij een conflict gaat de officiële bron voor. Een ondernemingsregister (VKBO, SIRENE, BrightQuery) maakt
nooit een punt: het bevestigt alleen een plek uit een plaatsenbron (veld "register"). Een punt dat in twee onafhankelijke bronnen staat, krijgt
"zekerheid": "bevestigd"; een punt uit één open bron krijgt "zekerheid": "onzeker" (open ring, "Bel eerst"). Elk verschil komt in pipeline/out/<land>-verschillen.csv, zodat iemand het
kan nakijken en eventueel in OpenStreetMap verbeteren. Gesloten plekken verdwijnen van de kaart.

Uitvoer: site/public/data/<land>/<laag>.geojson en meta.json (aantallen per herkomst en de bronnen),
pipeline/out/<land>-verschillen.csv en pipeline/out/<land>-verrijking.json (metingen).

Gebruik:
    python3 pipeline/verrijken.py BE
    python3 pipeline/verrijken.py BE --lagen apotheken dierenarts
    python3 pipeline/verrijken.py BE --zonder-officieel     # alleen OSM en eigen aanvullingen
    python3 pipeline/verrijken.py BE --vernieuw             # officiële bestanden opnieuw downloaden
    python3 pipeline/verrijken.py BE --zonder-open-bron     # zonder Overture (geen duckdb nodig)

Foutcodes: 3 = budget overschreden (pipeline/budget.json), 4 = ruwe OSM-laag ontbreekt.
In beide gevallen wordt niets weggeschreven. Alleen de standaardbibliotheek.
"""
import argparse
import csv
import datetime as dt
import json
import math
import os
import re
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import derden  # noqa: E402
import eigen  # noqa: E402
import naam as nm  # noqa: E402
import officieel  # noqa: E402
import overpass as op  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pipeline" / "out"
LAGEN = eigen.LAGEN
NAMEN = {"ziekenhuizen": "Ziekenhuizen", "medisch": "Medische posten", "politie": "Politie",
         "brandweer": "Brandweer", "apotheken": "Apotheken", "aed": "AED's", "drinkwater": "Drinkwater",
         "overheid": "Gemeentehuizen", "dierenarts": "Dierenartsen"}

# Soort van een punt als de bron er geen geeft.
STANDAARD_SOORT = {"ziekenhuizen": "ziekenhuis", "medisch": "medische post", "politie": "politie",
                   "brandweer": "brandweer", "apotheken": "apotheek", "aed": "AED", "drinkwater": "drinkwaterpunt",
                   "overheid": "gemeentehuis", "dierenarts": "dierenarts"}

# Zoekstraal in meter voor dubbels. Ziekenhuizen en gemeentehuizen zijn grote gebouwen:
# het punt in OpenStreetMap ligt vaak midden op de campus, het officiële adres aan de ingang.
STRAAL = {"ziekenhuizen": 400, "overheid": 300, "brandweer": 250, "politie": 200}
STANDAARD_STRAAL = 150
# Punten zonder naam (AED, drinkwater) zijn alleen op afstand te herkennen.
STRAAL_ZONDER_NAAM = 25
# Afstand waarbinnen een punt zonder naam in OSM als hetzelfde geldt als een officieel punt met naam.
# Een AED hangt vaak binnen in een groot gebouw; de officiële bron plaatst ze op het adres.
STRAAL_NABIJ = {"aed": 60}
# Een gekoppeld punt dat verder dan dit ligt, komt als verschil in het rapport.
AFSTAND_MELDEN = 75

# Officiële bronnen die een ondernemingsregister zijn. Een inschrijving zegt waar iemand ingeschreven is, niet waar
# de praktijk is: een dierenarts of arts kan op zijn woonadres ingeschreven zijn en elders werken. Een register maakt
# daarom NOOIT zelf een punt op de kaart. Het mag een plek uit een plaatsenbron (OpenStreetMap, het plaatsendeel van
# Overture, een officiële lijst van locaties) bevestigen of aanvullen (naam, adres) als die binnen de koppelregels
# valt. BrightQuery (in Overture) haalt zijn gegevens uit dezelfde registers en volgt dezelfde regel.
ONDERNEMINGSREGISTERS = {"be-vl-vkbo-dierenartsen", "fr-sirene-veterinaires"}
# Lagen waar een plek die alleen in één open bron staat (zekerheid "onzeker") als open ring op de kaart mag.
# In de andere lagen komt een plek uit Overture er alleen bij als twee onafhankelijke bronnen ze kennen.
OPEN_EEN_BRON = {"dierenarts", "apotheken"}
# Lagen waar Overture geen plekken toevoegt, alleen bestaande punten bevestigt (zie docs/metingen.md).
OPEN_ALLEEN_BEVESTIGEN = {"ziekenhuizen", "overheid"}
# Een plek die alleen uit Overture komt, moet een vakwoord in haar naam hebben (de naam uit de bron, ook als die
# niet op de kaart komt). De categorie van een leverancier is te vaak fout: een drogisterij (dm) als apotheek,
# een winkel voor brandweermateriaal als kazerne, "Praktijk Groei" als apotheek. Uitzondering: een dierenarts uit
# een ondernemingsregister (BrightQuery, activiteitscode 75) waarvan de naam alleen die van de dierenarts zelf is
# (zoals de eenmanszaken in de VKBO); die naam komt niet op de kaart.
OPEN_VAKWOORD = {
    "apotheken": re.compile(r"apothe|pharmacie|pharmacy|farmacie"),
    "dierenarts": re.compile(r"dieren|veterin|tierarz|tierklinik|tierpraxis|kleintier|\bvet|\bdap\b|animal|paarden|pferde"),
    "medisch": re.compile(r"arts|dokter|\bdr\b|\bmed\b|medic|medec|praktijk|praxis|cabinet|centrum|centre|zentrum|"
                          r"gezondheid|sante|gesundheit|mvz|kliniek|clinique|wachtpost|garde"),
    "politie": re.compile(r"politie|police|polizei|gendarmerie|commissariat|revier|wache"),
    "brandweer": re.compile(r"brandweer|pompier|feuerwehr|sapeurs|secours|sdis|kazerne|caserne|fire station|"
                            r"cis\b|centre d.?incendie|cgdis"),
    "drinkwater": re.compile(r"drink|trink|potable|wasser|water|eau"),
}
# Woorden in de naam die tonen dat het geen post of praktijk is (winkel, vereniging, verkoop).
OPEN_GEEN = re.compile(r"versand|shop|winkel|magasin|handel|verband|verein|museum|musee|drogerie|drogist|"
                       r"school|ecole|opleiding|formation|vente|verkoop")
# Twee plekken uit Overture zijn dezelfde als ze dit dicht bij elkaar liggen en het adres overeenkomt,
# of heel dicht bij elkaar met een gelijkaardige naam.
OPEN_DUBBEL_ADRES_M = 60
OPEN_DUBBEL_NAAM_M = 25
# Een plek uit Overture binnen deze afstand van een punt van dezelfde laag (zonder duidelijk ander adres) is dat punt.
OPEN_NABIJ_M = 50
# Zo dicht bij elkaar is het altijd dezelfde plek, ook als adres of naam verschilt (hernoemde apotheek, OSM-adres
# zonder straat).
OPEN_NABIJ_ZEKER_M = 15
# Plekken uit één bron komen er alleen bij als minstens dit deel van de plekken die Overture zelf bevestigt
# (twee families), nog niet in de laag stond. Zie "verzadiging" in docs/kaartdata.md.
OPEN_EEN_BRON_MIN_MIST = 0.2
# Met minder bevestigde plekken dan dit is de verzadiging niet te meten (Luxemburg); dan geldt ze niet.
OPEN_EEN_BRON_MIN_N = 30

VERSCHIL_KOLOMMEN = ["laag", "verschil", "officieel_id", "osm_id", "eigen_id", "naam_officieel", "naam_osm",
                     "adres_officieel", "adres_osm", "afstand_m", "lat", "lon", "link", "uitleg"]


def afstand_m(a, b):
    """Afstand in meter tussen twee punten (lon, lat)."""
    return op.haversine(a[1], a[0], b[1], b[0])


class Raster:
    """Eenvoudige ruimtelijke index: vakken van ongeveer 1 km."""

    def __init__(self, punten):
        self.vakken = {}
        for i, (lon, lat) in enumerate(punten):
            self.vakken.setdefault(self._vak(lon, lat), []).append(i)

    @staticmethod
    def _vak(lon, lat):
        return (int(math.floor(lon * 70)), int(math.floor(lat * 110)))

    def buren(self, lon, lat, straal_m):
        n = int(straal_m // 900) + 1
        vx, vy = self._vak(lon, lat)
        for dx in range(-n, n + 1):
            for dy in range(-n, n + 1):
                yield from self.vakken.get((vx + dx, vy + dy), ())


def lees_geojson(pad):
    with open(pad, encoding="utf-8") as f:
        return json.load(f)["features"]


def ruwe_osm(land, laag, meta):
    """De ruwe OSM-laag. Bestaat die nog niet (oude uitvoer van lagen.py), dan is de
    gepubliceerde laag nog niet verrijkt en dus zelf de ruwe OSM-laag: die wordt gekopieerd."""
    ruw = OUT / "osm" / land.lower() / f"{laag}.geojson"
    if ruw.exists():
        return lees_geojson(ruw), ruw
    publiek = ROOT / "site" / "public" / "data" / land.lower() / f"{laag}.geojson"
    if publiek.exists() and not meta.get("lagen", {}).get(laag, {}).get("verrijkt"):
        ruw.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(publiek, ruw)
        return lees_geojson(ruw), ruw
    return None, ruw


def punt(f):
    return tuple(f["geometry"]["coordinates"])


def osm_link(osm_id):
    return f"https://www.openstreetmap.org/{osm_id}" if osm_id and "/" in osm_id else ""


def koppel(officieel_lijst, osm_lijst, laag):
    """Koppelt officiële records aan OSM-punten. Geeft {officieel_index: (osm_index, afstand, naamscore)}."""
    straal = STRAAL.get(laag, STANDAARD_STRAAL)
    raster = Raster([punt(f) for f in osm_lijst])
    kandidaten = []
    for i, rec in enumerate(officieel_lijst):
        if rec.get("lat") is None:
            continue
        p = (rec["lon"], rec["lat"])
        for j in raster.buren(p[0], p[1], 2 * straal):
            f = osm_lijst[j]
            d = afstand_m(p, punt(f))
            if d > 2 * straal:
                continue
            props = f["properties"]
            score = nm.naam_gelijkenis(rec.get("naam"), props.get("naam"))
            adres = nm.adres_gelijk(rec.get("adres"), props.get("adres"))
            if score is None and not rec.get("naam") and not props.get("naam"):
                # Beide zonder naam (AED, drinkwater): alleen heel dichtbij.
                ok = d <= STRAAL_ZONDER_NAAM
            elif d <= STRAAL_NABIJ.get(laag, 30):
                ok = (score is None or score >= 0.3 or adres is True) and adres is not False
            elif d <= straal:
                ok = (score is not None and score >= 0.6) or adres is True
            else:
                ok = score is not None and score >= 0.85 and adres is not False
            if ok:
                waarde = (score or 0.4) + (0.3 if adres else 0) - d / (4 * straal)
                kandidaten.append((waarde, i, j, d, score))
    kandidaten.sort(reverse=True)
    gekoppeld, bezet = {}, set()
    for waarde, i, j, d, score in kandidaten:
        if i in gekoppeld or j in bezet:
            continue
        gekoppeld[i] = (j, d, score)
        bezet.add(j)
    return gekoppeld


def zoek_doel(item, features, laag):
    """Index van de plek waar een eigen correctie over gaat, of None."""
    if item.get("doel"):
        for i, f in enumerate(features):
            p = f["properties"]
            if item["doel"] in (p.get("id"), p.get("osm")):
                return i
        return None
    if item.get("lat") is None:
        return None
    straal = STRAAL.get(laag, STANDAARD_STRAAL)
    beste = None
    for i, f in enumerate(features):
        d = afstand_m((item["lon"], item["lat"]), punt(f))
        if d > straal:
            continue
        score = nm.naam_gelijkenis(item.get("naam"), f["properties"].get("naam"))
        if (score or 0) >= 0.6 or (d <= 30 and score is None):
            if beste is None or d < beste[1]:
                beste = (i, d)
    return beste[0] if beste else None


def families_van_feature(props):
    """Onafhankelijke herkomsten die een punt op de kaart al heeft."""
    fam = set()
    b = props.get("betrouwbaarheid")
    if b == "osm" or props.get("osm"):
        fam.add("osm")
    if b == "officieel":
        fam.add("overheid")
    if b == "open-bron":
        fam.add("open")
    if props.get("register"):
        fam.add("register")
    return fam


def open_dubbels(recs, laag):
    """Voegt plekken uit Overture samen die dezelfde zijn (Overture heeft dubbels, bv. de vennootschap uit
    BrightQuery en de pagina van Meta van dezelfde praktijk). Geeft (records, aantal samengevoegd)."""
    if not recs:
        return [], 0
    recs = sorted(recs, key=lambda r: (-(r.get("conf") or 0), r["id"]))
    raster = Raster([(r["lon"], r["lat"]) for r in recs])
    ouder = list(range(len(recs)))

    def wortel(i):
        while ouder[i] != i:
            ouder[i] = ouder[ouder[i]]
            i = ouder[i]
        return i

    for i, a in enumerate(recs):
        for j in raster.buren(a["lon"], a["lat"], OPEN_DUBBEL_ADRES_M):
            if j <= i:
                continue
            b = recs[j]
            d = afstand_m((a["lon"], a["lat"]), (b["lon"], b["lat"]))
            if d > OPEN_DUBBEL_ADRES_M:
                continue
            adres = nm.adres_gelijk(a.get("adres"), b.get("adres"))
            score = nm.naam_gelijkenis(a.get("_ruwe_naam"), b.get("_ruwe_naam"))
            if adres is True or (d <= OPEN_DUBBEL_NAAM_M and adres is not False and (score is None or score >= 0.6)):
                ouder[wortel(j)] = wortel(i)
    groepen = {}
    for i in range(len(recs)):
        groepen.setdefault(wortel(i), []).append(recs[i])
    uit = []
    for leden in groepen.values():
        # De zekerste met een naam vooraan; families en herkomst van de hele groep.
        leden.sort(key=lambda r: (not r.get("naam"), r.get("gesloten"), -(r.get("conf") or 0)))
        r = dict(leden[0])
        fam = {}
        for x in leden:
            if x.get("gesloten"):
                continue
            for k, v in x["families"].items():
                fam[k] = max(fam.get(k, v), v)
        r["families"] = fam
        r["conf"] = max((x.get("conf") or 0) for x in leden)
        r["gesloten"] = all(x.get("gesloten") for x in leden)
        r["herkomst"] = ", ".join(sorted({h for x in leden for h in (x.get("herkomst") or "").split(", ") if h}))
        r["zekerheid"] = derden.zekerheid_van(fam, r["conf"])
        uit.append(r)
    return uit, len(recs) - len(uit)


def verrijk_laag(land, laag, osm, records, items, verschillen, open_records=()):
    """Voegt samen. Geeft (features, telling)."""
    def meld(verschil, rec=None, f=None, item=None, d=None, uitleg=""):
        pf = (f or {}).get("properties", {})
        officieel_punt = pf.get("betrouwbaarheid") == "officieel"
        if rec is None and officieel_punt:
            rec = {"id": pf.get("id"), "adres": pf.get("adres")}
        osm_id = pf.get("osm") or (pf.get("id") if "/" in str(pf.get("id", "")) else "")
        plaats = (rec["lat"], rec["lon"]) if rec and rec.get("lat") is not None else (
            (punt(f)[1], punt(f)[0]) if f else ((item or {}).get("lat"), (item or {}).get("lon")))
        verschillen.append({
            "laag": laag, "verschil": verschil, "officieel_id": (rec or {}).get("id", ""), "osm_id": osm_id,
            "eigen_id": (item or {}).get("id", ""),
            "naam_officieel": (rec or {}).get("naam", "") or (pf.get("naam", "") if officieel_punt else ""),
            "naam_osm": "" if officieel_punt and not pf.get("osm") else pf.get("naam", ""), "adres_officieel": (rec or {}).get("adres", ""),
            "adres_osm": pf.get("adres", ""), "afstand_m": "" if d is None else round(d),
            "lat": "" if plaats[0] is None else round(plaats[0], 5),
            "lon": "" if plaats[1] is None else round(plaats[1], 5), "link": osm_link(osm_id), "uitleg": uitleg})

    # Ondernemingsregisters apart: ze bevestigen achteraf, ze maken geen punten.
    registers = [r for r in records if r.get("bron") in ONDERNEMINGSREGISTERS]
    records = [r for r in records if r.get("bron") not in ONDERNEMINGSREGISTERS]
    telling = {"osm_ruw": len(osm), "officieel_ruw": len(records), "register_ruw": len(registers)}
    geplaatst = [r for r in records if r.get("lat") is not None]
    for r in records:
        if r.get("lat") is None:
            meld("niet_geplaatst", rec=r, uitleg="adres niet (precies genoeg) gevonden in het adressenbestand; niet op de kaart")
    telling["officieel_niet_geplaatst"] = len(records) - len(geplaatst)

    gekoppeld = koppel(geplaatst, osm, laag)
    gebruikt = set()
    uit = []
    volledig = {r["bron"] for r in geplaatst if r.get("_volledig")}
    for i, rec in enumerate(geplaatst):
        if i in gekoppeld:
            j, d, score = gekoppeld[i]
            f = osm[j]
            gebruikt.add(j)
            po = f["properties"]
            if rec.get("gesloten"):
                meld("gesloten_officieel", rec, f, d=d, uitleg="volgens de officiële bron gesloten; staat nog in OpenStreetMap")
                continue
            if score is not None and score < 0.8:
                meld("naam", rec, f, d=d, uitleg=f"naam verschilt (gelijkenis {score})")
            if nm.adres_gelijk(rec.get("adres"), po.get("adres")) is False:
                meld("adres", rec, f, d=d, uitleg="adres verschilt")
            if d > AFSTAND_MELDEN:
                meld("afstand", rec, f, d=d, uitleg=f"punt ligt {round(d)} m van het officiële adres")
            uit.append(officieel_feature(laag, rec, po))
        else:
            if rec.get("gesloten"):
                continue
            meld("ontbreekt_in_osm", rec, uitleg="officieel punt zonder overeenkomst in OpenStreetMap")
            uit.append(officieel_feature(laag, rec, {}))
    for j, f in enumerate(osm):
        if j in gebruikt:
            continue
        uit.append(f)
        # Alleen melden als een officiële bron het hele gebied dekt waarin het punt ligt.
        if volledig and any(officieel.dekt(b, punt(f)) for b in volledig):
            meld("niet_in_officieel", f=f, uitleg="staat in OpenStreetMap, niet in de officiële lijst (gesloten of verhuisd?)")

    # Open bronnen (Overture): kruiscontrole met wat er al staat, en aanvullen.
    telling.update({"open_ruw": len(open_records), "open_dubbel": 0, "open_bevestigt": 0, "open_gesloten": 0,
                    "open_nieuw_bevestigd": 0, "open_nieuw_onzeker": 0, "open_te_zwak": 0, "open_alleen_register": 0})
    if open_records:
        open_lijst, telling["open_dubbel"] = open_dubbels(list(open_records), laag)
        # Koppelen op de naam uit de bron, ook als die niet op de kaart komt (naam van een persoon).
        vergelijk = [dict(r, naam=r.get("_ruwe_naam")) for r in open_lijst]
        gekoppeld_open = koppel(vergelijk, uit, laag)
        # Tweede stap: een plek uit Overture die vlak bij een punt van dezelfde laag ligt en geen duidelijk ander
        # adres heeft, is dat punt (in OSM heet een apotheek vaak gewoon "Pharmacie", in Overture "Pharmacie du
        # Centre"). Ze bevestigt het punt en komt er niet naast.
        telling["open_nabij"] = 0
        bestaand = Raster([punt(f) for f in uit])
        for i, rec in enumerate(open_lijst):
            if i in gekoppeld_open:
                continue
            q = (rec["lon"], rec["lat"])
            beste = None
            for j in bestaand.buren(q[0], q[1], OPEN_NABIJ_M):
                d = afstand_m(q, punt(uit[j]))
                if d > OPEN_NABIJ_M:
                    continue
                pj = uit[j]["properties"]
                adres = nm.adres_gelijk(rec.get("adres"), pj.get("adres"))
                score = nm.naam_gelijkenis(rec.get("_ruwe_naam"), pj.get("naam"))
                algemeen = not nm.naam_tokens(rec.get("_ruwe_naam")) or not nm.naam_tokens(pj.get("naam"))
                if d <= OPEN_NABIJ_ZEKER_M or adres is not False or algemeen or (score or 0) >= 0.5:
                    if beste is None or d < beste[1]:
                        beste = (j, d)
            if beste:
                gekoppeld_open[i] = (beste[0], beste[1], None)
                telling["open_nabij"] += 1
        kandidaten, bevestigd_gekoppeld = [], 0
        for i, rec in enumerate(open_lijst):
            if i in gekoppeld_open:
                j, d, score = gekoppeld_open[i]
                p = uit[j]["properties"]
                if rec.get("gesloten"):
                    telling["open_gesloten"] += 1
                    meld("gesloten_open_bron", rec, uit[j], d=d,
                         uitleg=f"volgens Overture ({rec.get('herkomst')}) definitief gesloten; nakijken")
                    continue
                if (rec.get("conf") or 0) < derden.MIN_CONF_BEVESTIGING or not rec["families"]:
                    continue
                telling["open_bevestigt"] += 1
                bevestigd_gekoppeld += rec.get("zekerheid") == "bevestigd"
                if len(families_van_feature(p) | set(rec["families"])) >= 2:
                    p["zekerheid"] = "bevestigd"
                continue
            if rec.get("gesloten"):
                continue
            z = rec.get("zekerheid")
            ruw = nm.basis(rec.get("_ruwe_naam"))
            vak = laag in OPEN_VAKWOORD and OPEN_VAKWOORD[laag].search(ruw) and not OPEN_GEEN.search(ruw)
            # Een plek die Overture alleen uit een ondernemingsregister kent (BrightQuery), is een inschrijving en
            # geen plek: ze komt niet op de kaart.
            if not set(rec["families"]) - {"register"}:
                telling["open_alleen_register"] += 1
                continue
            # Uitzondering: een dierenarts die ook in een register staat (activiteitscode 75) en wiens naam in de
            # plaatsenbron alleen een persoonsnaam is; die naam komt niet op de kaart.
            persoon_in_register = laag == "dierenarts" and "register" in rec["families"] and not rec.get("naam")
            if z and not vak and not persoon_in_register:
                z = None
            if laag in OPEN_ALLEEN_BEVESTIGEN or z is None or (z == "onzeker" and laag not in OPEN_EEN_BRON):
                telling["open_te_zwak"] += 1
                continue
            kandidaten.append((rec, z))
        # Verzadiging: welk deel van de plekken die Overture zelf bevestigt (twee families), ontbreekt in de laag?
        # Is dat klein, dan is de laag zo goed als volledig en zijn plekken uit één bron vooral dubbels of gesloten
        # zaken (apotheken in Frankrijk en Duitsland). Dan komen alleen bevestigde plekken erbij.
        nieuw_bev = sum(1 for _, z in kandidaten if z == "bevestigd")
        telling["open_mist"] = round(nieuw_bev / (nieuw_bev + bevestigd_gekoppeld), 3) if nieuw_bev + bevestigd_gekoppeld else 0
        een_bron = nieuw_bev + bevestigd_gekoppeld < OPEN_EEN_BRON_MIN_N or telling["open_mist"] >= OPEN_EEN_BRON_MIN_MIST
        telling["open_verzadigd"] = 0
        for rec, z in kandidaten:
            if z == "onzeker" and not een_bron:
                telling["open_verzadigd"] += 1
                continue
            telling["open_nieuw_" + z] += 1
            meld("open_bron_nieuw", rec, uitleg=f"alleen in Overture ({rec.get('herkomst')}), zekerheid {z}")
            uit.append(open_feature(laag, rec))

    # Ondernemingsregisters (VKBO, SIRENE): alleen bevestigen. Een inschrijving die met een plek op de kaart
    # samenvalt (afstand en naam of adres, zoals bij elke koppeling), bevestigt die plek en vult een ontbrekende
    # naam of adres aan. Een inschrijving zonder plek komt niet op de kaart, alleen in de verschillenlijst.
    telling.update({"register_bevestigt": 0, "register_zonder_plek": 0})
    reg_geplaatst = [r for r in registers if r.get("lat") is not None and not r.get("gesloten")]
    gekoppeld_reg = koppel(reg_geplaatst, uit, laag)
    for i, rec in enumerate(reg_geplaatst):
        if i not in gekoppeld_reg:
            telling["register_zonder_plek"] += 1
            meld("register_zonder_plek", rec, uitleg="alleen een inschrijving in een ondernemingsregister, geen plek in "
                 "OpenStreetMap of Overture; niet op de kaart (een inschrijving is geen praktijk)")
            continue
        j, d, score = gekoppeld_reg[i]
        p = uit[j]["properties"]
        telling["register_bevestigt"] += 1
        if len(families_van_feature(p) | {"register"}) >= 2:
            p["zekerheid"] = "bevestigd"
        # Alleen een naam die een zaak aanduidt (praktijk, kliniek, ...): de naam van een vennootschap is vaak die
        # van de dierenarts zelf ("Gastmans Pascale"), en een persoonsnaam komt niet op de kaart.
        if not p.get("naam") and derden.toon_naam(rec.get("naam"), None):
            p["naam"] = rec["naam"]
        if not p.get("adres") and rec.get("adres"):
            p["adres"] = rec["adres"]
        p["register"] = rec["bron"]

    # Eigen aanvullingen en correcties, in volgorde van het bestand.
    telling.update({"eigen_toegevoegd": 0, "eigen_gecorrigeerd": 0, "eigen_gesloten": 0, "eigen_conflict": 0})
    for item in items:
        actie = item["actie"]
        if actie == "toevoegen":
            doel = zoek_doel({**item, "doel": None}, uit, laag)
            if doel is not None and uit[doel]["properties"].get("betrouwbaarheid") == "officieel":
                meld("eigen_al_officieel", f=uit[doel], item=item, uitleg="eigen aanvulling staat al in een officiële bron")
                continue
            nieuw = eigen_feature(laag, item, uit[doel]["properties"] if doel is not None else {})
            if doel is not None:
                meld("eigen_vervangt_osm", f=uit[doel], item=item, uitleg="eigen aanvulling vervangt een punt uit OpenStreetMap")
                uit[doel] = nieuw
            else:
                meld("eigen_toegevoegd", item=item, uitleg="ontbreekt in OpenStreetMap en in de officiële bronnen")
                uit.append(nieuw)
            telling["eigen_toegevoegd"] += 1
            continue
        doel = zoek_doel(item, uit, laag)
        if doel is None:
            meld("eigen_doel_niet_gevonden", item=item, uitleg=f"{actie}: geen plek gevonden (doel {item.get('doel') or 'via punt en naam'})")
            continue
        p = uit[doel]["properties"]
        if p.get("betrouwbaarheid") == "officieel":
            # De officiële bron gaat voor; het verschil gaat naar de beheerder van die bron.
            meld("eigen_conflict_officieel", f=uit[doel], item=item,
                 uitleg=f"{actie} niet toegepast: de officiële bron gaat voor; aan de bron melden")
            telling["eigen_conflict"] += 1
            continue
        if actie == "gesloten":
            meld("eigen_gesloten", f=uit[doel], item=item, uitleg="als gesloten gemarkeerd; ook in OpenStreetMap aan te passen")
            uit.pop(doel)
            telling["eigen_gesloten"] += 1
        else:
            meld("eigen_gecorrigeerd", f=uit[doel], item=item, uitleg="gecorrigeerd: " + ", ".join(sorted(item.get("velden", {})) or ["punt"]))
            uit[doel] = eigen_feature(laag, item, p, basis=uit[doel])
            telling["eigen_gecorrigeerd"] += 1

    uit = [f for f in uit if not f["properties"].get("gesloten")]
    uit.sort(key=lambda f: str(f["properties"]["id"]))
    for soort in ("officieel", "nagekeken", "osm", "open-bron"):
        telling[soort] = sum(1 for f in uit if f["properties"].get("betrouwbaarheid") == soort)
    for z in ("bevestigd", "onzeker"):
        telling[z] = sum(1 for f in uit if f["properties"].get("zekerheid") == z)
    telling["totaal"] = len(uit)
    telling["gekoppeld"] = len(gekoppeld)
    return uit, telling


# Velden uit OpenStreetMap die een officiële bron meestal niet heeft en die we behouden.
OSM_AANVULLEND = ("openingsuren", "toegang", "binnen", "emergency")


def officieel_feature(laag, rec, osm_props):
    props = {"id": rec["id"], "naam": rec.get("naam") or osm_props.get("naam"),
             "soort": rec.get("soort") or osm_props.get("soort") or STANDAARD_SOORT[laag]}
    for k in ("emergency",):
        if rec.get(k):
            props[k] = rec[k]
    for k in OSM_AANVULLEND:
        if k not in props and osm_props.get(k):
            props[k] = osm_props[k]
    props["adres"] = rec.get("adres") or osm_props.get("adres")
    if rec.get("telefoon"):
        props["telefoon"] = rec["telefoon"]
    props["betrouwbaarheid"] = "officieel"
    props["bron"] = rec["bron"]
    if osm_props.get("id"):
        props["osm"] = osm_props.get("osm") or osm_props["id"]
    return op.feature(rec["lat"], rec["lon"], props)


def open_feature(laag, rec):
    """Een plek die alleen uit Overture komt. Nooit "officieel": de herkomst is "open-bron"."""
    props = {"id": rec["id"], "naam": rec.get("naam"), "soort": rec.get("soort") or STANDAARD_SOORT[laag],
             "emergency": rec.get("emergency"), "adres": rec.get("adres"), "telefoon": rec.get("telefoon"),
             "zekerheid": rec.get("zekerheid"), "betrouwbaarheid": "open-bron", "bron": rec["bron"],
             "herkomst": rec.get("herkomst")}
    return op.feature(rec["lat"], rec["lon"], props)


def eigen_feature(laag, item, oud_props, basis=None):
    props = dict(oud_props)
    props.pop("bron", None)
    if basis is None:
        props = {k: v for k, v in props.items() if k in OSM_AANVULLEND}
        if oud_props.get("id") and "/" in str(oud_props.get("id")):
            props["osm"] = oud_props["id"]
    elif "/" in str(oud_props.get("id", "")):
        props["osm"] = oud_props["id"]
    props["id"] = f"eigen:{item['id']}"
    for k in ("naam", "adres", "soort"):
        if item.get(k):
            props[k] = item[k]
    props.setdefault("soort", STANDAARD_SOORT[laag])
    for k, v in (item.get("velden") or {}).items():
        props[k] = v
    props["betrouwbaarheid"] = "nagekeken"
    props["datum"] = item["datum"]
    if item.get("bron", {}).get("url"):
        props["bewijs"] = item["bron"]["url"]
    if item.get("lat") is not None:
        lat, lon = item["lat"], item["lon"]
    else:
        lon, lat = basis["geometry"]["coordinates"]
    # Volgorde van de velden gelijk aan de andere punten.
    volgorde = ["id", "naam", "soort", "emergency", "openingsuren", "toegang", "binnen", "adres", "telefoon",
                "betrouwbaarheid", "datum", "bewijs", "osm"]
    props = {k: props[k] for k in volgorde if k in props}
    return op.feature(lat, lon, props)


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("land", nargs="?", default="BE")
    p.add_argument("--lagen", nargs="+", choices=LAGEN)
    p.add_argument("--zonder-officieel", action="store_true", help="officiële bronnen overslaan")
    p.add_argument("--vernieuw", action="store_true", help="officiële bestanden opnieuw downloaden")
    p.add_argument("--zonder-open-bron", action="store_true", help="Overture Maps Places overslaan")
    args = p.parse_args()

    land = args.land.upper()
    doelmap = ROOT / "site" / "public" / "data" / land.lower()
    metapad = doelmap / "meta.json"
    meta = json.load(open(metapad, encoding="utf-8")) if metapad.exists() else {"land": land, "lagen": {}}
    with open(ROOT / "pipeline" / "budget.json", encoding="utf-8") as f:
        budget = json.load(f)
    budget_lagen = {**budget.get("lagen", {}), **budget.get("landen", {}).get(land, {}).get("lagen", {})}

    t0 = time.time()
    resultaten, verschillen, metingen, problemen = {}, [], {}, []
    bronnen_info = {}
    gekozen = args.lagen or LAGEN

    # 1. Ruwe lagen en officiële records voor alle lagen.
    invoer = {}
    for laag in gekozen:
        osm, ruwpad = ruwe_osm(land, laag, meta)
        if osm is None:
            print(f"{laag}: geen ruwe OSM-laag in {ruwpad.relative_to(ROOT)}; draai eerst pipeline/lagen.py {land}",
                  file=sys.stderr)
            return 4
        records = []
        if not args.zonder_officieel:
            for bron in officieel.bronnen(land, laag):
                print(f"{laag}: {bron['id']} ...", flush=True)
                recs, info = officieel.haal(bron, vernieuw=args.vernieuw)
                records += recs
                bronnen_info[bron["id"]] = info
                print(f"  {len(recs)} records", flush=True)
        open_records = []
        if not args.zonder_open_bron:
            kader = json.load(open(ROOT / "data" / "landen" / f"{land.lower()}.json", encoding="utf-8")).get("bbox")
            open_records, info = derden.records(land, laag, vernieuw=args.vernieuw, kader=kader)
            bronnen_info[derden.BRON_ID] = info
            print(f"{laag}: Overture {info['release']}: {len(open_records)} plekken", flush=True)
        invoer[laag] = (osm, records, open_records)

    # 2. Records zonder bruikbaar punt plaatsen met het adressenbestand (België: BeST van BOSA).
    alle = [r for _, recs, _ in invoer.values() for r in recs]
    te_plaatsen = [r for r in alle if r.get("_plaatsen")]
    if land == "BE" and (te_plaatsen or any(officieel._DEKKING.get(r["bron"]) for r in alle)):
        import adressen
        geo = adressen.geocoder(args.vernieuw)
        for r in te_plaatsen:
            straat, nummer, postcode, gemeente = r["_plaatsen"]
            geo.vraag(straat, postcode, gemeente)
        print(f"adressen: {len(te_plaatsen)} adressen plaatsen met BeST (BOSA) ...", flush=True)
        geo.lees()
        bronnen_info[adressen.BRON_ID] = {
            "naam": "BOSA: BeST-adressen (openaddress-be)", "kort": "BOSA BeST", "eigenaar": "FOD BOSA",
            "licentie": "CC BY 4.0", "url": "https://opendata.bosa.be/",
            "datum": dt.date.fromtimestamp(geo.datum).isoformat(), "opgehaald": dt.date.today().isoformat()}
        for r in te_plaatsen:
            straat, nummer, postcode, gemeente = r["_plaatsen"]
            gevonden = geo.plaats(straat, nummer, postcode, gemeente)
            if gevonden and not (r.get("_precisie") == "adres" and gevonden[2] != "adres"):
                r["lat"], r["lon"], r["geplaatst"] = round(gevonden[0], 6), round(gevonden[1], 6), gevonden[2]
            elif r.get("_terugval"):
                # Adres niet precies gevonden: het punt van de bron zelf, als die er een heeft.
                r["lat"], r["lon"] = r["_terugval"]
                r["geplaatst"] = "bron"
            else:
                r["lat"] = r["lon"] = None
    elif te_plaatsen:
        for r in te_plaatsen:
            if r.get("geplaatst") != "bron":
                r["lat"] = r["lon"] = None

    # 3. Samenvoegen per laag.
    for laag in gekozen:
        osm, records, open_records = invoer[laag]
        items = eigen.lees(land, laag)
        features, telling = verrijk_laag(land, laag, osm, records, items, verschillen, open_records)
        tekst = op.compacte_json({"type": "FeatureCollection", "features": features})
        grootte = len(tekst.encode("utf-8"))
        telling["bytes"] = grootte
        telling["bronnen"] = sorted({r["bron"] for r in records} | ({derden.BRON_ID} if open_records else set()))
        telling["geplaatst_op_straat"] = sum(1 for r in records if r.get("geplaatst") == "straat")
        resultaten[laag] = (tekst, telling)
        metingen[laag] = telling
        print(f"{laag}: {telling['osm_ruw']} uit OSM + {telling['officieel_ruw']} officieel + {len(items)} eigen "
              f"-> {telling['totaal']} punten (officieel {telling['officieel']}, nagekeken {telling['nagekeken']}, "
              f"osm {telling['osm']}, open bron {telling['open-bron']}; {telling['gekoppeld']} gekoppeld; "
              f"bevestigd {telling['bevestigd']}, onzeker {telling['onzeker']}), {grootte / 1000:.0f} kB"
              + (f"; register {telling['register_ruw']}: {telling['register_bevestigt']} bevestigen een plek, "
                 f"{telling['register_zonder_plek']} zonder plek" if telling["register_ruw"] else "")
              + (f"; {telling['open_alleen_register']} alleen uit BrightQuery weggelaten"
                 if telling.get("open_alleen_register") else ""), flush=True)
        limiet = budget_lagen.get(laag, budget.get("standaard_laag"))
        if limiet and grootte > limiet:
            problemen.append(f"{laag}: {grootte} bytes > budget {limiet}")

    for tekst in problemen:
        print(f"PROBLEEM (budget): {tekst}", file=sys.stderr)
    if problemen:
        print("Budget overschreden: niets weggeschreven.", file=sys.stderr)
        return 3

    vandaag = dt.date.today().isoformat()
    meta.setdefault("lagen", {})
    meta["bron"] = ("© OpenStreetMap-bijdragers, ODbL; aangevuld met officiële bronnen en open bronnen (zie 'bronnen', "
                    "licentieteksten in licenties/) en eigen, nagekeken gegevens")
    # lagen.py zet "opgehaald" op de datum van de OSM-data; verrijken.py verandert die niet.
    meta["osm_opgehaald"] = meta.get("opgehaald")
    bestaande = meta.get("bronnen", {})
    bestaande.update(bronnen_info)
    meta["bronnen"] = dict(sorted(bestaande.items()))
    for laag, (tekst, telling) in resultaten.items():
        with open(doelmap / f"{laag}.geojson", "w", encoding="utf-8") as f:
            f.write(tekst)
        meta["lagen"][laag] = {
            "naam": NAMEN[laag], "aantal": telling["totaal"], "bytes": telling["bytes"],
            "osm": telling["osm"], "officieel": telling["officieel"], "nagekeken": telling["nagekeken"],
            "osm_ruw": telling["osm_ruw"], "open_bron": telling["open-bron"], "bevestigd": telling["bevestigd"],
            "bronnen": telling["bronnen"], "verrijkt": vandaag,
            "register_bevestigt": telling["register_bevestigt"],
        }
    with open(metapad, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")

    OUT.mkdir(parents=True, exist_ok=True)
    csvpad = OUT / f"{land.lower()}-verschillen.csv"
    # Bij een gedeeltelijke run blijven de regels van de andere lagen staan.
    oud = []
    if args.lagen and csvpad.exists():
        with open(csvpad, encoding="utf-8", newline="") as f:
            oud = [r for r in csv.DictReader(f) if r["laag"] not in resultaten]
    with open(csvpad, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=VERSCHIL_KOLOMMEN)
        w.writeheader()
        w.writerows(oud + verschillen)
    meetpad = OUT / f"{land.lower()}-verrijking.json"
    vorige_metingen = json.load(open(meetpad, encoding="utf-8")) if meetpad.exists() else {}
    vorige_metingen.update(metingen)
    with open(meetpad, "w", encoding="utf-8") as f:
        json.dump(vorige_metingen, f, ensure_ascii=False, indent=2)
    soorten = {}
    for r in verschillen:
        soorten[r["verschil"]] = soorten.get(r["verschil"], 0) + 1
    print("Verschillen: " + (", ".join(f"{k} {v}" for k, v in sorted(soorten.items())) or "geen"))
    print(f"Klaar in {time.time() - t0:.0f} s; {csvpad.relative_to(ROOT)} en {metapad.relative_to(ROOT)} bijgewerkt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
