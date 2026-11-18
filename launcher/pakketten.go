// Pakketten ophalen (--pakketten): de website (planb72.org/download/) maakt een
// manifest met de gekozen bestanden. Het startprogramma haalt die op naar
// <site>/data/, hervat afgebroken downloads met Range-aanvragen en controleert
// grootte en sha256. Alleen https-bronnen van planb72.org (of expliciet
// toegestane spiegels) en alleen paden binnen data/.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	manifestFormaat   = "planb72-pakketten"
	manifestVersie    = 1
	maxManifestBytes  = 16 << 20
	deelAchtervoegsel = ".deel"
	pakkettenNaam     = "pakketten.json"
	standaardBron     = "planb72.org"
	stilteLimiet      = 60 * time.Second
	meldInterval      = 250 * time.Millisecond
)

type pakketManifest struct {
	Formaat   string          `json:"formaat"`
	Versie    int             `json:"versie"`
	Gemaakt   string          `json:"gemaakt"`
	Bron      string          `json:"bron"`
	Keuze     string          `json:"keuze"`
	Blokken   []string        `json:"blokken"`
	Bytes     int64           `json:"bytes"`
	Bestanden []pakketBestand `json:"bestanden"`
}

type pakketBestand struct {
	Pad    string  `json:"pad"`
	URL    string  `json:"url"`
	Bytes  int64   `json:"bytes"`
	SHA256 *string `json:"sha256"`
}

// samenvatting telt de uitkomsten van één ophaalronde.
type samenvatting struct {
	Gelukt, Overgeslagen, Mislukt int
	Fouten                        []string
}

var errStilte = errors.New("geen gegevens meer ontvangen / no data received")

// voerPakkettenUit is de stap uit run(): ophalen, en dan zeggen of het
// programma moet stoppen (met welke code) of gewoon de server mag starten.
func voerPakkettenUit(manifestPad, siteMap string, bronnen bronLijst, alleenOphalen bool, stdin *os.File, uit, fout *os.File) (code int, stoppen bool) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	sam, err := haalPakketten(ctx, manifestPad, siteMap, bronnen, uit)
	if ctx.Err() != nil {
		fmt.Fprintln(uit, "\nAfgebroken / Aborted. Wat binnen is blijft in .deel-bestanden staan; start opnieuw om te hervatten.")
		return 1, true
	}
	if err != nil {
		return fataal(stdin, fout, err), true
	}
	if alleenOphalen {
		if sam.Mislukt > 0 {
			return 1, true
		}
		return 0, true
	}
	fmt.Fprintln(uit)
	return 0, false
}

// leesManifest leest en controleert een manifest; geeft ook de ruwe inhoud
// terug zodat die ongewijzigd naar data/pakketten.json kan.
func leesManifest(p string) (*pakketManifest, []byte, error) {
	f, err := os.Open(p)
	if err != nil {
		return nil, nil, fmt.Errorf("kan het manifest niet openen: %v", err)
	}
	defer f.Close()
	ruw, err := io.ReadAll(io.LimitReader(f, maxManifestBytes+1))
	if err != nil {
		return nil, nil, fmt.Errorf("kan het manifest niet lezen: %v", err)
	}
	if len(ruw) > maxManifestBytes {
		return nil, nil, fmt.Errorf("het manifest %s is te groot (meer dan %d MB)", p, maxManifestBytes>>20)
	}
	var m pakketManifest
	if err := json.Unmarshal(ruw, &m); err != nil {
		return nil, nil, fmt.Errorf("%s is geen geldig JSON-manifest: %v", p, err)
	}
	if m.Formaat != manifestFormaat {
		return nil, nil, fmt.Errorf("%s is geen PlanB72-pakketmanifest (formaat %q, verwacht %q)", p, m.Formaat, manifestFormaat)
	}
	if m.Versie < 1 {
		return nil, nil, fmt.Errorf("%s heeft een ongeldige versie (%d)", p, m.Versie)
	}
	if m.Versie > manifestVersie {
		return nil, nil, fmt.Errorf("manifestversie %d is nieuwer dan dit startprogramma kent (max %d).\n"+
			"Haal een nieuwere versie van het startprogramma op via planb72.org/download/", m.Versie, manifestVersie)
	}
	if len(m.Bestanden) == 0 {
		return nil, nil, fmt.Errorf("het manifest %s bevat geen bestanden", p)
	}
	return &m, ruw, nil
}

