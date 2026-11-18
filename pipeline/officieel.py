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
import re
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
            with urllib.request.urlopen(verzoek, timeout=120) as r, open(str(pad) + ".deel", "wb") as f:
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


# ---------------------------------------------------------------- Frankrijk: dierenartsen (SIRENE)

# Departementen van het Europese vasteland en Corsica (de overzeese vallen buiten de bbox van fr.json).
FR_DEPARTEMENTEN = [f"{i:02d}" for i in range(1, 96) if i != 20] + ["2A", "2B"]
# Juridische vorm 1000 = entrepreneur individuel (natuurlijke persoon).
FR_NATUURLIJK = "1000"


@bron("fr-sirene-veterinaires", "FR", ["dierenarts"], "INSEE SIRENE: vestigingen met NAF 75.00Z (activités vétérinaires)",
      "INSEE, via de API Recherche d'entreprises (DINUM)", "Licence Ouverte 2.0 (Etalab)",
      "https://recherche-entreprises.api.gouv.fr/docs/", kort="INSEE SIRENE")
def _sirene_vet(b, vernieuw):
    """Alle actieve vestigingen met NAF 75.00Z, per departement opgevraagd (de API geeft hoogstens 10.000
    resultaten per zoekopdracht en 25 per pagina). Vestigingen in 'diffusion partielle' (adres verborgen,
    meestal eenmanszaken) komen niet op de kaart. Ondernemingen van natuurlijke personen krijgen geen
    persoonsnaam op de kaart, alleen hun handelsnaam als die er is."""
    import urllib.parse
    basis = "https://recherche-entreprises.api.gouv.fr/search?"
    uit, datum, gezien = [], None, set()
    for dep in FR_DEPARTEMENTEN:
        pagina, pagina_s = 1, 1
        while pagina <= pagina_s:
            q = urllib.parse.urlencode({
                "activite_principale": "75.00Z", "departement": dep, "per_page": 25, "page": pagina,
                "minimal": "true", "include": "matching_etablissements", "limite_matching_etablissements": 100})
            pad = download(b["id"], basis + q, f"{dep}-{pagina}.json", vernieuw)
            time.sleep(0.0 if pad.stat().st_mtime < time.time() - 60 else 0.35)  # hoogstens ongeveer 3 per seconde
            d = lees_json(pad)
            pagina_s = d.get("total_pages") or 1
            for o in d.get("results", []):
                datum = max(datum or "", (o.get("date_mise_a_jour_insee") or "")[:10]) or None
                natuurlijk = o.get("nature_juridique") == FR_NATUURLIJK
                for e in o.get("matching_etablissements") or []:
                    if (e.get("etat_administratif") != "A" or e.get("activite_principale") != "75.00Z"
                            or e.get("statut_diffusion_etablissement") != "O" or not e.get("latitude")):
                        continue
                    if e["siret"] in gezien:
                        continue
                    gezien.add(e["siret"])
                    handelsnaam = e.get("nom_commercial") or next(iter(e.get("liste_enseignes") or []), None)
                    if handelsnaam:
                        naam = handelsnaam.title()
                    elif natuurlijk:
                        naam = None  # geen persoonsnaam op de kaart
                    else:
                        naam = (o.get("nom_complet") or "").title() or None
                    praktijk = "praktijk" if (handelsnaam or not natuurlijk) else "onzeker"
                    uit.append(record(b["id"], e["siret"], naam=naam, adres=(e.get("adresse") or "").title() or None,
                                      lat=float(e["latitude"]), lon=float(e["longitude"]), soort="vétérinaire",
                                      praktijk=praktijk))
            pagina += 1
    # Meerdere vestigingen op hetzelfde adres (bv. dierenartsen die elk een eigen onderneming hebben in
    # dezelfde kliniek) zijn op de kaart één plek: we houden de zekerste, met naam.
    beste = {}
    for r in uit:
        sleutel = r["adres"].lower() if r.get("adres") else r["id"]
        score = (r["praktijk"] == "praktijk", bool(r.get("naam")))
        if sleutel not in beste or score > beste[sleutel][0]:
            beste[sleutel] = (score, r)
    print(f"  SIRENE: {len(uit)} vestigingen, {len(uit) - len(beste)} samengevoegd op hetzelfde adres", flush=True)
    return [r for _, r in beste.values()], datum


# ---------------------------------------------------------------- België: dierenartsen (VKBO)

# "Achternaam, Voornaam" (ook "Van Hoof, Danny"): zo schrijft de KBO de naam van een natuurlijke persoon.
_PERSOONSNAAM = re.compile(r"^[^,]+,\s*[A-ZÀ-ÝŠŽ][\w'’-]*(\s+[A-ZÀ-ÝŠŽ][\w'’-]*)?\s*$")


def _tekst(x):
    return str(x or "").strip()


@bron("be-vl-vkbo-dierenartsen", "BE", ["dierenarts"], "VKBO: ondernemingen en vestigingen met NACE 75.000 (veterinaire diensten)",
      "Digitaal Vlaanderen (Vlaamse Kruispuntbank voor Ondernemingen, uit de KBO)", "Modellicentie gratis hergebruik",
      "https://www.vlaanderen.be/datavindplaats/catalogus/vkbo", kort="VKBO (Digitaal Vlaanderen)")
