"""Open bronnen van plekken (derden) voor de kaartlagen: Overture Maps Places, voor heel Europa.

Overture Maps Places (Overture Maps Foundation, maandelijkse release) bundelt plekken van Meta, Microsoft,
Foursquare, BrightQuery, AllThePlaces en enkele vermeldingsdiensten (PinMeTo, Uberall, Krick, ...). Het thema
bevat geen OpenStreetMap-data. Licentie: CDLA-Permissive-2.0, voor het deel van Foursquare Apache-2.0, voor
AllThePlaces CC0-1.0. Hergebruik in een ODbL-databank is toegestaan als de licentieteksten (en de NOTICE van
Foursquare) met de data meegaan; die staan in site/public/data/licenties/. Uitleg: docs/kaartdata.md.

Foursquare OS Places zelf (met date_refreshed, date_closed en unresolved_flags) vraagt een account op het
Places Portal of Hugging Face en extra voorwaarden; dat beslist het kernteam (aanvraag in docs/kaartdata.md).
Tot dan komt Foursquare alleen binnen via Overture.

Download: de releases staan als GeoParquet met ZSTD-compressie op S3 en Azure. Python zonder pakketten kan
dat niet lezen; de uitsnede gebeurt daarom met de opdracht `duckdb` (brew install duckdb), zoals osmium en
pmtiles elders in de pijplijn. DuckDB leest alleen de rijgroepen die in het kader van de vijf landen liggen
(ongeveer 1,5 GB van 6 GB) en schrijft één gzip-bestand met JSON-regels naar
pipeline/out/derden/overture-<release>.ndjson.gz. Dat bestand blijft tot er een nieuwe release is.

Een record (zie records()) heeft dezelfde velden als een record uit pipeline/officieel.py, plus:
  families   set van onafhankelijke herkomsten die de plek kennen en recent genoeg zijn (zie FAMILIE)
  zekerheid  "bevestigd" (twee families), "onzeker" (één familie, hoge confidence) of None (te zwak)
  conf       confidence van Overture (0..1, kans dat de plek bestaat)
  gesloten   True bij operating_status = permanently_closed
  herkomst   leesbare lijst van de leveranciers ("Meta, BrightQuery")
Alleen de standaardbibliotheek, plus de opdracht duckdb voor de download.
"""
import datetime as dt
import gzip
import json
import re
import shutil
import subprocess
import urllib.request
from pathlib import Path

import naam as nm

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "pipeline" / "out" / "derden"
USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"
S3 = "https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com"
LANDEN = ("BE", "NL", "LU", "FR", "DE")
# Kader rond de vijf landen (vasteland van Frankrijk en Corsica); punten buiten het land vallen later weg.
KADER = (-5.5, 41.0, 15.5, 55.2)

BRON_ID = "eu-overture-places"
BRON_INFO = {
    "naam": "Overture Maps Places (Meta, Microsoft, Foursquare, BrightQuery, AllThePlaces en andere)",
    "kort": "Overture Maps", "eigenaar": "Overture Maps Foundation",
    "licentie": "CDLA-Permissive-2.0; Foursquare: Apache-2.0; AllThePlaces: CC0-1.0",
    "url": "https://docs.overturemaps.org/guides/places/",
    "licenties": "licenties/",
}

# Categorie van Overture (taxonomy.primary) -> (laag, soort, spoed).
# Bewust niet: doctors_office (vooral specialisten en labo's), government_office (alle diensten), public_fountain
# (sierfonteinen). Een categorie voor AED's bestaat niet.
CATEGORIEEN = {
    "hospital": ("ziekenhuizen", "ziekenhuis", None),
    "general_hospital": ("ziekenhuizen", "ziekenhuis", None),
    "psychiatric_hospital": ("ziekenhuizen", "psychiatrisch ziekenhuis", None),
    "specialty_hospital": ("ziekenhuizen", "ziekenhuis", None),
    "childrens_hospital": ("ziekenhuizen", "kinderziekenhuis", None),
    "emergency_department": ("ziekenhuizen", "ziekenhuis", "ja"),
    "family_practice": ("medisch", "huisarts of praktijk", None),
    "primary_care_or_general_clinic": ("medisch", "huisarts of praktijk", None),
    "community_health_center": ("medisch", "gezondheidscentrum", None),
    "public_health_clinic": ("medisch", "gezondheidscentrum", None),
    "urgent_care_clinic": ("medisch", "wachtpost", None),
    "police_station": ("politie", "politie", None),
    "fire_station": ("brandweer", "brandweer", None),
    "pharmacy": ("apotheken", "apotheek", None),
    "veterinarian": ("dierenarts", "dierenarts", None),
    "veterinary_care": ("dierenarts", "dierenarts", None),
    "animal_hospital": ("dierenarts", "dierenkliniek", None),
    "emergency_pet_hospital": ("dierenarts", "dierenkliniek", None),
    "town_hall": ("overheid", "gemeentehuis", None),
    "drinking_fountain": ("drinkwater", "drinkwaterpunt", None),
}

