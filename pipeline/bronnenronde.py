#!/usr/bin/env python3
"""De nachtelijke bronnenronde: controleert elke bron uit het bronnenregister.

Voor elke bron in data/bronnen/register.json:
  1. robots.txt van de site respecteren (urllib.robotparser);
  2. maximaal één controle per bron per dag;
  3. voorwaardelijke GET met If-None-Match / If-Modified-Since uit de vorige status;
  4. vingerafdruk (sha256):
       - HTML: zichtbare tekst zonder tags, scripts, stijlen, menu's, kop- en voettekst,
         met genormaliseerde witruimte (een nieuw menu geeft geen vals alarm);
       - ZIM-catalogus (OPDS): alleen de lijst van downloadbare bestanden;
       - al het andere (pdf, json, ...): de bytes zelf;
  5. licentie: bevatte de pagina eerder de tekst uit `licentie_kenmerk` en nu niet
     meer, dan krijgt de bron licentie_gewijzigd = true.

Schrijft data/bronnen/status.json en drukt een samenvatting af. Geeft altijd
foutcode 0: de workflow maakt zelf issues op basis van status.json
(of van het bestand dat je met --meldingen opgeeft).

Gebruik:
    python3 pipeline/bronnenronde.py
    python3 pipeline/bronnenronde.py --alleen crisiscentrum be-alert
    python3 pipeline/bronnenronde.py --forceer        # ook als vandaag al gecontroleerd
    python3 pipeline/bronnenronde.py --meldingen pipeline/out/meldingen.json
"""

import argparse
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "data" / "bronnen" / "register.json"
STATUS = ROOT / "data" / "bronnen" / "status.json"
USER_AGENT = "PlanB72-build/0.1 (+https://planb72.org)"
TIMEOUT = 45
MAX_BYTES = 60 * 1024 * 1024  # grotere bestanden niet volledig binnenhalen
DREMPEL_ONBEREIKBAAR = 3

OVERSLAAN = {"script", "style", "nav", "header", "footer", "noscript", "svg",
             "template", "iframe", "form", "button", "select"}
LEEG = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr"}


