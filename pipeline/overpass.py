"""Gedeelde hulpfuncties voor de pijplijn: Overpass-aanvragen, afstanden, uitvoer.

Alleen standaardbibliotheek. Gebruikt door lagen.py en schuilplekken.py.
"""

import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"

# Volgorde waarin we de servers proberen. De hoofdserver eerst; de anderen
# zijn spiegels van de gemeenschap. Met PLANB72_OVERPASS kan je er één opleggen.
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

# Rust tussen twee aanvragen, om de gedeelde servers niet te overbelasten.
PAUZE_TUSSEN_AANVRAGEN = 10

_laatste_aanvraag = [0.0]
# Servers die faalden (geen verbinding, druk); die proberen we pas als laatste.
_onbereikbaar = set()


def servers():
    eigen = os.environ.get("PLANB72_OVERPASS")
    if eigen:
        return [eigen]
    return ([s for s in SERVERS if s not in _onbereikbaar]
            + [s for s in SERVERS if s in _onbereikbaar])


def vraag(query, timeout=900, pogingen=6, log=print):
    """Stuurt een Overpass QL-query en geeft het JSON-antwoord terug.

    Wisselt bij een fout naar de volgende server en wacht steeds langer
    (exponentiële backoff). Een 429 of 504 betekent dat de server druk is.

    Een leeg antwoord vertrouwen we pas als een tweede server het bevestigt:
    sommige spiegels geven stil niets terug als hun gebiedsindex ontbreekt.
    """
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    wacht = 15
    laatste_fout = None
    geprobeerd = {}
    leeg_van = set()
    for poging in range(pogingen):
        # Bereikbare servers eerst, en elke server om beurt.
        lijst = servers()
        server = min(lijst, key=lambda s: geprobeerd.get(s, 0))
        geprobeerd[server] = geprobeerd.get(server, 0) + 1
        rust = PAUZE_TUSSEN_AANVRAGEN - (time.time() - _laatste_aanvraag[0])
        if rust > 0:
            time.sleep(rust)
        _laatste_aanvraag[0] = time.time()
        req = urllib.request.Request(server, data=data, headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        })
        t0 = time.time()
        try:
            # Ruime timeout op de verbinding: de query zelf mag lang lopen.
            with urllib.request.urlopen(req, timeout=timeout + 120) as r:
                ruw = r.read()
            antwoord = json.loads(ruw)
            opmerking = antwoord.get("remark", "")
            if "runtime error" in opmerking or "Query timed out" in opmerking:
                raise RuntimeError(f"Overpass-fout: {opmerking}")
            antwoord["_server"] = server
            antwoord["_seconden"] = round(time.time() - t0, 1)
            antwoord["_bytes"] = len(ruw)
            if not antwoord.get("elements"):
                leeg_van.add(server)
                if len(leeg_van) < min(2, len(lijst)):
                    _onbereikbaar.add(server)
                    raise RuntimeError(f"leeg antwoord ({opmerking or 'geen opmerking'}); "
                                       "controle bij een andere server")
            return antwoord
        except urllib.error.HTTPError as e:
            # 429 = te veel aanvragen, 504 = server druk: later en elders opnieuw.
            _onbereikbaar.add(server)
            laatste_fout = f"HTTP {e.code} van {server}"
        except urllib.error.URLError as e:
            # Geen verbinding (time-out bij verbinden, DNS): server even mijden.
            _onbereikbaar.add(server)
            laatste_fout = f"URLError: {e.reason} ({server})"
        except (TimeoutError, OSError, RuntimeError, json.JSONDecodeError) as e:
            laatste_fout = f"{type(e).__name__}: {e} ({server})"
        log(f"    poging {poging + 1} mislukt: {laatste_fout}; opnieuw over {wacht} s",
            file=sys.stderr)
        time.sleep(wacht)
        wacht = min(wacht * 2, 300)
    raise RuntimeError(f"Overpass onbereikbaar na {pogingen} pogingen: {laatste_fout}")


def gebied(landcode, area_id=None):
    """Overpass-regel die het land (of één regio ervan) als gebied .land vastlegt."""
    if area_id:
        return f"area(id:{area_id})->.land;"
    return f'area["ISO3166-1"="{landcode.upper()}"][admin_level=2]->.land;'


def landinstellingen(landcode):
    """Instellingen per land uit pipeline/budget.json ("landen" -> code)."""
    from pathlib import Path
    pad = Path(__file__).resolve().parent / "budget.json"
    with open(pad, encoding="utf-8") as f:
        return json.load(f).get("landen", {}).get(landcode.upper(), {})