# Leverancier (sources[].dataset) -> familie. Twee bronnen uit dezelfde familie bevestigen elkaar niet.
# BrightQuery haalt zijn gegevens uit overheidsregisters (ondernemingsregisters zoals de KBO en SIRENE):
# dezelfde familie als de VKBO en SIRENE in pipeline/officieel.py. PinMeTo, Uberall, Krick, DAC, Birdeye,
# RenderSEO en OpenTravel zijn diensten waarmee een zaak zelf haar gegevens verspreidt: één familie.
FAMILIE = {
    "meta": "meta", "Microsoft": "microsoft", "Foursquare": "foursquare", "AllThePlaces": "allTheplaces",
    "BrightQuery": "register",
    "PinMeTo": "vermelding", "Uberall": "vermelding", "Krick": "vermelding", "DAC": "vermelding",
    "Birdeye": "vermelding", "RenderSEO": "vermelding", "OpenTravel": "vermelding",
}
LEESBAAR = {"meta": "Meta", "Microsoft": "Microsoft", "Foursquare": "Foursquare", "AllThePlaces": "AllThePlaces",
            "BrightQuery": "BrightQuery"}

# Regels voor de zekerheid (docs/kaartdata.md, "Kruiscontrole").
MAX_LEEFTIJD_JAAR = 3      # een bron die langer niet bijgewerkt is, telt niet (Microsoft, Foursquare: soms 2013)
MIN_CONF_BEVESTIGD = 0.5   # twee families: plek bevestigd
MIN_CONF_ALLEEN = 0.8      # één familie: hoogstens "onzeker" (open ring, "Bel eerst")
MIN_CONF_BEVESTIGING = 0.5  # om een bestaand punt (OSM, officieel) te bevestigen

# Woorden die tonen dat een naam de naam van een zaak is en niet alleen van een persoon. Een naam zonder zo'n
# woord ("Gastmans Pascale", "Nagels / Guy", "Dierenarts Orban Francoise") komt niet op de kaart: van een
# natuurlijke persoon tonen we geen naam, zoals bij de registers. Een merk telt ook als naam van een zaak.
_ZAAK = re.compile(
    r"praktijk|kliniek|clinic|clinique|klinik|centrum|center|centre|zentrum|cabinet|praxis|maison|huis\b|groep|group|"
    r"apothe[ek]|pharma|ziekenhuis|hopital|hospital|krankenhaus|spital|klinikum|polikliniek|policlinique|"
    r"gezondheid|sante|gesundheit|medisch|medical|medic|mvz|wachtpost|garde|notdienst|"
    r"artsen\b|veterinaires|tierarzte|vets\b|\bdap\b|animal|"
    r"politie|police|polizei|gendarmerie|commissariat|brandweer|pompiers|sdis|feuerwehr|wache|"
    r"gemeente|stadhuis|mairie|hotel de ville|rathaus|gemeinde|commune|stadt|"
    r"\b(bv|bvba|srl|sprl|nv|sa|vzw|asbl|gmbh|sarl|selarl|scm|ag|kg|ug|ohg|ev|commv|scrl|cv)\b")


def toon_naam(naam, merk):
    """De naam voor op de kaart, of None als het (waarschijnlijk) alleen de naam van een persoon is."""
    if not naam:
        return None
    if merk:
        return naam
    return naam if _ZAAK.search(nm.basis(naam)) else None


def _netjes(tekst):
    """Hoofdletters (BrightQuery schrijft "GROTE BAAN 26") naar gewone schrijfwijze."""
    t = str(tekst or "").strip(" ,")
    return t.title() if t.isupper() else t


def laatste_release():
    """De nieuwste release in de S3-bucket (release/<datum>.<n>/)."""
    url = f"{S3}/?list-type=2&prefix=release/&delimiter=/"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": USER_AGENT}), timeout=60) as r:
        tekst = r.read().decode("utf-8")
    releases = re.findall(r"<Prefix>release/([0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+)/</Prefix>", tekst)
    if not releases:
        raise RuntimeError("Overture: geen release gevonden in de bucket")
    return max(releases)


SQL = """
INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';
COPY (
  SELECT id, names.primary AS naam, brand.names.primary AS merk, taxonomy.primary AS cat,
         round(confidence, 3) AS conf, operating_status AS status,
         [{{'d': x.dataset, 't': left(x.update_time, 10)}} FOR x IN sources IF x.dataset <> 'Overture'] AS bronnen,
         addresses[1].freeform AS adres, addresses[1].postcode AS postcode, addresses[1].locality AS plaats,
         addresses[1].country AS land, phones[1] AS tel,
         round(bbox.xmin, 6) AS lon, round(bbox.ymin, 6) AS lat
  FROM read_parquet('s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*', hive_partitioning=false)
  WHERE bbox.xmin BETWEEN {x0} AND {x1} AND bbox.ymin BETWEEN {y0} AND {y1}
    AND taxonomy.primary IN ({categorieen})
    AND addresses[1].country IN ({landen})
) TO '{uit}' (FORMAT json, COMPRESSION gzip);
"""


