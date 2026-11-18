"""Officiële bronnen voor de kaartlagen: downloaden, inlezen en omzetten naar records.

Alleen bronnen met een licentie die hergebruik in een ODbL-databank toelaat staan hier. Elke bron
staat ook in data/bronnen/register.json (zelfde id), met licentie en eigenaar. Bronnen waarvoor
nog toestemming nodig is, staan in docs/kaartdata.md (lijst "toestemming aan te vragen").

Een record is een dict:
  id        "<bron-id>:<sleutel in de bron>"
  bron      id van de bron
  naam, adres, soort, telefoon, emergency   (zoals in de kaartlagen; leeg = onbekend)
  lat, lon  WGS84; None als het adres niet geplaatst kon worden
  gesloten  True als de bron zegt dat de plek dicht is
  geplaatst "bron" (coördinaten van de bron), "adres" (via het adressenbestand), "straat" (midden van de straat)

Downloads komen in pipeline/out/officieel/<bron-id>/ en worden na zeven dagen opnieuw gehaald
(of meteen met --vernieuw). Alleen de standaardbibliotheek.
"""
import datetime as dt
import json
import os
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "pipeline" / "out" / "officieel"
USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"
MAX_LEEFTIJD_DAGEN = 7

# Bronnen per land en laag. Wordt hieronder gevuld met BRON(...).
BRONNEN = []
_LEZERS = {}
_DEKKING = {}


def bron(id, land, lagen, naam, eigenaar, licentie, url, volledig=False, dekking=None, kort=None):
    """Registreert een bron. 'volledig' = de bron bevat elke plek van deze soort in haar
    dekkingsgebied; dan meldt de pijplijn ook OSM-punten die niet in de bron staan.
    'dekking' = functie (lon, lat) -> bool voor het gebied (None = het hele land)."""
    def registreer(lezer):
        BRONNEN.append({"id": id, "land": land, "lagen": lagen, "naam": naam, "eigenaar": eigenaar,
                        "licentie": licentie, "url": url, "volledig": volledig, "kort": kort or eigenaar.split(" (")[0].split(",")[0]})
        _LEZERS[id] = lezer
        if dekking:
            _DEKKING[id] = dekking
        return lezer
    return registreer


def bronnen(land, laag):
    return [b for b in BRONNEN if b["land"] == land.upper() and laag in b["lagen"]]


def dekt(bron_id, punt):
    """Ligt punt (lon, lat) in het dekkingsgebied van de bron?"""
    f = _DEKKING.get(bron_id)
    return True if f is None else f(punt[0], punt[1])


def download(bron_id, url, bestandsnaam, vernieuw=False, data=None, koppen=None):
    """Haalt een bestand op (met cache). Geeft het lokale pad."""
    map_ = CACHE / bron_id
    map_.mkdir(parents=True, exist_ok=True)
    pad = map_ / bestandsnaam
    if pad.exists() and not vernieuw and time.time() - pad.stat().st_mtime < MAX_LEEFTIJD_DAGEN * 86400:
        return pad
    verzoek = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT, **(koppen or {})})
    laatste = None
    for poging in range(4):
        try:
            with urllib.request.urlopen(verzoek, timeout=300) as r, open(str(pad) + ".deel", "wb") as f:
                while True:
                    blok = r.read(1 << 20)
                    if not blok:
                        break
                    f.write(blok)
            os.replace(str(pad) + ".deel", pad)
            return pad
        except Exception as e:  # noqa: BLE001 - netwerkfouten van allerlei soort
            laatste = e
            time.sleep(5 * (poging + 1))
    if pad.exists():
        print(f"  {bron_id}: download mislukt ({laatste}); oudere kopie gebruikt", flush=True)
        return pad
    raise RuntimeError(f"{bron_id}: download van {url} mislukt: {laatste}")


def haal(b, vernieuw=False):
    """(records, info) voor een bron. info komt in meta.json onder 'bronnen'."""
    records, datum = _LEZERS[b["id"]](b, vernieuw)
    # De app herkent punten aan hun id: een sleutel die ontbreekt of twee keer voorkomt, krijgt een volgnummer.
    gezien = {}
    for r in records:
        if r["id"].endswith(":None") or r["id"].endswith(":"):
            r["id"] = r["id"].rsplit(":", 1)[0] + ":zonder-sleutel"
        n = gezien.get(r["id"], 0) + 1
        gezien[r["id"]] = n
        if n > 1:
            r["id"] = f"{r['id']}-{n}"
    for r in records:
        r["bron"] = b["id"]
        if b["volledig"]:
            r["_volledig"] = True
    info = {"naam": b["naam"], "kort": b["kort"], "eigenaar": b["eigenaar"], "licentie": b["licentie"], "url": b["url"],
            "datum": datum or dt.date.today().isoformat(), "opgehaald": dt.date.today().isoformat()}
    return records, info