// dataPad controleert een pad uit het manifest en geeft het deel binnen data/
// terug (met schuine strepen). Alleen genormaliseerde, relatieve paden onder
// data/ mogen; geen .., geen absolute paden, geen backslashes of stationsletters.
func dataPad(p string) (string, error) {
	switch {
	case p == "":
		return "", errors.New("leeg pad")
	case strings.ContainsAny(p, "\\:\x00"):
		return "", fmt.Errorf("pad %q bevat een ongeldig teken (\\ of :)", p)
	case path.IsAbs(p) || filepath.IsAbs(p) || filepath.VolumeName(p) != "":
		return "", fmt.Errorf("pad %q is absoluut; alleen paden binnen data/ mogen", p)
	case path.Clean(p) != p:
		return "", fmt.Errorf("pad %q is niet genormaliseerd (.., ./ of //)", p)
	}
	rest, ok := strings.CutPrefix(p, "data/")
	if !ok || rest == "" {
		return "", fmt.Errorf("pad %q ligt niet binnen data/", p)
	}
	for _, deel := range strings.Split(rest, "/") {
		if strings.HasPrefix(deel, ".") {
			return "", fmt.Errorf("pad %q bevat een verborgen deel of ..", p)
		}
	}
	if !filepath.IsLocal(filepath.FromSlash(rest)) {
		return "", fmt.Errorf("pad %q is niet lokaal binnen data/", p)
	}
	if strings.HasSuffix(rest, deelAchtervoegsel) || rest == pakkettenNaam {
		return "", fmt.Errorf("pad %q is gereserveerd voor het startprogramma", p)
	}
	return rest, nil
}

// bronLijst bevat extra toegestane bronnen (--bron-toestaan), genormaliseerd
// als "schema://host[:poort]". Herhaalbaar en komma-gescheiden.
type bronLijst []string

func (b *bronLijst) String() string { return strings.Join(*b, ",") }

func (b *bronLijst) Set(s string) error {
	for _, d := range strings.Split(s, ",") {
		d = strings.TrimSpace(d)
		if d == "" {
			continue
		}
		if !strings.Contains(d, "://") {
			d = "https://" + d
		}
		u, err := url.Parse(d)
		if err != nil || u.Host == "" || u.User != nil || strings.Trim(u.Path, "/") != "" || u.RawQuery != "" {
			return fmt.Errorf("ongeldige bron %q (gebruik een host, bv. spiegel.example.org)", d)
		}
		schema := strings.ToLower(u.Scheme)
		switch schema {
		case "https":
		case "http":
			if !lokaleHost(u.Hostname()) {
				return fmt.Errorf("bron %q: http mag alleen voor 127.0.0.1/localhost (tests); gebruik https", d)
			}
		default:
			return fmt.Errorf("bron %q: alleen https (of http voor 127.0.0.1)", d)
		}
		*b = append(*b, schema+"://"+strings.ToLower(u.Host))
	}
	return nil
}

// bronToegestaan: https op planb72.org of een subdomein, of een expliciet
// toegestane bron. Een toegestane bron zonder poort geldt voor elke poort.
func bronToegestaan(u *url.URL, extra []string) bool {
	if u == nil || u.Host == "" || u.User != nil {
		return false
	}
	schema := strings.ToLower(u.Scheme)
	host := strings.ToLower(u.Host)
	naam := strings.ToLower(u.Hostname())
	if schema == "https" && (naam == standaardBron || strings.HasSuffix(naam, "."+standaardBron)) {
		return true
	}
	for _, e := range extra {
		eu, err := url.Parse(e)
		if err != nil || eu.Scheme != schema {
			continue
		}
		if eu.Port() != "" {
			if eu.Host == host {
				return true
			}
		} else if eu.Hostname() == naam {
			return true
		}
	}
	return false
}