def haal_overture(vernieuw=False, release=None):
    """Pad naar de uitsnede van de laatste release (downloadt met duckdb als ze er nog niet is)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    bestaand = sorted(CACHE.glob("overture-*.ndjson.gz"))
    if release is None:
        try:
            release = laatste_release()
        except Exception as e:  # noqa: BLE001 - geen netwerk: de laatste uitsnede gebruiken
            if bestaand:
                print(f"  Overture: release niet op te vragen ({e}); {bestaand[-1].name} gebruikt", flush=True)
                return bestaand[-1], bestaand[-1].name[len("overture-"):-len(".ndjson.gz")]
            raise
    pad = CACHE / f"overture-{release}.ndjson.gz"
    if pad.exists() and not vernieuw:
        return pad, release
    if not shutil.which("duckdb"):
        raise RuntimeError("Overture: de opdracht duckdb ontbreekt (brew install duckdb); of draai met --zonder-open-bron")
    sql = SQL.format(release=release, x0=KADER[0], y0=KADER[1], x1=KADER[2], y1=KADER[3],
                     categorieen=", ".join(f"'{c}'" for c in CATEGORIEEN),
                     landen=", ".join(f"'{c}'" for c in LANDEN), uit=str(pad) + ".deel")
    print(f"  Overture {release}: uitsnede met duckdb (enkele minuten) ...", flush=True)
    subprocess.run(["duckdb", "-no-agent", "-c", sql], check=True, stdout=subprocess.DEVNULL)
    Path(str(pad) + ".deel").replace(pad)
    for oud in bestaand:
        if oud != pad:
            oud.unlink()
    return pad, release


def _datum(t):
    try:
        return dt.date.fromisoformat(t[:10])
    except (TypeError, ValueError):
        return None


def families_van(bronnen, vandaag=None):
    """{familie: nieuwste datum} van de bronnen die recent genoeg zijn."""
    vandaag = vandaag or dt.date.today()
    grens = vandaag.replace(year=vandaag.year - MAX_LEEFTIJD_JAAR)
    uit = {}
    for b in bronnen or []:
        fam = FAMILIE.get(b.get("d"))
        d = _datum(b.get("t"))
        if not fam or d is None or d < grens:
            continue
        uit[fam] = max(uit.get(fam, d), d)
    return uit


def zekerheid_van(families, conf):
    if conf is None:
        conf = 0.0
    if len(families) >= 2 and conf >= MIN_CONF_BEVESTIGD:
        return "bevestigd"
    if len(families) == 1 and conf >= MIN_CONF_ALLEEN:
        return "onzeker"
    return None


_INHOUD = {}


def _lees(pad):
    if pad not in _INHOUD:
        per = {}
        with gzip.open(pad, "rt", encoding="utf-8") as f:
            for regel in f:
                r = json.loads(regel)
                cat = CATEGORIEEN.get(r.get("cat"))
                if cat and r.get("land") in LANDEN:
                    per.setdefault((r["land"], cat[0]), []).append(r)
        _INHOUD[pad] = per
    return _INHOUD[pad]


def records(land, laag, vernieuw=False, kader=None):
    """(records, info) voor een land en laag. 'kader' = (x0, y0, x1, y1) van het land (data/landen/)."""
    pad, release = haal_overture(vernieuw)
    uit = []
    for r in _lees(pad).get((land.upper(), laag), []):
        lon, lat = r.get("lon"), r.get("lat")
        if lon is None or lat is None or (kader and not (kader[0] <= lon <= kader[2] and kader[1] <= lat <= kader[3])):
            continue
        _, soort, spoed = CATEGORIEEN[r["cat"]]
        fam = families_van(r.get("bronnen"))
        conf = r.get("conf")
        naam = toon_naam(_netjes(r.get("naam")), r.get("merk"))
        straat = _netjes(r.get("adres"))
        plaats = " ".join(x for x in (r.get("postcode"), _netjes(r.get("plaats"))) if x)
        if straat and plaats and plaats.lower() in straat.lower():
            plaats = ""
        adres = ", ".join(x for x in (straat, plaats) if x) or None
        leveranciers = sorted({b["d"] for b in r.get("bronnen") or [] if b.get("d")})
        uit.append({
            "id": f"overture:{r['id']}", "bron": BRON_ID, "naam": naam, "soort": soort, "adres": adres,
            "lat": lat, "lon": lon, "emergency": spoed, "geplaatst": "bron",
            # Telefoon alleen bij de naam van een zaak: geen nummer van een persoon zonder handelsnaam.
            "telefoon": r.get("tel") if naam else None,
            "families": fam, "conf": conf, "zekerheid": zekerheid_van(fam, conf),
            "gesloten": r.get("status") == "permanently_closed" or r.get("status") == "temporarily_closed",
            "herkomst": ", ".join(LEESBAAR.get(x, x) for x in leveranciers),
            "_ruwe_naam": r.get("naam"),
        })
    info = dict(BRON_INFO, datum=release[:10], opgehaald=dt.date.today().isoformat(), release=release)
    return uit, info
