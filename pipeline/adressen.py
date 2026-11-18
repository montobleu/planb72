"""Adressen omzetten naar coördinaten met het officiële adressenbestand van België (BeST, BOSA).

Bron: BOSA, "BeST Address / openaddress-be", https://opendata.bosa.be/, CC BY 4.0, wekelijks bijgewerkt.
Drie zips (Vlaanderen, Brussel, Wallonië), samen ongeveer 230 MB, met per adres de straatnaam in het
Nederlands, Frans en Duits, het huisnummer, de postcode, de gemeente en de coördinaten (EPSG:4326).

Alles gebeurt offline en reproduceerbaar: geen geocodeerdienst per adres. Het bestand wordt één keer
gelezen (ongeveer een minuut); alleen de straten die we zoeken blijven in het geheugen.

Plaatsing, van best naar minder goed:
  "adres"  straat + huisnummer gevonden (eerst met postcode, anders met gemeente)
  "straat" straat gevonden, huisnummer niet: het midden van de bekende huisnummers van die straat
De pijplijn meldt elk adres dat niet geplaatst kon worden in de verschillenlijst.

Daarnaast: per vak van ongeveer 2 km het gewest (BE-VLG, BE-BRU, BE-WAL), voor het dekkingsgebied
van een gewestelijke bron.
"""
import csv
import io
import json
import re
import zipfile
from pathlib import Path

import naam as nm
import officieel

BRON_ID = "be-bosa-best-adressen"
ZIPS = ["openaddress-bevlg.zip", "openaddress-bebru.zip", "openaddress-bewal.zip"]
URL = "https://opendata.bosa.be/download/best/"
VAK = 50  # 1/50 graad, ongeveer 1,4 km breed en 2,2 km hoog
GEMVAK = 400  # 1/400 graad, ongeveer 175 m breed en 280 m hoog: raster van de gemeenten


def _gemeente(tekst):
    return nm.basis(re.sub(r"\(.*?\)", "", str(tekst or "")))


def _varianten(straat):
    """De straatnaam zoals ze is, en zonder toevoeging tussen haakjes ("Oude Reningeweg(Oost)" -> "Oude Reningeweg")."""
    uit = [nm.straat(straat)]
    kort = nm.straat(re.sub(r"\(.*?\)", " ", str(straat or "")))
    if kort and kort not in uit:
        uit.append(kort)
    return uit


def _nummer(tekst):
    m = re.match(r"\s*(\d+)\s*([a-zA-Z]?)", str(tekst or ""))
    return (m.group(1), m.group(2).lower()) if m else (None, "")