def _vkbo_vet(b, vernieuw):
    """Rechtspersonen met hoofdactiviteit 75.000 en hun vestigingseenheden, in Vlaanderen.

    Wat zeker is en wat niet ('praktijk'):
      vestigingseenheid met handelsnaam               -> "praktijk"
      vestigingseenheid zonder handelsnaam            -> "onzeker"
      maatschappelijke zetel zonder vestigingseenheid -> "praktijk" met handelsnaam of personeel, anders "onzeker"
                                                          (vaak de vennootschap van één dierenarts op het woonadres)
      maatschappelijke zetel met vestigingseenheden   -> niet op de kaart: de vestigingen zijn de praktijken
    Eenmanszaken staan niet als onderneming in de VKBO, hun vestigingen wel (met de persoonsnaam, die we niet
    overnemen). De punten worden op het KBO-adres geplaatst met
    BeST; de coördinaten van de VKBO dienen alleen als terugvaloptie (sommige liggen op een nepunt in Frankrijk)."""
    import urllib.parse
    q = urllib.parse.urlencode({"f": "application/geo+json", "limit": 10000, "filter-lang": "cql2-text",
                                "filter": "NACE_hoofdact_BTW='75000' OR NACE_hoofdact_RSZ='75000'"})
    d = lees_json(download(b["id"], "https://geo.api.vlaanderen.be/VKBO/ogc/features/v1/collections/Vkbo/items?" + q,
                           "nace75000.geojson", vernieuw))
    fs = d["features"]
    if len(fs) >= 10000:
        raise RuntimeError("be-vl-vkbo-dierenartsen: 10.000 records of meer; paginering nodig")
    met_vestiging = {_tekst(f["properties"].get("Ondernemingsnr_maatsch_zetel")) for f in fs
                     if not _tekst(f["properties"].get("Type_onderneming"))}
    ondernemingen = {_tekst(f["properties"].get("Ondernemingsnr")) for f in fs
                     if _tekst(f["properties"].get("Type_onderneming"))}
    uit, weg = [], 0
    for f in fs:
        p = f["properties"]
        vestiging = not _tekst(p.get("Type_onderneming"))
        nummer = _tekst(p.get("Ondernemingsnr"))
        if not vestiging and nummer in met_vestiging:
            weg += 1  # alleen de zetel; de vestigingseenheden staan apart op de kaart
            continue
        handelsnaam = _tekst(p.get("Commerciele_naam"))
        naam = handelsnaam or _tekst(p.get("Maatschappelijke_naam"))
        # Vestiging van een eenmanszaak: de KBO schrijft de naam van een natuurlijke persoon als
        # "Achternaam, Voornaam". Geen persoonsnaam op de kaart, alleen een echte handelsnaam.
        if vestiging and _tekst(p.get("Ondernemingsnr_maatsch_zetel")) not in ondernemingen \
                and "," in _tekst(p.get("Maatschappelijke_naam")):
            naam = handelsnaam
        if vestiging and _PERSOONSNAAM.match(naam) and not any(
                w in naam.lower() for w in ("dierenarts", "vet", "kliniek", "praktijk", "centrum")):
            naam = ""
        if naam.isupper():
            naam = naam.title()
        personeel = _tekst(p.get("Personeelsklasse")) not in ("", "0 tot 0")
        if vestiging:
            praktijk = "praktijk" if handelsnaam else "onzeker"
        else:
            praktijk = "praktijk" if (handelsnaam or personeel) else "onzeker"
        straat, huisnr = _tekst(p.get("KBO_Straat")), _tekst(p.get("KBO_Huisnr"))
        postcode, gemeente = _tekst(p.get("KBO_Postcode")), _tekst(p.get("KBO_Gemeente"))
        lat, lon = punt_van_feature(f)
        if lat is not None and not (49.4 <= lat <= 51.6 and 2.5 <= lon <= 6.5):
            lat = lon = None
        r = record(b["id"], nummer, naam=naam or None, adres=adres(straat, huisnr, postcode, gemeente),
                   soort="dierenarts", plaatsen=(straat, huisnr, postcode, gemeente), _precisie="adres",
                   _terugval=(lat, lon) if lat is not None else None, praktijk=praktijk,
                   telefoon=_tekst(p.get("Telefoonnummer")) or None)
        uit.append(r)
    # Meerdere inschrijvingen op hetzelfde adres (bv. de vennootschap van een dierenarts en de groepspraktijk
    # waar die werkt) zijn op de kaart één plek: we houden de zekerste (praktijk, dan vestiging, dan met naam).
    beste = {}
    for r in uit:
        sleutel = r["adres"].lower() if r.get("adres") else r["id"]
        score = (r["praktijk"] == "praktijk", r["id"].split(":", 1)[1].startswith("2"), bool(r.get("naam")))
        if sleutel not in beste or score > beste[sleutel][0]:
            beste[sleutel] = (score, r)
    samen = len(uit) - len(beste)
    uit = [r for _, r in beste.values()]
    print(f"  VKBO: {len(fs)} records, {weg} zetels weggelaten omdat de vestigingen apart staan, "
          f"{samen} samengevoegd op hetzelfde adres", flush=True)
    return uit, (d.get("timeStamp") or "")[:10] or None
