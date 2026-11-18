#!/usr/bin/env python3
"""Kaartlagen verrijken: OpenStreetMap, officiële registers en eigen, nagekeken aanvullingen samenvoegen.

Per laag:
  1. de ruwe laag uit OpenStreetMap (pipeline/out/osm/<land>/<laag>.geojson, gemaakt door lagen.py);
  2. de officiële bronnen uit pipeline/officieel.py (alleen bronnen met een licentie die hergebruik toelaat);
  3. de eigen aanvullingen en correcties uit data/eigen/<land>/<laag>.json (zie pipeline/eigen.py).

Dubbels worden herkend op afstand en op naam of adres (pipeline/naam.py). Elk punt krijgt een veld
"betrouwbaarheid": "officieel", "nagekeken" (eigen, door PlanB72 nagekeken) of "osm". Bij een conflict
gaat de officiële bron voor. Elk verschil komt in pipeline/out/<land>-verschillen.csv, zodat iemand het
kan nakijken en eventueel in OpenStreetMap verbeteren. Gesloten plekken verdwijnen van de kaart.

Uitvoer: site/public/data/<land>/<laag>.geojson en meta.json (aantallen per herkomst en de bronnen),
pipeline/out/<land>-verschillen.csv en pipeline/out/<land>-verrijking.json (metingen).

Gebruik:
    python3 pipeline/verrijken.py BE
    python3 pipeline/verrijken.py BE --lagen apotheken dierenarts
    python3 pipeline/verrijken.py BE --zonder-officieel     # alleen OSM en eigen aanvullingen
    python3 pipeline/verrijken.py BE --vernieuw             # officiële bestanden opnieuw downloaden

Foutcodes: 3 = budget overschreden (pipeline/budget.json), 4 = ruwe OSM-laag ontbreekt.
In beide gevallen wordt niets weggeschreven. Alleen de standaardbibliotheek.
"""
import argparse
import csv
import datetime as dt
import json
import math
import os
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
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


def verrijk_laag(land, laag, osm, records, items, verschillen):
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

    telling = {"osm_ruw": len(osm), "officieel_ruw": len(records)}
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
    for soort in ("officieel", "nagekeken", "osm"):
        telling[soort] = sum(1 for f in uit if f["properties"].get("betrouwbaarheid") == soort)
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
    # Is dit zeker een praktijk (handelsnaam, vennootschap) of alleen een inschrijving (eenmanszaak zonder
    # handelsnaam: mogelijk een thuisadres of een dierenarts zonder vaste praktijk)? Staat dezelfde plek
    # ook in OpenStreetMap, dan heeft iemand er een praktijk gezien.
    if rec.get("praktijk"):
        props["praktijk"] = "praktijk" if osm_props.get("id") else rec["praktijk"]
    props["betrouwbaarheid"] = "officieel"
    props["bron"] = rec["bron"]
    if osm_props.get("id"):
        props["osm"] = osm_props.get("osm") or osm_props["id"]
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
        invoer[laag] = (osm, records)

    # 2. Records zonder bruikbaar punt plaatsen met het adressenbestand (België: BeST van BOSA).
    alle = [r for _, recs in invoer.values() for r in recs]
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
        osm, records = invoer[laag]
        items = eigen.lees(land, laag)
        features, telling = verrijk_laag(land, laag, osm, records, items, verschillen)
        tekst = op.compacte_json({"type": "FeatureCollection", "features": features})
        grootte = len(tekst.encode("utf-8"))
        telling["bytes"] = grootte
        telling["bronnen"] = sorted({r["bron"] for r in records})
        telling["geplaatst_op_straat"] = sum(1 for r in records if r.get("geplaatst") == "straat")
        resultaten[laag] = (tekst, telling)
        metingen[laag] = telling
        print(f"{laag}: {telling['osm_ruw']} uit OSM + {telling['officieel_ruw']} officieel + {len(items)} eigen "
              f"-> {telling['totaal']} punten (officieel {telling['officieel']}, nagekeken {telling['nagekeken']}, "
              f"osm {telling['osm']}; {telling['gekoppeld']} gekoppeld), {grootte / 1000:.0f} kB", flush=True)
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
    meta["bron"] = "© OpenStreetMap-bijdragers, ODbL; aangevuld met officiële bronnen (zie 'bronnen') en eigen, nagekeken gegevens"
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
            "osm_ruw": telling["osm_ruw"], "bronnen": telling["bronnen"], "verrijkt": vandaag,
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