def adres(straat=None, nummer=None, postcode=None, gemeente=None):
    eerste = " ".join(str(x).strip() for x in (straat, nummer) if x and str(x).strip())
    tweede = " ".join(str(x).strip() for x in (postcode, gemeente) if x and str(x).strip())
    return ", ".join(x for x in (eerste, tweede) if x) or None


def lees_json(pad):
    with open(pad, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- hulpfuncties

def straat_en_nummer(tekst):
    """("Boulevard Anspach", "21") uit "Boulevard Anspach, 21", "Rue X 12" of "12 rue X"."""
    import re
    t = str(tekst or "").strip()
    m = re.match(r"^(.*?)[,\s]+(\d+\s*[a-zA-Z]?)(?:[-/]\d+)?(?:\s+(?:bus|bte|boîte)\s*\S+)?$", t)
    if m and m.group(1).strip():
        return m.group(1).strip(" ,"), m.group(2).replace(" ", "")
    m = re.match(r"^(\d+\s*[a-zA-Z]?)[,\s]+(.+)$", t)
    if m:
        return m.group(2).strip(" ,"), m.group(1).replace(" ", "")
    return t or None, None


def ods(bron_id, domein, dataset, vernieuw):
    """Export (GeoJSON) en metadata van een Opendatasoft-portaal (opendata.brussels.be, odwb.be, data.stad.gent).
    Geeft (features, datum van de laatste wijziging)."""
    basis = f"https://{domein}/api/explore/v2.1/catalog/datasets/{dataset}"
    pad = download(bron_id, f"{basis}/exports/geojson", "data.geojson", vernieuw)
    datum = None
    try:
        meta = lees_json(download(bron_id, basis, "meta.json", vernieuw))
        datum = (meta.get("metas", {}).get("default", {}).get("modified") or "")[:10] or None
    except Exception:  # noqa: BLE001 - metadata is mooi meegenomen, niet nodig
        pass
    return lees_json(pad)["features"], datum


def punt_van_feature(f):
    g = f.get("geometry") or {}
    if g.get("type") == "Point" and g.get("coordinates"):
        lon, lat = g["coordinates"][:2]
        return float(lat), float(lon)
    return None, None


def record(bron_id, sleutel, naam=None, adres=None, lat=None, lon=None, soort=None, plaatsen=None, **extra):
    """Een record. 'plaatsen' = (straat, nummer, postcode, gemeente): het punt komt uit het adressenbestand
    (BeST) in plaats van uit de bron, bv. als de coördinaten van de bron uit Google Maps komen."""
    r = {"id": f"{bron_id}:{sleutel}", "naam": naam, "adres": adres, "lat": lat, "lon": lon, "soort": soort,
         "geplaatst": "bron" if lat is not None else None}
    if plaatsen:
        r["_plaatsen"] = plaatsen
        if lat is None:
            r["geplaatst"] = None
    r.update({k: v for k, v in extra.items() if v not in (None, "")})
    return r


def _gewest(code):
    def binnen(lon, lat):
        import adressen
        return adressen.geocoder().gewest(lon, lat) == code
    return binnen


# ---------------------------------------------------------------- België: ziekenhuizen

@bron("be-vl-zorg-poi", "BE", ["ziekenhuizen"], "Departement Zorg: zorgvoorzieningen (POI-service)",
      "Departement Zorg (Vlaamse overheid)", "Modellicentie gratis hergebruik v1.0, 'Bron: VAZG'",
      "https://www.vlaanderen.be/datavindplaats/catalogus/zorgvoorzieningen-erkend-door-het-agentschap-opgroeien-via-poi-service",
      volledig=True, dekking=_gewest("BE-VLG"))
def _vl_zorg(b, vernieuw):
    url = ("https://geo.api.vlaanderen.be/POI/ogc/features/collections/POI/items?f=application%2Fjson&limit=10000"
           "&filter=PRODUCT=%27GezondheidszorgEnWoonzorg%27")
    fs = lees_json(download(b["id"], url, "poi_zorg.geojson", vernieuw))["features"]
    if len(fs) >= 10000:
        raise RuntimeError("be-vl-zorg-poi: 10.000 records of meer; paginering nodig")
    vandaag = dt.date.today().isoformat()
    spoed = [(punt_van_feature(f), f["properties"].get("LINK2")) for f in fs if f["properties"].get("POITYPE_NAAM") == "Spoed"]
    soorten = {"AlgemeenZiekenhuis": "ziekenhuis", "PsychiatrischZiekenhuis": "psychiatrisch ziekenhuis"}
    uit, datum = [], None
    for f in fs:
        p = f["properties"]
        datum = max(datum or "", (p.get("UPDATED") or "")[:10]) or None
        if p.get("POITYPE_NAAM") not in soorten:
            continue
        lat, lon = punt_van_feature(f)
        if lat is None:
            continue
        # NAAM is de campus, ALTNAAM de organisatie. Alleen bij een algemene campusnaam ("Campus Glorieux")
        # komt de organisatie ervoor, en alleen als die kort is.
        naam = (p.get("NAAM") or p.get("ALTNAAM") or "").strip()
        org = (p.get("ALTNAAM") or "").strip()
        if naam.lower().startswith("campus") and org and len(org) <= 45 and org.lower() not in naam.lower():
            naam = f"{org}, {naam}"
        uit.append(record(b["id"], p["POID"], naam=naam,
                          adres=adres(p.get("STRAAT"), p.get("HUISNUMMER"), p.get("POSTCODE"), p.get("GEMEENTE")),
                          lat=lat, lon=lon, soort=soorten[p["POITYPE_NAAM"]],
                          _link=p.get("LINK2"), _algemeen=p["POITYPE_NAAM"] == "AlgemeenZiekenhuis",
                          gesloten=bool(p.get("EINDDATUM") and p["EINDDATUM"][:10] <= vandaag)))
    # Een spoeddienst is een apart record bij de campus. Ze hoort bij het dichtstbijzijnde algemene
    # ziekenhuis binnen 300 m, bij voorkeur van dezelfde organisatie (zelfde detailfiche). Een
    # psychiatrisch ziekenhuis op dezelfde site krijgt geen spoed.
    import overpass as op
    for (slat, slon), link in spoed:
        if slat is None:
            continue
        kandidaten = [(r["_link"] != link, op.haversine(slat, slon, r["lat"], r["lon"]), i)
                      for i, r in enumerate(uit) if r["_algemeen"]]
        kandidaten = [k for k in kandidaten if k[1] <= 300]
        if kandidaten:
            uit[min(kandidaten)[2]]["emergency"] = "ja"
    for r in uit:
        r.pop("_link", None)
        r.pop("_algemeen", None)
    return uit, datum


# ---------------------------------------------------------------- België: politie

@bron("be-bxl-stad-politiekantoren", "BE", ["politie"], "Stad Brussel: politiekantoren",
      "Stad Brussel (open data)", "CC BY 4.0",
      "https://opendata.brussels.be/explore/dataset/bruxelles_bureaux_de_police/")
def _bxl_politie(b, vernieuw):
    fs, datum = ods(b["id"], "opendata.brussels.be", "bruxelles_bureaux_de_police", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        straat, nummer = straat_en_nummer(p.get("address_nl") or p.get("address_fr"))
        # De coördinaten komen volgens de metadata uit Google Maps: we plaatsen zelf op het adres.
        uit.append(record(b["id"], p.get("id"), naam=p.get("src_name_nl") or p.get("src_name_fr"),
                          adres=adres(straat, nummer, p.get("postalcode"), p.get("municipality_nl")),
                          soort="politie", plaatsen=(straat, nummer, p.get("postalcode"), p.get("municipality_nl"))))
    return uit, datum


# ---------------------------------------------------------------- België: drinkwater

@bron("be-bxl-stad-drinkwater", "BE", ["drinkwater"], "Stad Brussel: drinkwaterfonteinen",
      "Stad Brussel (open data)", "CC0 1.0",
      "https://opendata.brussels.be/explore/dataset/fontaines-d-eau-potable-gerees-par-la-ville-de-bruxelles/")
def _bxl_water(b, vernieuw):
    fs, datum = ods(b["id"], "opendata.brussels.be", "fontaines-d-eau-potable-gerees-par-la-ville-de-bruxelles", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        actief = (p.get("status_nl") or "").lower() in ("actief", "")
        uit.append(record(b["id"], p.get("id_opendata"), naam=p.get("name_nl") or p.get("name_fr"),
                          adres=p.get("location_nl") or p.get("address_nl"), lat=lat, lon=lon, soort="drinkwaterpunt",
                          toegang=p.get("access_type_nl"), gesloten=not actief))
    return uit, datum


@bron("be-bru-vivaqua-drinkwater", "BE", ["drinkwater"], "Vivaqua: drinkwatertappunten beheerd door het gewest",
      "Vivaqua, via opendata.brussels.be", "CC BY 4.0",
      "https://opendata.brussels.be/explore/dataset/bornes-d-eau-potable-gerees-par-la-region-drinkwatertappunten-beheerd-door-het-gewest-vivaqua/")
def _vivaqua(b, vernieuw):
    fs, datum = ods(b["id"], "opendata.brussels.be",
                    "bornes-d-eau-potable-gerees-par-la-region-drinkwatertappunten-beheerd-door-het-gewest-vivaqua", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        uit.append(record(b["id"], p.get("id_vivaqua") or p.get("ref"), naam=None,
                          adres=", ".join(x for x in (p.get("statistical_sector_nl"), p.get("municipality_nl")) if x) or None,
                          lat=lat, lon=lon, soort="drinkwaterpunt"))
    return uit, datum


@bron("be-nmbs-drinkwater", "BE", ["drinkwater"], "NMBS: gratis drinkwatertappunten in stations (Brussel)",
      "NMBS, via opendata.brussels.be", "CC BY 4.0",
      "https://opendata.brussels.be/explore/dataset/bornes-eau-potable-gratuite-des-gares-sncb-gratis-drinkwatertappunten-van-nmbs-stations/")
def _nmbs(b, vernieuw):
    fs, datum = ods(b["id"], "opendata.brussels.be",
                    "bornes-eau-potable-gratuite-des-gares-sncb-gratis-drinkwatertappunten-van-nmbs-stations", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        uit.append(record(b["id"], p.get("taf_tap_code"), naam=f"Station {p.get('name_nl') or p.get('name_fr')}",
                          adres=p.get("location_nl"), lat=lat, lon=lon, soort="drinkwaterpunt", binnen="ja"))
    return uit, datum


@bron("be-gent-drinkwaterplekken", "BE", ["drinkwater"], "Stad Gent: drinkwaterplekken",
      "Stad Gent (open data)", "Modellicentie gratis hergebruik",
      "https://data.stad.gent/explore/dataset/drinkwaterplekken-gent/")
def _gent(b, vernieuw):
    fs, datum = ods(b["id"], "data.stad.gent", "drinkwaterplekken-gent", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        if str(p.get("drinkwater", "")).upper() != "JA":
            continue
        lat, lon = punt_van_feature(f)
        uit.append(record(b["id"], p.get("crmid") or p.get("objectid_1"), naam=p.get("naam"),
                          adres=adres(p.get("straatnaam"), p.get("huisnummer"), p.get("postcode"), p.get("gemeente")),
                          lat=lat, lon=lon, soort="drinkwater binnen", binnen="ja", openingsuren=p.get("openuren")))
    return uit, datum


@bron("be-tournai-fontaines", "BE", ["drinkwater"], "Ville de Tournai: fontaines à eau potable",
      "Ville de Tournai, via ODWB", "CC BY (versie niet vermeld)",
      "https://www.odwb.be/explore/dataset/tournai-fontaines-a-eau-potable/")
def _tournai(b, vernieuw):
    fs, datum = ods(b["id"], "www.odwb.be", "tournai-fontaines-a-eau-potable", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        uit.append(record(b["id"], p.get("objectid"), naam=None, adres=f"{p.get('emplac')}, Tournai" if p.get("emplac") else None,
                          lat=lat, lon=lon, soort="drinkwaterpunt"))
    return uit, datum


@bron("be-huy-eau-potable", "BE", ["drinkwater"], "Ville de Huy: points d'eau potable",
      "Ville de Huy, via ODWB", "CC BY (versie niet vermeld)", "https://www.odwb.be/explore/dataset/points-eau-potable0/")
def _huy(b, vernieuw):
    fs, datum = ods(b["id"], "www.odwb.be", "points-eau-potable0", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        if lat is None and p.get("latitude"):
            lat, lon = float(p["latitude"]), float(p["longitude"])
        nummer = str(int(float(p["numero"]))) if p.get("numero") else None
        postcode = str(int(float(p["code_postal"]))) if p.get("code_postal") else None
        uit.append(record(b["id"], p.get("id"), naam=p.get("nom"),
                          adres=adres(p.get("rue"), nummer, postcode, p.get("commune")), lat=lat, lon=lon,
                          soort="drinkwaterpunt", toegang=p.get("precisions_sur_l_emplacement")))
    return uit, datum


# ---------------------------------------------------------------- België: AED

@bron("be-bxl-stad-aed", "BE", ["aed"], "Stad Brussel: defibrillatoren geplaatst door de stad",
      "Stad Brussel (open data)", "CC0 1.0",
      "https://opendata.brussels.be/explore/dataset/defibrillateurs-installes-par-la-ville-de-bruxelles/")
def _bxl_aed(b, vernieuw):
    fs, datum = ods(b["id"], "opendata.brussels.be", "defibrillateurs-installes-par-la-ville-de-bruxelles", vernieuw)
    uit, gezien = [], set()
    for f in fs:
        p = f["properties"]
        # De coördinaten in deze dataset zijn onbetrouwbaar (tot vijftien toestellen op verschillende adressen
        # delen hetzelfde punt): we plaatsen op het adres, en alleen als het huisnummer gevonden wordt.
        eerste = str(p.get("adresse") or "").split("/")[0].strip()
        straat, nummer = straat_en_nummer(eerste)
        gemeente = p.get("gemeente") or p.get("commune")
        naam = (p.get("naam_van_het_gebouw") or "").strip()
        naam = naam.title() if naam.isupper() else naam
        sleutel = (naam.lower(), eerste.lower())
        if sleutel in gezien:  # meerdere toestellen in hetzelfde gebouw: één punt
            continue
        gezien.add(sleutel)
        uit.append(record(b["id"], p.get("registratienummer"), naam=naam or None,
                          adres=adres(straat, nummer, p.get("code_postal"), gemeente), soort="AED",
                          plaatsen=(straat, nummer, p.get("code_postal"), gemeente), _precisie="adres"))
    return uit, datum


@bron("be-verviers-aed", "BE", ["aed"], "Ville de Verviers: défibrillateurs", "Ville de Verviers, via ODWB",
      "CC BY (versie niet vermeld)", "https://www.odwb.be/explore/dataset/defibrillateurs-verviers/")
def _verviers(b, vernieuw):
    fs, datum = ods(b["id"], "www.odwb.be", "defibrillateurs-verviers", vernieuw)
    uit = []
    for i, f in enumerate(fs):
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        naam = (p.get("nom") or "").replace("Défibrillateur ", "").strip() or None
        uit.append(record(b["id"], p.get("contentlin", "").rstrip("/").split("/")[-1] or i, naam=naam,
                          adres=p.get("adresse"), lat=lat, lon=lon, soort="AED"))
    return uit, datum


@bron("be-villers-aed", "BE", ["aed"], "Villers-la-Ville: défibrillateurs", "Commune de Villers-la-Ville, via ODWB",
      "CC BY (versie niet vermeld)", "https://www.odwb.be/explore/dataset/defibrillateurs-vlv-schema-based/")
def _villers(b, vernieuw):
    fs, datum = ods(b["id"], "www.odwb.be", "defibrillateurs-vlv-schema-based", vernieuw)
    uit = []
    for f in fs:
        p = f["properties"]
        lat, lon = punt_van_feature(f)
        if lat is None and p.get("coordinates"):
            lat, lon = (float(x) for x in str(p["coordinates"]).split(","))
        nummer = str(int(p["house_number"])) if p.get("house_number") else None
        uit.append(record(b["id"], int(p["id"]) if p.get("id") is not None else p.get("name"),
                          naam=(p.get("name") or "").replace("DEA ", "").strip() or None,
                          adres=adres(p.get("street_name"), nummer, None, p.get("municipality")),
                          lat=lat, lon=lon, soort="AED", binnen=p.get("indoor")))
    return uit, datum
