#!/usr/bin/env python3
"""Voegt voorgestelde bronnen (data/bronnen/nieuw-*.json) samen in het bronnenregister.

Ontdubbelt op URL (zonder fragment en slotschuine streep) en op id. Bestaande
regels in register.json gaan altijd voor. Verwijdert de nieuw-*.json-bestanden
alleen met --opruimen. Alleen de standaardbibliotheek.
"""
import argparse
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTER = os.path.join(ROOT, "data", "bronnen", "register.json")
VERPLICHT = ["id", "naam", "url"]
STANDAARD = {"soort": "pagina", "licentie": "Na te kijken", "toestemming": "na te zien", "route": "nazicht", "frequentie": "wekelijks", "gebruikt_in": ["gidsen"]}


def sleutel(url):
    url = url.split("#", 1)[0].strip()
    return url[:-1] if url.endswith("/") else url


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--opruimen", action="store_true", help="nieuw-*.json verwijderen na het samenvoegen")
    args = ap.parse_args()

    ruw = json.load(open(REGISTER, encoding="utf-8"))
    lijst = ruw if isinstance(ruw, list) else ruw["bronnen"]
    urls = {sleutel(b["url"]) for b in lijst}
    ids = {b["id"] for b in lijst}

    toegevoegd = 0
    bestanden = sorted(glob.glob(os.path.join(ROOT, "data", "bronnen", "nieuw-*.json")))
    for pad in bestanden:
        for b in json.load(open(pad, encoding="utf-8")):
            if any(not b.get(v) for v in VERPLICHT) or sleutel(b["url"]) in urls:
                continue
            item = {**STANDAARD, **b}
            basis = re.sub(r"[^a-z0-9-]+", "-", item["id"].lower()).strip("-")
            nieuw_id, n = basis, 2
            while nieuw_id in ids:
                nieuw_id, n = f"{basis}-{n}", n + 1
            item["id"] = nieuw_id
            lijst.append(item)
            urls.add(sleutel(item["url"]))
            ids.add(nieuw_id)
            toegevoegd += 1

    with open(REGISTER, "w", encoding="utf-8") as f:
        json.dump(ruw, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{toegevoegd} bronnen toegevoegd uit {len(bestanden)} bestand(en); register telt nu {len(lijst)} bronnen.")
    if args.opruimen:
        for pad in bestanden:
            os.remove(pad)


if __name__ == "__main__":
    main()