// ophaler haalt de bestanden van één manifest op.
type ophaler struct {
	client *http.Client
	root   *os.Root // <site>/data
	extra  []string
	uit    io.Writer
	totaal int64 // bytes van alle bestanden
	binnen int64 // bytes van afgeronde (of overgeslagen) bestanden
}

func nieuweClient(extra []string) *http.Client {
	tr := http.DefaultTransport.(*http.Transport).Clone()
	tr.ResponseHeaderTimeout = 30 * time.Second
	return &http.Client{
		Transport: tr,
		// Bewust geen Timeout: grote bestanden; stilstand vangt stilLezer op.
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return errors.New("te veel doorverwijzingen / too many redirects")
			}
			if !bronToegestaan(req.URL, extra) {
				return fmt.Errorf("doorverwijzing naar niet-toegestane bron %s", req.URL.Redacted())
			}
			return nil
		},
	}
}

// haalPakketten haalt alle bestanden uit het manifest op naar <siteMap>/data.
// Een fout in het manifest zelf is fataal; fouten per bestand komen in de
// samenvatting en het ophalen gaat door met het volgende bestand.
func haalPakketten(ctx context.Context, manifestPad, siteMap string, extra []string, uit io.Writer) (samenvatting, error) {
	var sam samenvatting
	m, ruw, err := leesManifest(manifestPad)
	if err != nil {
		return sam, err
	}
	dataMap := filepath.Join(siteMap, "data")
	if err := os.MkdirAll(dataMap, 0o755); err != nil {
		return sam, fmt.Errorf("kan de map %s niet maken: %v", dataMap, err)
	}
	root, err := os.OpenRoot(dataMap)
	if err != nil {
		return sam, fmt.Errorf("kan de map %s niet openen: %v", dataMap, err)
	}
	defer root.Close()

	o := &ophaler{client: nieuweClient(extra), root: root, extra: extra, uit: uit}
	for _, b := range m.Bestanden {
		if b.Bytes > 0 {
			o.totaal += b.Bytes
		}
	}
	fmt.Fprintf(uit, "Pakketten ophalen / Downloading packages: %d bestanden / files, %s MB\nNaar / To: %s\n\n",
		len(m.Bestanden), mb(o.totaal), dataMap)

	for i, b := range m.Bestanden {
		if ctx.Err() != nil {
			break
		}
		label := fmt.Sprintf("[%d/%d] %s", i+1, len(m.Bestanden), b.Pad)
		uitslag, err := o.haalBestand(ctx, label, b)
		switch {
		case ctx.Err() != nil:
			// Afgebroken met Ctrl+C: niet als mislukt tellen.
		case err != nil:
			sam.Mislukt++
			sam.Fouten = append(sam.Fouten, fmt.Sprintf("%s: %v", b.Pad, err))
			fmt.Fprintf(uit, "  MISLUKT / FAILED: %v\n", err)
		case uitslag == overgeslagen:
			sam.Overgeslagen++
		default:
			sam.Gelukt++
		}
	}
	if ctx.Err() != nil {
		return sam, ctx.Err()
	}

	if err := schrijfAtomair(root, pakkettenNaam, ruw); err != nil {
		sam.Mislukt++
		sam.Fouten = append(sam.Fouten, fmt.Sprintf("data/%s: %v", pakkettenNaam, err))
	}

	fmt.Fprintf(uit, "\nKlaar / Done: %d gelukt / done, %d overgeslagen / skipped, %d mislukt / failed\n",
		sam.Gelukt, sam.Overgeslagen, sam.Mislukt)
	for _, f := range sam.Fouten {
		fmt.Fprintf(uit, "  - %s\n", f)
	}
	if sam.Mislukt > 0 {
		fmt.Fprintln(uit, "Start opnieuw met hetzelfde manifest om het nog eens te proberen / Run again to retry.")
	}
	return sam, nil
}

type uitslag int

const (
	gelukt uitslag = iota
	overgeslagen
	mislukt
)

