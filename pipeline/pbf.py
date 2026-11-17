"""OpenStreetMap-data uit een landextract van Geofabrik in plaats van Overpass.

Voor grote landen (Frankrijk, Duitsland) is Overpass traag en kwetsbaar: honderden
aanvragen met pauzes ertussen, en een server die je IP-adres tijdelijk weert. Hier
laden we één keer het landextract (.osm.pbf, ODbL) en filteren het lokaal met de
opdracht `osmium` (brew install osmium-tool, of apt install osmium-tool).

De functie zoek() geeft elementen in hetzelfde formaat als een Overpass-antwoord
met "out center tags" of "out geom", zodat lagen.py en schuilplekken.py er niets
van merken. De filters zijn dezelfde Overpass-filters als in die scripts, bv.
    nwr["amenity"="hospital"]
    way["highway"]["tunnel"="yes"]["highway"!~"^(footway|path)$"]

Werkwijze:
  1. osmium tags-filter knipt alles wat een van de filters kan halen uit het
     extract (met de knopen en wegen waarnaar verwezen wordt);
  2. osmium add-locations-to-ways zet de coördinaten in de wegen;
  3. we lezen het resultaat als OPL (tekst) en passen de filters exact toe.
Het tussenbestand wordt bewaard in pipeline/out/pbf/ zolang het extract niet wijzigt.

Kies deze bron met "bron": "geofabrik" in pipeline/budget.json (landen -> code),
of voor één run met PLANB72_BRON=geofabrik.
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = ROOT / "pipeline" / "out" / "pbf"
USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"
MAX_OUDERDOM = 7 * 86400  # een extract van meer dan een week oud opnieuw downloaden

# Landcode -> pad op download.geofabrik.de. "france" is het Europese Frankrijk met
# Corsica; de overzeese gebieden zijn aparte extracten.
GEOFABRIK = {
    "BE": "europe/belgium",
    "DE": "europe/germany",
    "FR": "europe/france",
    "LU": "europe/luxembourg",
    "NL": "europe/netherlands",
}

_FILTER = re.compile(r'^(nwr|node|way|rel|relation)((?:\[[^\]]+\])+)$')
_VOORWAARDE = re.compile(r'\["([^"]+)"(?:\s*(=|!=|~|!~)\s*"([^"]*)")?\]')
_ALTERNATIEF = re.compile(r'^\^\(?([A-Za-z0-9_:|.-]+?)\)?\$$')


def gekozen(land):
    """True als dit land uit een Geofabrik-extract komt in plaats van Overpass."""
    if os.environ.get("PLANB72_BRON") == "geofabrik":
        return True
    pad = Path(__file__).resolve().parent / "budget.json"
    with open(pad, encoding="utf-8") as f:
        inst = json.load(f).get("landen", {}).get(land.upper(), {})
    return inst.get("bron") == "geofabrik"


# ---------------------------------------------------------------- filters

def ontleed(filt):
    """'nwr["a"="b"]["c"]' -> (soorten, [(sleutel, operator, waarde)])."""
    m = _FILTER.match(filt.strip())
    if not m:
        raise ValueError(f"filter niet begrepen: {filt}")
    soort = m.group(1)
    soorten = {"nwr": "nwr", "node": "n", "way": "w", "rel": "r", "relation": "r"}[soort]
    voorwaarden = [(k, op or None, v) for k, op, v in _VOORWAARDE.findall(m.group(2))]
    return soorten, [(k, op or None, v if op else None) for k, op, v in voorwaarden]


def voldoet(tags, voorwaarden):
    for k, op, v in voorwaarden:
        w = tags.get(k)
        if op is None:
            if w is None:
                return False
        elif op == "=":
            if w != v:
                return False
        elif op == "!=":
            if w == v:
                return False
        elif op == "~":
            if w is None or not re.search(v, w):
                return False
        elif op == "!~":
            if w is not None and re.search(v, w):
                return False
    return True


def voorfilter(filt):
    """De osmium tags-filter-uitdrukking die minstens alles van dit filter vangt.

    Voorkeur: een exacte waarde (k=v), dan een reeks alternatieven (^(a|b)$ -> k=a,b),
    anders de langste sleutel (die is meestal het zeldzaamst).
    """
    soorten, voorwaarden = ontleed(filt)
    exact = [(k, v) for k, op, v in voorwaarden if op == "="]
    if exact:
        k, v = exact[-1]
        return f"{soorten}/{k}={v}"
    for k, op, v in voorwaarden:
        if op == "~":
            m = _ALTERNATIEF.match(v)
            if m:
                return f"{soorten}/{k}={','.join(m.group(1).split('|'))}"
    sleutels = [k for k, op, v in voorwaarden if op in (None, "~")]
    return f"{soorten}/{max(sleutels, key=len)}"


# ---------------------------------------------------------------- bestanden

def extract(land, log=print):
    """Pad naar het landextract; downloadt het als het ontbreekt of te oud is."""
    land = land.upper()
    if land not in GEOFABRIK:
        raise SystemExit(f"Geen Geofabrik-extract gekend voor {land}; vul GEOFABRIK aan in pipeline/pbf.py.")
    naam = GEOFABRIK[land].split("/")[-1]
    doel = MAP / f"{naam}.osm.pbf"
    if doel.exists() and time.time() - doel.stat().st_mtime < MAX_OUDERDOM:
        return doel
    MAP.mkdir(parents=True, exist_ok=True)
    url = f"https://download.geofabrik.de/{GEOFABRIK[land]}-latest.osm.pbf"
    log(f"{land}: extract downloaden van {url} ...", flush=True)
    tijdelijk = doel.with_suffix(".deel")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as r, open(tijdelijk, "wb") as f:
        shutil.copyfileobj(r, f, length=4 * 1024 * 1024)
    tijdelijk.replace(doel)
    log(f"  {doel.stat().st_size / 1e9:.2f} GB in {time.time() - t0:.0f} s", flush=True)
    return doel


def _osmium(*args):
    if not shutil.which("osmium"):
        raise SystemExit("De opdracht 'osmium' ontbreekt (brew install osmium-tool).")
    r = subprocess.run(["osmium", *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if r.returncode != 0:
        raise SystemExit(f"osmium {args[0]} mislukt: {r.stderr.strip()[-400:]}")


def deelbestand(land, filters, log=print):
    """Gefilterd extract met coördinaten in de wegen; bewaard per set filters."""
    bron = extract(land, log)
    uitdrukkingen = sorted({voorfilter(f) for f in filters})
    sleutel = hashlib.sha1(("\n".join(uitdrukkingen) + str(bron.stat().st_mtime)).encode()).hexdigest()[:10]
    doel = MAP / f"{land.lower()}-{sleutel}.osm.pbf"
    if doel.exists() and doel.stat().st_mtime >= bron.stat().st_mtime:
        return doel
    t0 = time.time()
    log(f"{land}: extract filteren ({len(uitdrukkingen)} uitdrukkingen) ...", flush=True)
    tussen = MAP / f"{land.lower()}-{sleutel}-tags.osm.pbf"
    _osmium("tags-filter", str(bron), *uitdrukkingen, "-o", str(tussen), "--overwrite")
    _osmium("add-locations-to-ways", str(tussen), "-o", str(doel), "--overwrite")
    tussen.unlink()
    log(f"  {doel.stat().st_size / 1e6:.0f} MB in {time.time() - t0:.0f} s", flush=True)
    return doel


# ---------------------------------------------------------------- OPL lezen

_ESCAPE = re.compile(r"%([0-9a-fA-F]+)%")


def _ontsnap(s):
    return _ESCAPE.sub(lambda m: chr(int(m.group(1), 16)), s) if "%" in s else s


def _tags(veld):
    tags = {}
    if not veld:
        return tags
    for paar in veld.split(","):
        k, _, v = paar.partition("=")
        tags[_ontsnap(k)] = _ontsnap(v)
    return tags


def _locatie(s):
    """'n12x4.1y50.2' -> (12, lon, lat) of (12, None, None)."""
    i = s.find("x")
    if i < 0:
        return int(s[1:]), None, None
    j = s.index("y", i)
    nid = int(s[1:i])
    x, y = s[i + 1:j], s[j + 1:]
    return nid, (float(x) if x else None), (float(y) if y else None)


class Index:
    """Alle objecten uit een deelbestand, in het geheugen."""

    def __init__(self, pad):
        self.knopen = {}      # id -> (lat, lon, tags) alleen knopen met tags
        self.wegen = {}       # id -> (tags, [(knoop, lon, lat)])
        self.relaties = {}    # id -> (tags, [(soort, id, rol)])
        proc = subprocess.Popen(["osmium", "cat", str(pad), "-f", "opl,add_metadata=false,locations_on_ways=true"],
                                stdout=subprocess.PIPE, text=True, encoding="utf-8")
        for regel in proc.stdout:
            velden = regel.rstrip("\n").split(" ")
            soort, oid = velden[0][0], int(velden[0][1:])
            rest = {v[0]: v[1:] for v in velden[1:] if v}
            tags = _tags(rest.get("T", ""))
            if soort == "n":
                if tags and rest.get("x"):
                    self.knopen[oid] = (float(rest["y"]), float(rest["x"]), tags)
            elif soort == "w":
                punten = [_locatie(s) for s in rest.get("N", "").split(",") if s]
                self.wegen[oid] = (tags, punten)
            elif soort == "r":
                leden = []
                for s in rest.get("M", "").split(","):
                    if not s:
                        continue
                    ref, _, rol = s.partition("@")
                    leden.append((ref[0], int(ref[1:]), _ontsnap(rol)))
                self.relaties[oid] = (tags, leden)
        if proc.wait() != 0:
            raise SystemExit("osmium cat mislukt")

    def _weg_geom(self, punten):
        return [{"lat": lat, "lon": lon} for _, lon, lat in punten if lat is not None]

    def _grenzen(self, punten):
        lats = [p[2] for p in punten if p[2] is not None]
        lons = [p[1] for p in punten if p[1] is not None]
        if not lats:
            return None
        return min(lats), min(lons), max(lats), max(lons)

    def _relatie_grenzen(self, leden, diepte=0):
        vakken = []
        for soort, oid, _ in leden:
            if soort == "n" and oid in self.knopen:
                lat, lon, _ = self.knopen[oid]
                vakken.append((lat, lon, lat, lon))
            elif soort == "w" and oid in self.wegen:
                g = self._grenzen(self.wegen[oid][1])
                if g:
                    vakken.append(g)
            elif soort == "r" and oid in self.relaties and diepte < 2:
                g = self._relatie_grenzen(self.relaties[oid][1], diepte + 1)
                if g:
                    vakken.append(g)
        if not vakken:
            return None
        return (min(v[0] for v in vakken), min(v[1] for v in vakken),
                max(v[2] for v in vakken), max(v[3] for v in vakken))

    @staticmethod
    def _midden(g):
        return {"lat": (g[0] + g[2]) / 2, "lon": (g[1] + g[3]) / 2}

    def zoek(self, filters, geom=False):
        """Elementen zoals Overpass ze geeft met 'out center tags' (of 'out geom')."""
        ontleed_ = [ontleed(f) for f in filters]
        uit = {}

        def past(soort, tags):
            return any((s == "nwr" or s == soort) and voldoet(tags, v) for s, v in ontleed_)

        for oid, (lat, lon, tags) in self.knopen.items():
            if past("n", tags):
                uit[("node", oid)] = {"type": "node", "id": oid, "lat": lat, "lon": lon, "tags": tags}
        for oid, (tags, punten) in self.wegen.items():
            if not tags or not past("w", tags):
                continue
            g = self._grenzen(punten)
            if not g:
                continue
            el = {"type": "way", "id": oid, "tags": tags}
            if geom:
                el["nodes"] = [p[0] for p in punten]
                el["geometry"] = self._weg_geom(punten)
                el["bounds"] = {"minlat": g[0], "minlon": g[1], "maxlat": g[2], "maxlon": g[3]}
            else:
                el["center"] = self._midden(g)
            uit[("way", oid)] = el
        for oid, (tags, leden) in self.relaties.items():
            if not past("r", tags):
                continue
            g = self._relatie_grenzen(leden)
            if not g:
                continue
            el = {"type": "relation", "id": oid, "tags": tags, "center": self._midden(g),
                  "bounds": {"minlat": g[0], "minlon": g[1], "maxlat": g[2], "maxlon": g[3]}}
            if geom:
                el["members"] = [
                    {"type": "way", "ref": wid, "role": rol,
                     "geometry": self._weg_geom(self.wegen[wid][1])}
                    for s, wid, rol in leden if s == "w" and wid in self.wegen]
            uit[("relation", oid)] = el
        return list(uit.values())


_INDEXEN = {}


def index(land, filters, log=print):
    """Index voor een land en een set filters (één keer per run opgebouwd)."""
    pad = deelbestand(land, filters, log)
    if pad not in _INDEXEN:
        t0 = time.time()
        _INDEXEN[pad] = Index(pad)
        i = _INDEXEN[pad]
        log(f"  ingelezen: {len(i.knopen)} knopen, {len(i.wegen)} wegen, "
            f"{len(i.relaties)} relaties ({time.time() - t0:.0f} s)", flush=True)
    return _INDEXEN[pad]


class Grens:
    """Landsgrens uit OpenStreetMap (admin_level 2) om punten binnen het land te houden.

    Het extract van Geofabrik loopt een stukje over de grens. Ray casting naar het
    oosten, met de randsegmenten per strook van 0,01 graad breedte, zodat een punt
    maar een handvol segmenten hoeft te testen.
    """

    STROOK = 0.01

    def __init__(self, lijnen):
        self.stroken = {}
        for lijn in lijnen:
            for (x1, y1), (x2, y2) in zip(lijn, lijn[1:]):
                if y1 == y2:
                    continue
                for k in range(int(min(y1, y2) // self.STROOK), int(max(y1, y2) // self.STROOK) + 1):
                    self.stroken.setdefault(k, []).append((x1, y1, x2, y2))

    def binnen(self, lat, lon):
        binnen = False
        for x1, y1, x2, y2 in self.stroken.get(int(lat // self.STROOK), ()):
            if (y1 > lat) != (y2 > lat):
                if x1 + (lat - y1) * (x2 - x1) / (y2 - y1) > lon:
                    binnen = not binnen
        return binnen


def grens(land, log=print):
    """De landsgrens als Grens, of None als ze niet in het extract zit."""
    cache = MAP / f"{land.lower()}-grens.json"
    bron = extract(land, log)
    if cache.exists() and cache.stat().st_mtime >= bron.stat().st_mtime:
        with open(cache, encoding="utf-8") as f:
            lijnen = json.load(f)
    else:
        filt = f'rel["boundary"="administrative"]["admin_level"="2"]["ISO3166-1"="{land.upper()}"]'
        els = index(land, [filt], log).zoek([filt], geom=True)
        lijnen = [[[g["lon"], g["lat"]] for g in m["geometry"]]
                  for el in els for m in el.get("members", [])
                  if m.get("role") in ("outer", "inner", "") and m.get("geometry")]
        with open(cache, "w", encoding="utf-8") as f:
            json.dump(lijnen, f, separators=(",", ":"))
    if not lijnen:
        log(f"  {land}: geen landsgrens gevonden; alleen de bbox wordt gebruikt", flush=True)
        return None
    return Grens(lijnen)


def antwoord(elementen, t0):
    """Verpak elementen als een Overpass-antwoord (met _server en _seconden)."""
    return {"elements": elementen, "_server": "https://geofabrik/extract",
            "_seconden": round(time.time() - t0, 1), "_bytes": 0}


if __name__ == "__main__":
    # Snelle proef: python3 pipeline/pbf.py LU 'nwr["amenity"="hospital"]'
    land, *fs = sys.argv[1:]
    i = index(land, fs)
    for e in i.zoek(fs)[:5]:
        print(e)
