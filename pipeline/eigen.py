#!/usr/bin/env python3
"""Eigen aanvullingen en correcties op de kaartlagen: data/eigen/<land>/<laag>.json.

Een bestand bevat een lijst "items". Elk item is één nagekeken wijziging:

  actie        "toevoegen"  een plek die ontbreekt
               "corrigeren" naam, adres, punt of een ander veld van een bestaande plek verbeteren
               "gesloten"   een plek die niet meer bestaat (verdwijnt van de kaart)
  id           vaste sleutel, uniek in het bestand: kleine letters, cijfers en '-' (bv. "be-dierenarts-0001")
  naam         verplicht bij toevoegen
  adres        "Straat 12, 1234 Gemeente"; verplicht bij toevoegen
  lat, lon     WGS84 (EPSG:4326), vijf decimalen volstaan; verplicht bij toevoegen,
               en bij corrigeren of gesloten als er geen 'doel' is
  doel         bij corrigeren of gesloten: de id van de plek op de kaart ("node/123" uit OpenStreetMap,
               of de id van een officieel punt, bv. "be-fagg-apotheken:12345"); zonder doel zoekt de
               pijplijn de plek binnen 150 m met een gelijkaardige naam
  velden       bij corrigeren: de velden die veranderen, bv. {"openingsuren": "Mo-Fr 09:00-18:00"}
  soort        optioneel, bv. "dierenarts" (anders de soort van de laag)
  bron         verplicht: {"soort": ..., "url": ..., "omschrijving": ...}; minstens url of omschrijving.
               Soorten: website, gemeentelijke lijst, officiële lijst, foto, ter plaatse, telefoon, andere
  datum        verplicht: datum van de controle, JJJJ-MM-DD, niet in de toekomst
  ingediend_door   verplicht: wie de wijziging voorstelt (naam of GitHub-gebruiker)
  nagekeken_door   verplicht: wie de bron zelf nakeek; niet dezelfde persoon als ingediend_door
  opmerking    optioneel

Deze module valideert de bestanden (ook vanuit pipeline/controleer_inhoud.py) en leest ze in
voor pipeline/verrijken.py. Alleen de standaardbibliotheek.
"""
import datetime as dt
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EIGEN = os.path.join(ROOT, "data", "eigen")

LAGEN = ("ziekenhuizen", "medisch", "politie", "brandweer", "apotheken", "aed",
         "drinkwater", "overheid", "dierenarts")
ACTIES = ("toevoegen", "corrigeren", "gesloten")
BRONSOORTEN = ("website", "gemeentelijke lijst", "officiële lijst", "foto", "ter plaatse",
               "telefoon", "andere")
# Velden die een correctie mag aanpassen (dezelfde als in de kaartlagen).
VELDEN = ("naam", "adres", "soort", "openingsuren", "toegang", "binnen", "emergency", "telefoon")
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,63}$")


def _land_bbox(land):
    pad = os.path.join(ROOT, "data", "landen", f"{land}.json")
    if not os.path.exists(pad):
        return None
    with open(pad, encoding="utf-8") as f:
        return json.load(f).get("bbox")


def bestanden():
    """Alle eigen bestanden als (land, laag, pad)."""
    uit = []
    for pad in sorted(glob.glob(os.path.join(EIGEN, "*", "*.json"))):
        land = os.path.basename(os.path.dirname(pad))
        laag = os.path.splitext(os.path.basename(pad))[0]
        uit.append((land, laag, pad))
    return uit