func (o *ophaler) haalBestand(ctx context.Context, label string, b pakketBestand) (uitslag, error) {
	fmt.Fprintf(o.uit, "%s (%s MB)\n", label, mb(b.Bytes))
	rest, err := dataPad(b.Pad)
	if err != nil {
		return mislukt, err
	}
	u, err := url.Parse(b.URL)
	if err != nil {
		return mislukt, fmt.Errorf("ongeldige url %q", b.URL)
	}
	if !bronToegestaan(u, o.extra) {
		return mislukt, fmt.Errorf("bron niet toegestaan: %s (alleen https://planb72.org; vertrouw je deze bron, gebruik --bron-toestaan %s)",
			u.Redacted(), u.Host)
	}
	if b.Bytes < 0 {
		return mislukt, fmt.Errorf("ongeldige grootte %d", b.Bytes)
	}
	var hash string
	if b.SHA256 != nil {
		hash = strings.ToLower(strings.TrimSpace(*b.SHA256))
		if d, err := hex.DecodeString(hash); err != nil || len(d) != sha256.Size {
			return mislukt, fmt.Errorf("ongeldige sha256 %q", *b.SHA256)
		}
	}

	naam := filepath.FromSlash(rest)
	deel := naam + deelAchtervoegsel
	if dir := filepath.Dir(naam); dir != "." {
		if err := o.root.MkdirAll(dir, 0o755); err != nil {
			return mislukt, err
		}
	}
	if o.klopt(naam, b.Bytes, hash) {
		o.binnen += b.Bytes
		fmt.Fprintln(o.uit, "  al aanwezig, overgeslagen / already present, skipped")
		return overgeslagen, nil
	}

	t := &teller{o: o, grootte: b.Bytes}
	if err := o.download(ctx, u, deel, b.Bytes, t); err != nil {
		t.einde()
		if st, serr := o.root.Stat(deel); serr == nil && st.Size() == 0 {
			_ = o.root.Remove(deel) // niets binnen: geen leeg deel laten staan
		}
		return mislukt, err // .deel blijft staan voor hervatten
	}
	t.einde()
	if err := o.controleer(deel, b.Bytes, hash); err != nil {
		_ = o.root.Remove(deel)
		return mislukt, err
	}
	if err := o.root.Rename(deel, naam); err != nil {
		return mislukt, fmt.Errorf("kan %s niet hernoemen: %v", deel, err)
	}
	o.binnen += b.Bytes
	fmt.Fprintln(o.uit, "  gelukt / done")
	return gelukt, nil
}

// klopt: bestaat het bestand al met de juiste grootte (en sha256)?
func (o *ophaler) klopt(naam string, grootte int64, hash string) bool {
	return o.controleer(naam, grootte, hash) == nil
}

func (o *ophaler) controleer(naam string, grootte int64, hash string) error {
	st, err := o.root.Stat(naam)
	if err != nil {
		return err
	}
	if !st.Mode().IsRegular() {
		return fmt.Errorf("%s is geen gewoon bestand", naam)
	}
	if st.Size() != grootte {
		return fmt.Errorf("grootte klopt niet: %d bytes, verwacht %d", st.Size(), grootte)
	}
	if hash == "" {
		return nil
	}
	f, err := o.root.Open(naam)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	if got := hex.EncodeToString(h.Sum(nil)); got != hash {
		return fmt.Errorf("sha256 klopt niet (bestand beschadigd of gewijzigd): %s, verwacht %s", got, hash)
	}
	return nil
}