def lees_land(landcode):
    """data/landen/<land>.json, of {} als het bestand (nog) niet bestaat."""
    from pathlib import Path
    pad = Path(__file__).resolve().parent.parent / "data" / "landen" / f"{landcode.lower()}.json"
    if not pad.exists():
        return {}
    with open(pad, encoding="utf-8") as f:
        return json.load(f)


def in_bbox(lat, lon, bbox):
    """bbox = [west, zuid, oost, noord]; None = alles."""
    if not bbox:
        return True
    return bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]


def regios(landcode, niveau="4", log=print):
    """Regio's (admin_level niveau) van een land als [{id, area, naam, code}].

    Alleen regio's met een ISO 3166-2-code van het land zelf (anders komen de
    buurregio's mee die een grens delen) en met hun middelpunt in de bbox van
    het land (zo vallen overzeese gebieden weg). Bewaard in pipeline/out.
    """
    from pathlib import Path
    uit = Path(__file__).resolve().parent / "out"
    cache = uit / f"{landcode.lower()}-regios-{niveau}.json"
    if cache.exists() and time.time() - cache.stat().st_mtime < 30 * 86400:
        with open(cache, encoding="utf-8") as f:
            return json.load(f)
    code = landcode.upper()
    q = (f"[out:json][timeout:300];\n{gebied(code)}\n"
         f'rel["boundary"="administrative"]["admin_level"="{niveau}"]'
         f'["ISO3166-2"~"^{code}-"](area.land);\nout tags center;')
    antwoord = vraag(q, log=log)
    bbox = lees_land(code).get("bbox")
    lijst = []
    for el in antwoord.get("elements", []):
        c = el.get("center") or {}
        if c and not in_bbox(c["lat"], c["lon"], bbox):
            continue
        tags = el.get("tags", {})
        lijst.append({"id": el["id"], "area": 3600000000 + el["id"],
                      "naam": tags.get("name"), "code": tags.get("ISO3166-2")})
    lijst.sort(key=lambda r: r["code"] or "")
    uit.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8") as f:
        json.dump(lijst, f, ensure_ascii=False, indent=1)
    return lijst


def gebieden(landcode, log=print):
    """De gebieden waarin een land opgehaald wordt: het hele land, of per regio.

    Per regio als budget.json voor het land "per_regio" (admin_level) zet.
    Geeft [(label, overpass-regel)].
    """
    niveau = landinstellingen(landcode).get("per_regio")
    if not niveau:
        return [(landcode.upper(), gebied(landcode))]
    return [(r["code"] or r["naam"], gebied(landcode, r["area"]))
            for r in regios(landcode, str(niveau), log=log)]


def haversine(lat1, lon1, lat2, lon2):
    """Afstand in meter tussen twee punten op de aarde."""
    r = 6371008.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def lijnlengte(geom):
    """Lengte in meter van een lijst punten [{'lat':..,'lon':..}, ...]."""
    return sum(haversine(a["lat"], a["lon"], b["lat"], b["lon"])
               for a, b in zip(geom, geom[1:]))


def punt_van(el):
    """Geeft (lat, lon) van een Overpass-element (node, of center/geom)."""
    if "lat" in el:
        return el["lat"], el["lon"]
    if "center" in el:
        return el["center"]["lat"], el["center"]["lon"]
    if "bounds" in el:
        b = el["bounds"]
        return (b["minlat"] + b["maxlat"]) / 2, (b["minlon"] + b["maxlon"]) / 2
    geom = el.get("geometry")
    if geom:
        geldig = [g for g in geom if g]
        return (sum(g["lat"] for g in geldig) / len(geldig),
                sum(g["lon"] for g in geldig) / len(geldig))
    return None


def osm_id(el):
    return f'{el["type"]}/{el["id"]}'


def rond(x, n=5):
    return round(x, n)


def naam_van(tags):
    for k in ("name", "name:nl", "name:fr", "name:de", "official_name", "tunnel:name"):
        if tags.get(k):
            return tags[k]
    return None


def adres_van(tags):
    """Straat + huisnummer + gemeente in één string, of None."""
    straat = tags.get("addr:street") or tags.get("addr:place")
    nummer = tags.get("addr:housenumber")
    gemeente = tags.get("addr:city") or tags.get("addr:municipality")
    eerste = " ".join(x for x in (straat, nummer) if x)
    delen = [x for x in (eerste, gemeente) if x]
    return ", ".join(delen) if delen else None


def ja_nee(waarde):
    if waarde is None:
        return None
    w = waarde.strip().lower()
    if w in ("yes", "true", "1"):
        return "ja"
    if w in ("no", "false", "0"):
        return "nee"
    return waarde


def compacte_json(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def feature(lat, lon, props):
    return {"type": "Feature",
            "geometry": {"type": "Point", "coordinates": [rond(lon), rond(lat)]},
            "properties": {k: v for k, v in props.items() if v not in (None, "")}}