class Geocoder:
    def __init__(self, vernieuw=False):
        self.vernieuw = vernieuw
        self.nodig = set()      # (postcode of gemeente, straat)
        self.huis = {}          # (sleutel, straat, nummer, letter) -> (lat, lon)
        self.straten = {}       # (sleutel, straat) -> [som lat, som lon, n]
        self.gewesten = None    # (vx, vy) -> gewestcode
        self.gemeenten = None   # (vx, vy) -> NIS-code van de gemeente (raster GEMVAK)
        self.gemeentenamen = {} # NIS-code -> {"nl", "fr", "de", "adressen"}
        self.datum = None

    def vraag(self, straat, postcode=None, gemeente=None):
        for s in _varianten(straat):
            if postcode:
                self.nodig.add((str(postcode), s))
            if gemeente:
                self.nodig.add((_gemeente(gemeente), s))

    def _bestanden(self):
        return [officieel.download(BRON_ID, URL + z, z, vernieuw=self.vernieuw) for z in ZIPS]

    def lees(self):
        """Leest de adressenbestanden één keer: de gevraagde straten en het gewestraster."""
        gewestpad = officieel.CACHE / BRON_ID / "gewesten.json"
        tellingen = {}
        gemtel = {}
        namen = {}
        bestanden = self._bestanden()
        self.datum = max(p.stat().st_mtime for p in bestanden)
        for pad in bestanden:
            with zipfile.ZipFile(pad) as z:
                naam = next(n for n in z.namelist() if n.endswith(".csv"))
                with z.open(naam) as ruw:
                    for rij in csv.DictReader(io.TextIOWrapper(ruw, encoding="utf-8", newline="")):
                        if rij["status"] != "current":
                            continue
                        try:
                            lat, lon = float(rij["EPSG:4326_lat"]), float(rij["EPSG:4326_lon"])
                        except ValueError:
                            continue
                        vak = (int(lon * VAK), int(lat * VAK))
                        t = tellingen.setdefault(vak, {})
                        t[rij["region_code"]] = t.get(rij["region_code"], 0) + 1
                        nis = rij["municipality_id"]
                        g = gemtel.setdefault((int(lon * GEMVAK), int(lat * GEMVAK)), {})
                        g[nis] = g.get(nis, 0) + 1
                        n = namen.get(nis)
                        if n is None:
                            n = namen[nis] = {"nl": rij["municipality_name_nl"], "fr": rij["municipality_name_fr"],
                                              "de": rij["municipality_name_de"], "gewest": rij["region_code"], "adressen": 0}
                        n["adressen"] += 1
                        sleutels = [rij["postcode"]] + [_gemeente(rij[k]) for k in (
                            "municipality_name_nl", "municipality_name_fr", "municipality_name_de",
                            "postname_nl", "postname_fr") if rij[k]]
                        nummer, letter = _nummer(rij["house_number"])
                        for k in ("streetname_nl", "streetname_fr", "streetname_de"):
                            if not rij[k]:
                                continue
                            s = nm.straat(rij[k])
                            for sl in sleutels:
                                if (sl, s) not in self.nodig:
                                    continue
                                if nummer:
                                    self.huis.setdefault((sl, s, nummer, letter), (lat, lon))
                                    self.huis.setdefault((sl, s, nummer, ""), (lat, lon))
                                acc = self.straten.setdefault((sl, s), [0.0, 0.0, 0])
                                acc[0] += lat
                                acc[1] += lon
                                acc[2] += 1
        self.gewesten = {k: max(v, key=v.get) for k, v in tellingen.items()}
        with open(gewestpad, "w", encoding="utf-8") as f:
            json.dump({f"{k[0]},{k[1]}": v for k, v in self.gewesten.items()}, f)
        self.gemeenten = {k: max(v, key=v.get) for k, v in gemtel.items()}
        self.gemeentenamen = namen
        with open(officieel.CACHE / BRON_ID / "gemeenten.json", "w", encoding="utf-8") as f:
            json.dump({"namen": namen, "raster": {f"{k[0]},{k[1]}": v for k, v in self.gemeenten.items()}}, f)

    def plaats(self, straat, nummer=None, postcode=None, gemeente=None):
        """(lat, lon, "adres"|"straat") of None."""
        n, letter = _nummer(nummer)
        sleutels = [x for x in (str(postcode) if postcode else None, _gemeente(gemeente) if gemeente else None) if x]
        varianten = _varianten(straat)
        if n:
            for s in varianten:
                for sl in sleutels:
                    for l in (letter, ""):
                        if (sl, s, n, l) in self.huis:
                            lat, lon = self.huis[(sl, s, n, l)]
                            return lat, lon, "adres"
        for s in varianten:
            for sl in sleutels:
                acc = self.straten.get((sl, s))
                if acc and acc[2]:
                    return acc[0] / acc[2], acc[1] / acc[2], "straat"
        return None

    def gewest(self, lon, lat):
        """Gewestcode van het vak (of een buurvak) waarin het punt ligt, of None."""
        if self.gewesten is None:
            pad = officieel.CACHE / BRON_ID / "gewesten.json"
            if not pad.exists():
                return None
            self.gewesten = {tuple(int(x) for x in k.split(",")): v for k, v in json.load(open(pad)).items()}
        vx, vy = int(lon * VAK), int(lat * VAK)
        for d in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
            g = self.gewesten.get((vx + d[0], vy + d[1]))
            if g:
                return g
        return None


    def _laad_gemeenten(self):
        if self.gemeenten is None:
            pad = officieel.CACHE / BRON_ID / "gemeenten.json"
            if not pad.exists():
                self.lees()
            else:
                d = json.load(open(pad, encoding="utf-8"))
                self.gemeentenamen = d["namen"]
                self.gemeenten = {tuple(int(x) for x in k.split(",")): v for k, v in d["raster"].items()}

    def gemeente(self, lon, lat):
        """NIS-code van de gemeente waarin het punt ligt (het dichtstbijzijnde vak met adressen, tot ongeveer 1 km), of None."""
        self._laad_gemeenten()
        vx, vy = int(lon * GEMVAK), int(lat * GEMVAK)
        for straal in range(0, 5):
            gevonden = {}
            for dx in range(-straal, straal + 1):
                for dy in range(-straal, straal + 1):
                    if max(abs(dx), abs(dy)) != straal:
                        continue
                    g = self.gemeenten.get((vx + dx, vy + dy))
                    if g:
                        gevonden[g] = gevonden.get(g, 0) + 1
            if gevonden:
                return max(gevonden, key=gevonden.get)
        return None


# Provincie uit de NIS-code van de gemeente (eerste cijfers).
PROVINCIES = [("21", "Brussels Hoofdstedelijk Gewest"), ("23", "Vlaams-Brabant"), ("24", "Vlaams-Brabant"),
              ("25", "Waals-Brabant"), ("1", "Antwerpen"), ("3", "West-Vlaanderen"), ("4", "Oost-Vlaanderen"),
              ("5", "Henegouwen"), ("6", "Luik"), ("7", "Limburg"), ("8", "Luxemburg"), ("9", "Namen")]


def provincie(nis):
    for prefix, naam in PROVINCIES:
        if str(nis or "").startswith(prefix):
            return naam
    return "onbekend"


GEOCODER = None


def geocoder(vernieuw=False):
    global GEOCODER
    if GEOCODER is None:
        GEOCODER = Geocoder(vernieuw)
    return GEOCODER