// download vult <deel> aan tot de verwachte grootte, met een Range-aanvraag
// als er al iets binnen is. De controle gebeurt daarna door de aanroeper.
func (o *ophaler) download(ctx context.Context, u *url.URL, deel string, verwacht int64, t *teller) error {
	f, err := o.root.OpenFile(deel, os.O_RDWR|os.O_CREATE, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return err
	}
	n := st.Size()
	if n > verwacht {
		if err := f.Truncate(0); err != nil {
			return err
		}
		n = 0
	}
	if n > 0 && n == verwacht {
		return nil // alles al binnen; alleen nog controleren
	}

	ctx, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	timer := time.AfterFunc(stilteLimiet, func() { cancel(errStilte) })
	defer timer.Stop()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "planb72-start")
	if n > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", n))
	}
	resp, err := o.client.Do(req)
	if err != nil {
		return stilteFout(ctx, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusPartialContent:
		if start, ok := rangeStart(resp.Header.Get("Content-Range")); !ok || start != n {
			_ = f.Truncate(0) // volgende keer van voren af aan
			return fmt.Errorf("server stuurde een ander stuk dan gevraagd (%q)", resp.Header.Get("Content-Range"))
		}
		if n > 0 {
			fmt.Fprintf(o.uit, "  hervat vanaf / resuming at %s MB\n", mb(n))
		}
	case http.StatusOK:
		if err := f.Truncate(0); err != nil {
			return err
		}
		n = 0
	case http.StatusRequestedRangeNotSatisfiable:
		return nil // het deel opnieuw controleren
	default:
		return fmt.Errorf("server antwoordde %s", resp.Status)
	}
	if _, err := f.Seek(n, io.SeekStart); err != nil {
		return err
	}

	t.klaar = n
	t.toon()
	lezer := &stilLezer{r: resp.Body, timer: timer}
	// Hoogstens één byte meer dan verwacht lezen: te groot valt zo bij de controle op.
	if _, err := io.Copy(io.MultiWriter(f, t), io.LimitReader(lezer, verwacht-n+1)); err != nil {
		return stilteFout(ctx, err)
	}
	return f.Sync()
}

func stilteFout(ctx context.Context, err error) error {
	if errors.Is(context.Cause(ctx), errStilte) {
		return fmt.Errorf("%w in %s", errStilte, stilteLimiet)
	}
	return err
}

// rangeStart leest het beginpunt uit "bytes <start>-<eind>/<totaal>".
func rangeStart(cr string) (int64, bool) {
	rest, ok := strings.CutPrefix(cr, "bytes ")
	if !ok {
		return 0, false
	}
	i := strings.IndexByte(rest, '-')
	if i < 0 {
		return 0, false
	}
	n, err := strconv.ParseInt(rest[:i], 10, 64)
	return n, err == nil
}

// stilLezer zet de stiltetimer terug bij elke ontvangen byte.
type stilLezer struct {
	r     io.Reader
	timer *time.Timer
}

func (s *stilLezer) Read(p []byte) (int, error) {
	n, err := s.r.Read(p)
	if n > 0 {
		s.timer.Reset(stilteLimiet)
	}
	return n, err
}

// teller toont de voortgang van het huidige bestand en het totaal.
type teller struct {
	o              *ophaler
	klaar, grootte int64
	laatst         time.Time
	getoond        bool
}

func (t *teller) Write(p []byte) (int, error) {
	t.klaar += int64(len(p))
	if time.Since(t.laatst) >= meldInterval {
		t.toon()
	}
	return len(p), nil
}

func (t *teller) toon() {
	t.laatst = time.Now()
	t.getoond = true
	fmt.Fprintf(t.o.uit, "\r  %s / %s MB   totaal / total %s / %s MB   ",
		mb(t.klaar), mb(t.grootte), mb(t.o.binnen+t.klaar), mb(t.o.totaal))
}

func (t *teller) einde() {
	if t.getoond {
		t.toon()
		fmt.Fprintln(t.o.uit)
	}
}

func mb(n int64) string {
	return strconv.FormatFloat(float64(n)/1048576, 'f', 1, 64)
}

// schrijfAtomair schrijft via een tijdelijk bestand en hernoemt daarna.
func schrijfAtomair(root *os.Root, naam string, inhoud []byte) error {
	tmp := naam + deelAchtervoegsel
	if err := root.WriteFile(tmp, inhoud, 0o644); err != nil {
		return err
	}
	if err := root.Rename(tmp, naam); err != nil {
		_ = root.Remove(tmp)
		return err
	}
	return nil
}
