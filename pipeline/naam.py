"""Namen en adressen vergelijken, voor het herkennen van dubbels (pipeline/verrijken.py).

Alleen de standaardbibliotheek. Werkt voor Nederlands, Frans en Duits.
"""
import difflib
import re
import unicodedata

# Woorden die in veel namen van een laag staan en niets zeggen over welke plek het is.
ALGEMEEN = {
    "apotheek", "apotheken", "pharmacie", "pharmacies", "apotheke", "pharmacy", "officine",
    "dierenarts", "dierenartsen", "dierenartsenpraktijk", "dierenkliniek", "dierenartspraktijk",
    "veterinaire", "veterinaires", "veterinair", "veterinary", "tierarzt", "tierarztpraxis", "tierklinik",
    "cabinet", "clinique", "kliniek", "praktijk", "dokter", "dr", "docteur", "medecin", "medecins",
    "centre", "centrum", "center", "groepspraktijk", "maison", "medicale", "medical", "medisch",
    "politie", "police", "commissariat", "politiezone", "zone", "pz", "zp", "wijkkantoor", "antenne",
    "poste", "post", "polizei", "hoofdcommissariaat", "commissariaat", "bureau", "lokale", "locale",
    "brandweer", "pompiers", "kazerne", "caserne", "brandweerpost", "brandweerkazerne", "service",
    "incendie", "secours", "hulpverleningszone", "feuerwehr", "sapeurs",
    "gemeentehuis", "stadhuis", "administratief", "administration", "communale", "commune",
    "hotel", "ville", "gemeente", "stad", "rathaus", "gemeindehaus", "maison", "communal",
    "ziekenhuis", "hopital", "krankenhaus", "hospital", "campus", "site", "az", "chu", "ch", "chr",
    "uz", "algemeen", "universitair", "regional", "regionaal",
    "dap", "dierenartspraktijk", "dierenartsenpraktijken", "dierenkliniek", "dierenartsencentrum", "kleindierenpraktijk",
    "paardenpraktijk", "paardenkliniek", "comm", "commv", "vof", "cv", "srl", "sc", "scs", "veterinary", "vet", "vets",
    "de", "het", "een", "van", "der", "den", "la", "le", "les", "l", "du", "des", "d", "et", "en",
    "und", "am", "im", "an", "der", "die", "das", "of", "the", "and", "sa", "bv", "bvba", "srl", "sprl", "nv",
}

AFKORTINGEN = [
    (r"\bstr\b\.?", "straat"), (r"(?<=[a-z])str\b\.?", "straat"), (r"(?<=[a-z])stwg\b\.?", "steenweg"), (r"\bstwg\b\.?", "steenweg"), (r"\bstw\b\.?", "steenweg"),
    (r"\bln\b\.?", "laan"), (r"\bpl\b\.?", "plein"),
    (r"\bav\b\.?", "avenue"), (r"\bbd\b\.?", "boulevard"), (r"\bbld\b\.?", "boulevard"),
    (r"\bchee\b\.?", "chaussee"), (r"\bch\b\.? (?=de |d )", "chaussee "),
    (r"\bst\b\.?", "sint"), (r"\bste\b\.?", "sainte"),
]


def zonder_accenten(tekst):
    return "".join(c for c in unicodedata.normalize("NFKD", tekst) if not unicodedata.combining(c))


def basis(tekst):
    """Kleine letters, zonder accenten en leestekens, enkele spaties."""
    t = zonder_accenten(str(tekst or "")).lower()
    t = t.replace("ß", "ss").replace("'", " ").replace("’", " ")
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def naam_tokens(naam):
    """Betekenisvolle woorden van een naam."""
    return [w for w in basis(naam).split() if w not in ALGEMEEN and len(w) > 1]


def naam_gelijkenis(a, b):
    """0..1. 1 = dezelfde naam (na weglaten van algemene woorden). None als een naam ontbreekt."""
    if not a or not b:
        return None
    ta, tb = naam_tokens(a), naam_tokens(b)
    if not ta or not tb:
        # Alleen algemene woorden ("Apotheek"): vergelijk de volledige tekst, maar voorzichtig.
        return 0.5 if basis(a) == basis(b) else 0.2
    sa, sb = set(ta), set(tb)
    jaccard = len(sa & sb) / len(sa | sb)
    # Eén naam bevat de andere ("Apotheek Peeters" en "Peeters"): sterk teken.
    deel = len(sa & sb) / min(len(sa), len(sb))
    reeks = difflib.SequenceMatcher(None, " ".join(sorted(ta)), " ".join(sorted(tb))).ratio()
    return round(max(jaccard, 0.9 * deel, reeks), 3)


def straat(tekst):
    t = basis(tekst)
    for patroon, vervanging in AFKORTINGEN:
        t = re.sub(patroon, vervanging, t)
    return re.sub(r"\s+", " ", t).strip()


# Straatwoorden die niets zeggen over welke straat het is.
STRAATWOORDEN = {"straat", "steenweg", "laan", "plein", "dreef", "weg", "lei", "kaai", "markt", "rue", "avenue",
                 "chaussee", "boulevard", "place", "chemin", "route", "quai", "square", "allee", "impasse",
                 "strasse", "platz", "gasse", "sint", "saint", "sainte", "grand", "grote", "kleine", "petite"}


def ontleed_adres(adres):
    """(straat, nummer, postcode) uit "Straat 12, 1234 Gemeente" of "12 rue X, 1234 Y". Onderdelen kunnen None zijn."""
    if not adres:
        return (None, None, None)
    tekst = str(adres)
    postcode = None
    m = re.search(r"\b(\d{4,5})\b(?=\s+[^\d,]+$|\s*$)", tekst.split(",")[-1].strip()) if "," in tekst else None
    if m:
        postcode = m.group(1)
    eerste = tekst.split(",")[0]
    nummer = None
    m = re.search(r"\b(\d+)\s*[a-zA-Z]?\b", eerste)
    if m:
        nummer = m.group(1)
        eerste = (eerste[:m.start()] + " " + eerste[m.end():])
    s = straat(re.sub(r"\b(bus|boite|bte|box)\b.*$", "", eerste, flags=re.I))
    return (s or None, nummer, postcode)


def adres_gelijk(a, b):
    """True als straat en huisnummer overeenkomen, False als ze duidelijk verschillen, None als onbekend."""
    sa, na, _ = ontleed_adres(a)
    sb, nb, _ = ontleed_adres(b)
    if not sa or not sb:
        return None
    # Tweetalige straten ("Rue X - X-straat"): een gedeeld woord van minstens 4 letters volstaat.
    wa = {w for w in sa.split() if len(w) >= 4 and w not in STRAATWOORDEN}
    wb = {w for w in sb.split() if len(w) >= 4 and w not in STRAATWOORDEN}
    straat_ok = sa == sb or bool(wa & wb) or difflib.SequenceMatcher(None, sa, sb).ratio() >= 0.8
    if not straat_ok:
        return False
    if na and nb:
        return na == nb
    return None
