#!/usr/bin/env python3
"""Inhoudscontrole voor pull requests.

1. Controleert of elke scenariokaart een bron heeft die in het bronnenregister staat,
   en of een kaart met status 'nagekeken' ook een nalezer vermeldt.
2. Controleert of elk noodnummer en kanaal in data/landen/*.json een bron heeft en of
   elke URL in de landinfo in het bronnenregister staat.
3. Controleert vertalingen (site/src/content/<map>/<taal>/*.md en site/src/i18n/land/*.json):
   getallen, telefoonnummers, frequenties en eenheden moeten gelijk zijn aan het
   Nederlandse origineel, en elke vertaling vermeldt haar nazichtstatus.
4. Bepaalt uit de gewijzigde bestanden hoeveel goedkeuringen nodig zijn
   (2 voor inhoud die levens raakt, anders 1) en welke labels de PR krijgt.

Gebruik:
  python3 pipeline/controleer_inhoud.py                       # alleen inhoud controleren
  python3 pipeline/controleer_inhoud.py --gewijzigd a.md b.json --uitvoer res.json
Foutcode 1 bij een inhoudelijke fout. Alleen de standaardbibliotheek.
"""
import argparse
import glob
from collections import Counter
import json
import os
import re
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Paden die twee goedkeuringen vragen, met het label dat de PR krijgt.
KRITIEK = [
    (r"^site/src/content/scenarios/", "inhoud: handelingsrichtlijnen"),
    (r"^site/src/content/eerstehulp/", "inhoud: medisch"),
    (r"^site/src/content/gidsen/", "inhoud: gidsen"),
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


def url_sleutel(url):
    url = url.split("#", 1)[0].strip()
    return url[:-1] if url.endswith("/") else url


def urls_in(obj):
    """Alle http(s)-adressen in een JSON-structuur."""
    if isinstance(obj, dict):
        for v in obj.values():
            yield from urls_in(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from urls_in(v)
    elif isinstance(obj, str) and re.match(r"https?://", obj):
        yield obj


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
    bronnen = register if isinstance(register, list) else register.get("bronnen", [])
    bekende = {domein(b["url"]) for b in bronnen}
    register_urls = {url_sleutel(b["url"]) for b in bronnen}

    paden = []
    for map_ in ("scenarios", "gidsen", "eerstehulp"):
        paden += glob.glob(os.path.join(ROOT, f"site/src/content/{map_}/*.md"))
        for taal in VERTAALTALEN:
            paden += glob.glob(os.path.join(ROOT, f"site/src/content/{map_}/{taal}/*.md"))
    for pad in sorted(paden):
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
        # Ook de bronnen in de tekst ("Bron: [naam](url)") moeten in het register staan.
        tekst = open(pad, encoding="utf-8").read()
        for url in re.findall(r"\]\((https?://[^)\s]+)\)", tekst):
            d = domein(url)
            if d not in bekende:
                fouten.append(f"{naam}: bron {d} in de tekst staat niet in het bronnenregister")
        # Doseringen horen niet in PlanB72.
        for m in re.finditer(r"\b\d+([.,]\d+)?\s?(mg|µg|mcg|microgram|milligram)\b", tekst, re.I):
            fouten.append(f"{naam}: mogelijke dosering '{m.group(0)}' (doseringen zijn niet toegelaten)")
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
        for blok in ("nucleair", "schuilen", "voorraad"):
            if not land.get(blok, {}).get("bron") and not land.get(blok, {}).get("advies_bron"):
                fouten.append(f"{naam}: blok {blok} zonder bron")
        # Elke URL in de landinfo staat als bron in het register.
        for url in sorted(set(urls_in(land))):
            if url_sleutel(url) not in register_urls:
                fouten.append(f"{naam}: {url} staat niet in het bronnenregister")
    fouten += controleer_vertalingen()
    return fouten


# ---------- Vertalingen: getallen en eenheden gelijk aan het origineel ----------

VERTAALTALEN = ("fr", "de", "en")
VERTAALSTATUS = ("machine", "na te lezen", "nagekeken")
# Velden in de frontmatter die geen lopende tekst zijn.
NIET_VERGELIJKEN = ("datum", "origineel_datum", "volgorde", "status", "vertaling", "vertaling_nagekeken_door",
                    "nagekeken_door", "module", "gevoelig")
# Eenheden als symbool na een getal. Woorden ("liter", "Stunden") vergelijken we niet.
EENHEDEN = ["km/h", "km/u", "km/std", "kWh", "mAh", "kHz", "MHz", "GHz", "mSv", "µSv", "mGy", "°C", "kW", "Wh", "Ah", "Sv", "Gy",
            "Bq", "dB", "km", "cm", "mm", "ml", "cl", "dl", "kg", "mg", "µg", "Hz", "%", "m", "g", "l", "L", "W", "V"]
EENHEID_RE = re.compile(r"(?<=\d)\s?(" + "|".join(re.escape(e) for e in EENHEDEN) + r")(?![\w/])")


def zonder_frontmatter_ruis(tekst):
    """Lopende tekst van een Markdown-bestand: frontmatter zonder bronnen en metadata, plus de tekst zelf."""
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", tekst, re.S)
    if not m:
        return tekst
    fm, body = m.group(1), m.group(2)
    behouden, in_bronnen = [], False
    for regel in fm.splitlines():
        sleutel = re.match(r"^([a-z_]+):", regel)
        if sleutel:
            in_bronnen = sleutel.group(1) == "bronnen"
            if in_bronnen or sleutel.group(1) in NIET_VERGELIJKEN:
                continue
        elif in_bronnen:
            continue
        behouden.append(regel)
    return "\n".join(behouden) + "\n" + body


def lopende_tekst(tekst):
    """Tekst zonder URL's en zonder bronregels: die verschillen per taal (Franse of Duitse bronpagina)."""
    tekst = zonder_frontmatter_ruis(tekst)
    regels = [r for r in tekst.splitlines() if not re.match(r"^\s*(Bron(nen)?|Sources?|Quellen?)\s*:", r)]
    tekst = "\n".join(regels)
    tekst = re.sub(r"\]\([^)]*\)", "]", tekst)          # doel van Markdown-links
    tekst = re.sub(r"https?://\S+|www\.\S+", " ", tekst)
    tekst = re.sub(r"\b[\w.-]+\.(be|nl|de|fr|eu|org|com|net|int|gov|info|lu)\b(/\S*)?", " ", tekst)  # domeinnamen in de tekst
    return tekst


def getallen(tekst, taal):
    """Getallen in een vaste vorm, ongeacht de schrijfwijze van de taal.

    - uren: 13u30, 13h30, 13:30, 13.30 uur/Uhr -> 13:30; een vol uur (08:00, 8h00) telt als 8
    - duizendtallen: 1.500 (nl, de, fr), 1,500 (en), 1 500 (fr) -> 1500
    - decimalen: 27,065 (nl, de, fr) en 27.065 (en) -> 27.065
    - telefoonnummers met spaties: 070 245 245 -> 070245245 (in elke taal op dezelfde manier)
    """
    t = tekst
    t = re.sub(r"\b(\d{1,2})\s?(?:u|h|:)\s?(\d{2})\b", r" \1:\2 ", t)
    if taal != "en":
        # In het Nederlands, Duits en Frans is 10.30 een uur (decimalen krijgen een komma).
        t = re.sub(r"\b([01]?\d|2[0-3])\.([0-5]\d)\b(?!\.\d)", r" \1:\2 ", t)
    t = re.sub(r"\b(\d{1,2})\.(\d{2})\s?(?=uur\b|Uhr\b)", r" \1:\2 ", t)
    # Groepen van drie cijfers na een spatie horen bij het vorige getal.
    vorig = None
    while vorig != t:
        vorig = t
        t = re.sub(r"(\d)[ \u00a0\u202f](\d{3})(?!\d)", r"\1\2", t)
    uit = Counter()
    for m in re.finditer(r"\d+:\d{2}|\d+(?:[.,]\d+)*", t):
        g = m.group(0)
        if ":" in g:
            # Uren: 08:00 = 8 uur, 13:30 = 13u30.
            uur, minuut = g.split(":")
            uit[str(int(uur)) if minuut == "00" else f"{int(uur)}:{minuut}"] += 1
            continue
        if taal == "en":
            g = re.sub(r",(?=\d{3}(?!\d))", "", g)
        else:
            g = re.sub(r"\.(?=\d{3}(?!\d))", "", g).replace(",", ".")
        uit[g] += 1
    return uit


GELIJKE_EENHEDEN = {"km/u": "km/h", "km/std": "km/h", "L": "l"}


def eenheden(tekst):
    return Counter(GELIJKE_EENHEDEN.get(e, e) for e in EENHEID_RE.findall(tekst))


def verschil(a, b):
    """Beschrijf wat in a staat en niet in b, en omgekeerd."""
    ontbreekt = sorted((a - b).elements())
    extra = sorted((b - a).elements())
    delen = []
    if ontbreekt:
        delen.append("ontbreekt " + ", ".join(ontbreekt))
    if extra:
        delen.append("extra " + ", ".join(extra))
    return "; ".join(delen)


def vergelijk(naam, origineel, vertaald, taal, fouten):
    o, v = lopende_tekst(origineel), lopende_tekst(vertaald)
    d = verschil(getallen(o, "nl"), getallen(v, taal))
    if d:
        fouten.append(f"{naam}: getallen verschillen van het origineel ({d})")
    d = verschil(eenheden(o), eenheden(v))
    if d:
        fouten.append(f"{naam}: eenheden verschillen van het origineel ({d})")


def controleer_vertalingen():
    fouten = []
    for map_ in ("scenarios", "gidsen", "eerstehulp"):
        for taal in VERTAALTALEN:
            for pad in sorted(glob.glob(os.path.join(ROOT, f"site/src/content/{map_}/{taal}/*.md"))):
                naam = os.path.relpath(pad, ROOT)
                bron = os.path.join(ROOT, f"site/src/content/{map_}", os.path.basename(pad))
                if not os.path.exists(bron):
                    fouten.append(f"{naam}: vertaling zonder Nederlands origineel")
                    continue
                v = lees_frontmatter(pad) or {}
                if v.get("vertaling") not in VERTAALSTATUS:
                    fouten.append(f"{naam}: 'vertaling' moet {', '.join(VERTAALSTATUS)} zijn")
                if v.get("vertaling") == "nagekeken" and not v.get("vertaling_nagekeken_door"):
                    fouten.append(f"{naam}: vertaling nagekeken zonder 'vertaling_nagekeken_door'")
                if not v.get("origineel_datum"):
                    fouten.append(f"{naam}: 'origineel_datum' ontbreekt")
                vergelijk(naam, open(bron, encoding="utf-8").read(), open(pad, encoding="utf-8").read(), taal, fouten)

    # Landinfo: site/src/i18n/land/<land>.json tegenover data/landen/<land>.json.
    for pad in sorted(glob.glob(os.path.join(ROOT, "site/src/i18n/land/*.json"))):
        naam = os.path.relpath(pad, ROOT)
        land = json.load(open(os.path.join(ROOT, "data/landen", os.path.basename(pad)), encoding="utf-8"))
        vertaald = json.load(open(pad, encoding="utf-8"))
        nummers = {n["nummer"]: n for n in land.get("noodnummers", [])}
        kanalen = {k["naam"]: k for k in land.get("kanalen", [])}
        for taal in VERTAALTALEN:
            t = vertaald.get(taal)
            if not t:
                continue
            paren = []
            for nummer, wat in t.get("noodnummers", {}).items():
                if nummer not in nummers:
                    fouten.append(f"{naam} ({taal}): noodnummer {nummer} bestaat niet in de landinfo")
                    continue
                paren.append((f"noodnummer {nummer}", nummers[nummer]["wat"], wat))
            for kanaal, velden in t.get("kanalen", {}).items():
                if kanaal not in kanalen:
                    fouten.append(f"{naam} ({taal}): kanaal {kanaal} bestaat niet in de landinfo")
                    continue
                for veld in ("naam", "soort", "wat", "voorbereiden"):
                    if veld in velden:
                        paren.append((f"kanaal {kanaal}, {veld}", kanalen[kanaal][veld], velden[veld]))
            for deel, velden in (("nucleair", ("kernboodschap", "opmerking", "coordinaten_status")), ("schuilen", ("advies",)),
                                 ("voorraad", ("water_bron", "water_status"))):
                for veld in velden:
                    if veld in t.get(deel, {}):
                        paren.append((f"{deel}.{veld}", land[deel][veld], t[deel][veld]))
            for wat, origineel, tekst in paren:
                vergelijk(f"{naam} ({taal}, {wat})", origineel, tekst, taal, fouten)
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