def valideer_item(item, land, bbox, vandaag=None):
    """Lijst van fouten (tekst) voor één item."""
    vandaag = vandaag or dt.date.today()
    fouten = []
    if not isinstance(item, dict):
        return ["item is geen object"]
    actie = item.get("actie")
    if actie not in ACTIES:
        fouten.append(f"'actie' moet {', '.join(ACTIES)} zijn")
    if not ID_RE.match(str(item.get("id", ""))):
        fouten.append("'id' ontbreekt of is ongeldig (kleine letters, cijfers en '-', 3 tot 64 tekens)")
    if actie == "toevoegen":
        for veld in ("naam", "adres"):
            if not str(item.get(veld, "")).strip():
                fouten.append(f"'{veld}' is verplicht bij toevoegen")
    heeft_punt = "lat" in item or "lon" in item
    if actie == "toevoegen" or (actie in ("corrigeren", "gesloten") and not item.get("doel")) or heeft_punt:
        lat, lon = item.get("lat"), item.get("lon")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            fouten.append("'lat' en 'lon' zijn verplicht (getallen in WGS84)"
                          + ("" if actie == "toevoegen" else " als er geen 'doel' is"))
        elif bbox and not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
            fouten.append(f"punt {lat}, {lon} ligt buiten {land.upper()} (lat en lon omgewisseld?)")
    if actie == "corrigeren":
        velden = item.get("velden")
        if not heeft_punt and not (isinstance(velden, dict) and velden):
            fouten.append("'velden' (of een nieuw punt) is verplicht bij corrigeren")
        if isinstance(velden, dict):
            for k in velden:
                if k not in VELDEN:
                    fouten.append(f"veld '{k}' kan niet gecorrigeerd worden (wel: {', '.join(VELDEN)})")
    bron = item.get("bron")
    if not isinstance(bron, dict) or not (str(bron.get("url", "")).strip() or str(bron.get("omschrijving", "")).strip()):
        fouten.append("'bron' met 'url' of 'omschrijving' is verplicht")
    else:
        if bron.get("soort") not in BRONSOORTEN:
            fouten.append(f"'bron.soort' moet {', '.join(BRONSOORTEN)} zijn")
        if bron.get("url") and not re.match(r"^https?://", str(bron["url"])):
            fouten.append("'bron.url' moet met http:// of https:// beginnen")
    try:
        datum = dt.date.fromisoformat(str(item.get("datum", "")))
        if datum > vandaag:
            fouten.append(f"'datum' {datum} ligt in de toekomst")
    except ValueError:
        fouten.append("'datum' ontbreekt of is geen JJJJ-MM-DD")
    ingediend = str(item.get("ingediend_door", "")).strip()
    nagekeken = str(item.get("nagekeken_door", "")).strip()
    if not ingediend:
        fouten.append("'ingediend_door' is verplicht")
    if not nagekeken:
        fouten.append("'nagekeken_door' is verplicht (tweede persoon die de bron nakeek)")
    if ingediend and nagekeken and ingediend.lower() == nagekeken.lower():
        fouten.append("'nagekeken_door' moet iemand anders zijn dan 'ingediend_door'")
    return fouten


def valideer(vandaag=None):
    """Alle fouten in data/eigen/, als tekst met bestandsnaam."""
    fouten = []
    for land, laag, pad in bestanden():
        naam = os.path.relpath(pad, ROOT)
        bbox = _land_bbox(land)
        if bbox is None:
            fouten.append(f"{naam}: onbekend land '{land}' (geen data/landen/{land}.json)")
        if laag not in LAGEN:
            fouten.append(f"{naam}: onbekende laag '{laag}' (wel: {', '.join(LAGEN)})")
        try:
            with open(pad, encoding="utf-8") as f:
                inhoud = json.load(f)
        except (OSError, ValueError) as e:
            fouten.append(f"{naam}: geen geldige JSON ({e})")
            continue
        items = inhoud.get("items") if isinstance(inhoud, dict) else None
        if not isinstance(items, list):
            fouten.append(f"{naam}: verwacht een object met een lijst 'items'")
            continue
        gezien = set()
        for i, item in enumerate(items):
            label = f"{naam} item {i + 1}" + (f" ({item.get('id')})" if isinstance(item, dict) and item.get("id") else "")
            for fout in valideer_item(item, land, bbox, vandaag):
                fouten.append(f"{label}: {fout}")
            if isinstance(item, dict) and item.get("id"):
                if item["id"] in gezien:
                    fouten.append(f"{label}: 'id' komt twee keer voor")
                gezien.add(item["id"])
    return fouten


def lees(land, laag):
    """De geldige items voor een land en laag (lege lijst als er geen bestand is)."""
    pad = os.path.join(EIGEN, land.lower(), f"{laag}.json")
    if not os.path.exists(pad):
        return []
    with open(pad, encoding="utf-8") as f:
        items = json.load(f).get("items", [])
    bbox = _land_bbox(land.lower())
    goed = []
    for item in items:
        fouten = valideer_item(item, land.lower(), bbox)
        if fouten:
            raise ValueError(f"{os.path.relpath(pad, ROOT)} ({item.get('id')}): {'; '.join(fouten)}")
        goed.append(item)
    return goed


if __name__ == "__main__":
    import sys
    f = valideer()
    for regel in f:
        print(f"FOUT  {regel}")
    print(f"{len(bestanden())} bestand(en) in data/eigen/, {len(f)} fout(en).")
    sys.exit(1 if f else 0)
