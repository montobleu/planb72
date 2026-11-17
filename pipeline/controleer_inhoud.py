#!/usr/bin/env python3
"""Inhoudscontrole voor pull requests.

1. Controleert of elke scenariokaart een bron heeft die in het bronnenregister staat,
   en of een kaart met status 'nagekeken' ook een nalezer vermeldt.
2. Controleert of elk noodnummer en kanaal in data/landen/*.json een bron heeft.
3. Bepaalt uit de gewijzigde bestanden hoeveel goedkeuringen nodig zijn
   (2 voor inhoud die levens raakt, anders 1) en welke labels de PR krijgt.

Gebruik:
  python3 pipeline/controleer_inhoud.py                       # alleen inhoud controleren
  python3 pipeline/controleer_inhoud.py --gewijzigd a.md b.json --uitvoer res.json
Foutcode 1 bij een inhoudelijke fout. Alleen de standaardbibliotheek.
"""
import argparse
import glob
import json
import os
import re
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Paden die twee goedkeuringen vragen, met het label dat de PR krijgt.
KRITIEK = [
    (r"^site/src/content/scenarios/", "inhoud: handelingsrichtlijnen"),
    (r"^site/src/pages/app/eerste-hulp/", "inhoud: medisch"),
    (r"^site/src/pages/app/nucleair/", "inhoud: nucleair"),
    (r"^site/src/pages/app/schuilen/", "inhoud: schuilen"),
    (r"^data/landen/", "inhoud: landinfo"),
]
GEWOON = [
    (r"^data/bronnen/register\.json$", "bronnenregister"),
    (r"^site/src/i18n/", "vertaling"),
    (r"^(site|launcher|pipeline|\.github)/", "code"),
]


def domein(url):
    host = urlparse(url).hostname or ""
    return host[4:] if host.startswith("www.") else host


def lees_frontmatter(pad):
    tekst = open(pad, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---", tekst, re.S)
    if not m:
        return None
    velden, bronnen, huidige = {}, [], None
    for regel in m.group(1).splitlines():
        if re.match(r"^\s+- naam:", regel):
            huidige = {"naam": regel.split(":", 1)[1].strip().strip('"')}
            bronnen.append(huidige)
        elif re.match(r"^\s+url:", regel) and huidige is not None:
            huidige["url"] = regel.split(":", 1)[1].strip().strip('"')
        elif re.match(r"^[a-z_]+:", regel):
            sleutel, _, waarde = regel.partition(":")
            velden[sleutel] = waarde.strip().strip('"')
    velden["bronnen"] = bronnen
    return velden


def controleer():
    fouten = []
    register = json.load(open(os.path.join(ROOT, "data/bronnen/register.json"), encoding="utf-8"))
    bekende = {domein(b["url"]) for b in (register if isinstance(register, list) else register.get("bronnen", []))}

    for pad in sorted(glob.glob(os.path.join(ROOT, "site/src/content/scenarios/*.md"))):
        naam = os.path.relpath(pad, ROOT)
        v = lees_frontmatter(pad)
        if v is None:
            fouten.append(f"{naam}: geen frontmatter")
            continue
        if not v["bronnen"]:
            fouten.append(f"{naam}: geen bron vermeld")
        for b in v["bronnen"]:
            d = domein(b.get("url", ""))
            if d not in bekende:
                fouten.append(f"{naam}: bron {d or '(leeg)'} staat niet in het bronnenregister")
        if v.get("status") in ("nagekeken", "officieel") and not v.get("nagekeken_door"):
            fouten.append(f"{naam}: status {v['status']} zonder 'nagekeken_door'")

    for pad in sorted(glob.glob(os.path.join(ROOT, "data/landen/*.json"))):
        naam = os.path.relpath(pad, ROOT)
        land = json.load(open(pad, encoding="utf-8"))
        for n in land.get("noodnummers", []):
            if not n.get("bron"):
                fouten.append(f"{naam}: noodnummer {n.get('nummer')} zonder bron")
        for k in land.get("kanalen", []):
            if not k.get("bron"):
                fouten.append(f"{naam}: kanaal {k.get('naam')} zonder bron")
    return fouten


def beoordeel(gewijzigd):
    labels, kritiek = set(), False
    for pad in gewijzigd:
        for patroon, label in KRITIEK:
            if re.search(patroon, pad):
                labels.add(label)
                kritiek = True
        for patroon, label in GEWOON:
            if re.search(patroon, pad):
                labels.add(label)
    if kritiek:
        labels.add("twee nalezers")
    return {"goedkeuringen_nodig": 2 if kritiek else 1, "labels": sorted(labels)}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--gewijzigd", nargs="*", default=[], help="gewijzigde bestanden (relatief aan de repository)")
    ap.add_argument("--uitvoer", help="schrijf het oordeel als JSON naar dit bestand")
    args = ap.parse_args()

    fouten = controleer()
    oordeel = beoordeel(args.gewijzigd)
    oordeel["fouten"] = fouten
    if args.uitvoer:
        json.dump(oordeel, open(args.uitvoer, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    for f in fouten:
        print(f"FOUT  {f}")
    print(f"Goedkeuringen nodig: {oordeel['goedkeuringen_nodig']}; labels: {', '.join(oordeel['labels']) or '-'}")
    sys.exit(1 if fouten else 0)


if __name__ == "__main__":
    main()