class Tekst(HTMLParser):
    """Haalt de zichtbare lopende tekst uit HTML, zonder menu's en scripts."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.diepte = 0
        self.stukken = []

    def handle_starttag(self, tag, attrs):
        if tag in LEEG:
            return
        rol = dict(attrs).get("role", "")
        if self.diepte or tag in OVERSLAAN or rol in ("navigation", "banner", "contentinfo"):
            self.diepte += 1

    def handle_endtag(self, tag):
        if tag in LEEG:
            return
        if self.diepte:
            self.diepte -= 1

    def handle_data(self, data):
        if not self.diepte:
            self.stukken.append(data)


def html_naar_tekst(inhoud, charset):
    try:
        bron = inhoud.decode(charset or "utf-8", errors="replace")
    except LookupError:
        bron = inhoud.decode("utf-8", errors="replace")
    p = Tekst()
    try:
        p.feed(bron)
        p.close()
        tekst = " ".join(p.stukken)
    except Exception:  # noqa: BLE001  (kapotte HTML: grof alle tags weg)
        tekst = re.sub(r"<[^>]+>", " ", bron)
    tekst = html.unescape(tekst)
    return re.sub(r"\s+", " ", tekst).strip()


def vingerafdruk(bron, inhoud, content_type):
    """Geeft (sha256, tekst-of-None)."""
    ct = (content_type or "").lower()
    charset = None
    m = re.search(r"charset=([\w-]+)", ct)
    if m:
        charset = m.group(1)
    if bron.get("soort") == "zim" or "opds" in ct:
        tekst = inhoud.decode("utf-8", errors="replace")
        bestanden = sorted(set(re.findall(r'href="([^"]+\.zim[^"]*)"', tekst)))
        return hashlib.sha256("\n".join(bestanden).encode()).hexdigest(), tekst
    if "html" in ct:
        tekst = html_naar_tekst(inhoud, charset)
        return hashlib.sha256(tekst.encode("utf-8")).hexdigest(), tekst
    tekst = None
    if ct.startswith("text/") or "json" in ct or "xml" in ct:
        tekst = inhoud.decode(charset or "utf-8", errors="replace")
    return hashlib.sha256(inhoud).hexdigest(), tekst


class Doorsturen(urllib.request.HTTPRedirectHandler):
    """Python 3.9 volgt 308 (permanent doorgestuurd) nog niet; behandel het als 301."""

    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_301(req, fp, code, msg, headers)

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if code == 308:
            code = 301
        return super().redirect_request(req, fp, code, msg, headers, newurl)


urllib.request.install_opener(urllib.request.build_opener(Doorsturen()))


# ---------------------------------------------------------------- robots.txt

_robots = {}


def mag_ophalen(url):
    """Volgt robots.txt; haalt het zelf op met onze User-Agent.

    Geeft True/False, of een foutmelding (str) als de host niet bereikbaar is.
    """
    deel = urllib.parse.urlsplit(url)
    host = f"{deel.scheme}://{deel.netloc}"
    if host not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            req = urllib.request.Request(host + "/robots.txt",
                                         headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as r:
                rp.parse(r.read(512 * 1024).decode("utf-8", errors="replace").splitlines())
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                rp.disallow_all = True  # conventie: afgeschermd = niet ophalen
            else:
                rp.allow_all = True  # 404 en dergelijke: geen regels
        except urllib.error.URLError as e:
            # Geen verbinding met de host: meteen als onbereikbaar melden, geen tweede wachttijd.
            _robots[host] = f"URLError: {e.reason}"
            return _robots[host]
        except Exception:  # noqa: BLE001  (bv. kapotte robots.txt: geen regels)
            rp.allow_all = True
        _robots[host] = rp
    if isinstance(_robots[host], str):
        return _robots[host]
    return _robots[host].can_fetch(USER_AGENT, url)


# ---------------------------------------------------------------- controle

def controleer(bron, vorig, nu):
    url = bron["url"]
    st = dict(vorig)
    st["url"] = url
    st["laatst_gecontroleerd"] = nu
    st.pop("fout", None)
    st["gewijzigd_vandaag"] = False

    toegelaten = mag_ophalen(url)
    if isinstance(toegelaten, str):
        return onbereikbaar(st, None, toegelaten)
    if not toegelaten:
        st.update(http_status=None, bereikbaar=None, robots_verboden=True)
        return st, "robots"
    st.pop("robots_verboden", None)

    headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "identity"}
    # Alleen voorwaardelijk vragen als we een vingerafdruk hebben om op terug te vallen,
    # en als het licentiekenmerk in het register niet veranderde.
    if vorig.get("vingerafdruk") and vorig.get("licentie_kenmerk") == bron.get("licentie_kenmerk"):
        if vorig.get("etag"):
            headers["If-None-Match"] = vorig["etag"]
        if vorig.get("last_modified"):
            headers["If-Modified-Since"] = vorig["last_modified"]
    req = urllib.request.Request(url, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            inhoud = r.read(MAX_BYTES)
            status = r.status
            st["etag"] = r.headers.get("ETag")
            st["last_modified"] = r.headers.get("Last-Modified")
            content_type = r.headers.get("Content-Type", "")
            st["url_eind"] = r.geturl() if r.geturl() != url else None
    except urllib.error.HTTPError as e:
        if e.code == 304:
            st.update(http_status=304, bereikbaar=True, dagen_onbereikbaar=0,
                      onbereikbaar_sinds=None, seconden=round(time.time() - t0, 2))
            return st, "ongewijzigd"
        return onbereikbaar(st, e.code, f"HTTP {e.code}")
    except Exception as e:  # noqa: BLE001
        return onbereikbaar(st, None, f"{type(e).__name__}: {getattr(e, 'reason', e)}")

    st.update(http_status=status, bereikbaar=True, dagen_onbereikbaar=0,
              onbereikbaar_sinds=None, seconden=round(time.time() - t0, 2), bytes=len(inhoud),
              content_type=content_type.split(";")[0] or None)
    vinger, tekst = vingerafdruk(bron, inhoud, content_type)

    kenmerk = bron.get("licentie_kenmerk")
    if kenmerk != vorig.get("licentie_kenmerk"):
        # Nieuw of ander kenmerk: opnieuw beginnen met waarnemen.
        for k in ("licentie_kenmerk_gezien", "licentie_gewijzigd", "licentie_kenmerk_aanwezig"):
            st.pop(k, None)
    st["licentie_kenmerk"] = kenmerk
    if kenmerk:
        if tekst is None:
            st["licentie_kenmerk_aanwezig"] = None
        else:
            aanwezig = kenmerk.lower() in tekst.lower()
            st["licentie_kenmerk_aanwezig"] = aanwezig
            if aanwezig:
                st["licentie_kenmerk_gezien"] = True
            st["licentie_gewijzigd"] = bool(st.get("licentie_kenmerk_gezien") and not aanwezig)

    uitkomst = "ongewijzigd"
    if vorig.get("vingerafdruk") != vinger:
        uitkomst = "nieuw" if not vorig.get("vingerafdruk") else "gewijzigd"
        st["vingerafdruk"] = vinger
        st["laatst_gewijzigd"] = nu
        st["gewijzigd_vandaag"] = uitkomst == "gewijzigd"
    return st, uitkomst


def onbereikbaar(st, code, fout):
    """Telt kalenderdagen sinds de eerste mislukte controle (niet het aantal pogingen)."""
    vandaag = st["laatst_gecontroleerd"][:10]
    sinds = st.get("onbereikbaar_sinds") or vandaag
    dagen = (dt.date.fromisoformat(vandaag) - dt.date.fromisoformat(sinds)).days + 1
    st.update(http_status=code, bereikbaar=False, fout=fout,
              onbereikbaar_sinds=sinds, dagen_onbereikbaar=dagen)
    return st, "onbereikbaar"


def main():
    p = argparse.ArgumentParser(description="Nachtelijke bronnenronde.")
    p.add_argument("--alleen", nargs="+", help="alleen deze bron-id's")
    p.add_argument("--forceer", action="store_true",
                   help="ook bronnen die vandaag al gecontroleerd zijn")
    p.add_argument("--meldingen", help="schrijf hier een JSON-lijst van issues die nodig zijn")
    args = p.parse_args()

    with open(REGISTER, encoding="utf-8") as f:
        register = json.load(f)
    status = {"bronnen": {}}
    if STATUS.exists():
        with open(STATUS, encoding="utf-8") as f:
            status = json.load(f)
    oud = status.get("bronnen", {})

    nu_dt = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    nu = nu_dt.isoformat()
    vandaag = nu_dt.date().isoformat()
    tellers = {}
    gewijzigd, licentie, langdurig, fouten = [], [], [], []

    for bron in register:
        bid = bron["id"]
        if args.alleen and bid not in args.alleen:
            continue
        vorig = oud.get(bid, {})
        if (not args.forceer and vorig.get("laatst_gecontroleerd", "")[:10] == vandaag):
            tellers["al gecontroleerd"] = tellers.get("al gecontroleerd", 0) + 1
            st, uitkomst = vorig, None
        else:
            st, uitkomst = controleer(bron, vorig, nu)
            tellers[uitkomst] = tellers.get(uitkomst, 0) + 1
            print(f"  {uitkomst:12s} {st.get('http_status') or '-':>4}  {bid}"
                  + (f"  ({st['fout']})" if st.get("fout") else ""), flush=True)
        status["bronnen"][bid] = st
        if uitkomst == "gewijzigd":
            gewijzigd.append(bid)
        if uitkomst == "onbereikbaar":
            fouten.append(bid)
        if st.get("licentie_gewijzigd"):
            licentie.append(bid)
        if (st.get("dagen_onbereikbaar") or 0) >= DREMPEL_ONBEREIKBAAR:
            langdurig.append(bid)

    # Bronnen die uit het register verdwenen, niet meer bijhouden.
    ids = {b["id"] for b in register}
    status["bronnen"] = {k: v for k, v in sorted(status["bronnen"].items()) if k in ids}
    status["bijgewerkt"] = nu
    status["register"] = str(REGISTER.relative_to(ROOT))
    with open(STATUS, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)
        f.write("\n")

    per_id = {b["id"]: b for b in register}
    meldingen = []
    for bid in langdurig:
        st = status["bronnen"][bid]
        meldingen.append({
            "bron": bid, "reden": "onbereikbaar",
            "titel": f"Bron onbereikbaar: {per_id[bid]['naam']} ({bid})",
            "tekst": (f"De bron `{bid}` is {st['dagen_onbereikbaar']} dagen na elkaar "
                      f"onbereikbaar.\n\n- url: {per_id[bid]['url']}\n- laatste fout: "
                      f"{st.get('fout')}\n- route: {per_id[bid]['route']}\n- gebruikt in: "
                      f"{', '.join(per_id[bid]['gebruikt_in'])}\n\nGa na of de bron verhuisd "
                      "is en werk het register (en de landdata) bij.")})
    for bid in licentie:
        meldingen.append({
            "bron": bid, "reden": "licentie",
            "titel": f"Licentie mogelijk gewijzigd: {per_id[bid]['naam']} ({bid})",
            "tekst": (f"De tekst `{per_id[bid].get('licentie_kenmerk')}` staat niet meer op "
                      f"{per_id[bid]['url']}.\n\nVolgens het plan gaat deze bron terug naar "
                      "'na te zien' en verdwijnt ze uit de volgende openbare build tot iemand "
                      "de licentie heeft nagekeken.")})
    if args.meldingen:
        Path(args.meldingen).parent.mkdir(parents=True, exist_ok=True)
        with open(args.meldingen, "w", encoding="utf-8") as f:
            json.dump(meldingen, f, ensure_ascii=False, indent=2)

    regels = [f"Bronnenronde {nu}: {len(status['bronnen'])} bronnen in de status.",
              "  " + ", ".join(f"{k}: {v}" for k, v in sorted(tellers.items()))]
    if gewijzigd:
        regels.append("Gewijzigd: " + ", ".join(gewijzigd))
    if fouten:
        regels.append("Vandaag onbereikbaar: " + ", ".join(
            f"{b} ({status['bronnen'][b].get('fout')})" for b in fouten))
    if langdurig:
        regels.append(f"Al {DREMPEL_ONBEREIKBAAR}+ dagen onbereikbaar: " + ", ".join(langdurig))
    if licentie:
        regels.append("Licentie mogelijk gewijzigd: " + ", ".join(licentie))
    print("\n".join(regels))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("## Bronnenronde\n\n" + "\n\n".join(regels) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
