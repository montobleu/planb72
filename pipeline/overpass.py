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


def gebied(landcode):
    """Overpass-regel die het land als gebied .land vastlegt."""
    return f'area["ISO3166-1"="{landcode.upper()}"][admin_level=2]->.land;'


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
