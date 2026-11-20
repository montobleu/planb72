#!/usr/bin/env python3
"""Zet in vertaalde teksten de bron-URL's om naar de pagina in de taal van de vertaling.

Vertalers nemen de URL's van het Nederlandse origineel letterlijk over. Dit script vervangt
ze daarna door de Franse, Duitse of Engelse pagina van dezelfde bron, volgens
data/bronnen/talen.json (opgebouwd door te zoeken naar hreflang-links en taalkeuzes op de
bronpagina's, elke URL nagekeken op HTTP 200). Bestaat er geen versie in die taal, dan blijft
de oorspronkelijke URL staan.

Gebruik:
  python3 pipeline/bronnen_vertalen.py            # alle vertalingen bijwerken
  python3 pipeline/bronnen_vertalen.py --droog    # alleen tonen wat zou veranderen
Alleen de standaardbibliotheek.
"""
import argparse
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TALEN = ("fr", "de", "en")
URL = re.compile(r"https?://[^\s)\"'>]+")


def laad_kaart():
    data = json.load(open(os.path.join(ROOT, "data/bronnen/talen.json"), encoding="utf-8"))
    kaart = {}
    for nl, m in data["urls"].items():
        for sleutel in {nl, nl.rstrip("/"), nl + "/" if not nl.endswith("/") else nl}:
            kaart[sleutel] = m
        if m.get("nl_actueel"):
            kaart.setdefault(m["nl_actueel"], m)
    return kaart


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--droog", action="store_true", help="niets schrijven, alleen tonen")
    args = ap.parse_args()
    kaart = laad_kaart()
    totaal = 0
    for taal in TALEN:
        for pad in sorted(glob.glob(os.path.join(ROOT, f"site/src/content/*/{taal}/*.md"))):
            tekst = open(pad, encoding="utf-8").read()
            vervangen = 0

            def vervang(m):
                nonlocal vervangen
                url = m.group(0)
                staart = ""
                while url and url[-1] in ".,;:":
                    staart = url[-1] + staart
                    url = url[:-1]
                doel = (kaart.get(url) or {}).get(taal)
                if doel and doel != url:
                    vervangen += 1
                    return doel + staart
                return m.group(0)

            nieuw = URL.sub(vervang, tekst)
            if vervangen:
                totaal += vervangen
                print(f"{os.path.relpath(pad, ROOT)}: {vervangen} URL('s)")
                if not args.droog:
                    open(pad, "w", encoding="utf-8").write(nieuw)
    print(f"Samen {totaal} URL('s) {'te vervangen' if args.droog else 'vervangen'}.")


if __name__ == "__main__":
    main()
