// PlanB72 startprogramma: een minuscule lokale webserver die de site van de
// offline noodbibliotheek serveert. Browsers mogen grote kaartbestanden
// (PMTiles) niet rechtstreeks van schijf lezen; via http://127.0.0.1 wel,
// inclusief Range-aanvragen. Alleen de standaardbibliotheek, geen installatie,
// geen beheerdersrechten.
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	standaardPoort   = 7272
	maxPoortPogingen = 100
)

// Extra MIME-types, zodat het resultaat niet afhangt van het besturingssysteem
// (Windows leest ze anders uit het register).
var mimeTypes = map[string]string{
	".pmtiles":     "application/octet-stream",
	".webmanifest": "application/manifest+json",
	".js":          "text/javascript; charset=utf-8",
	".mjs":         "text/javascript; charset=utf-8",
	".wasm":        "application/wasm",
	".json":        "application/json",
	".geojson":     "application/geo+json",
	".svg":         "image/svg+xml",
	".avif":        "image/avif",
	".html":        "text/html; charset=utf-8",
	".css":         "text/css; charset=utf-8",
}

func init() {
	for ext, t := range mimeTypes {
		_ = mime.AddExtensionType(ext, t)
	}
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr))
}

func run(args []string, stdin *os.File, uit, fout *os.File) int {
	fl := flag.NewFlagSet("planb72-start", flag.ContinueOnError)
	fl.SetOutput(fout)
	mapFlag := fl.String("map", "", "map met de site (standaard: map 'planb72' of 'site' naast dit programma)")
	poort := fl.Int("poort", standaardPoort, "poort om op te luisteren; bij een bezette poort de volgende vrije")
	hotspot := fl.Bool("hotspot", false, "luister op alle netwerkinterfaces zodat anderen in de buurt kunnen meelezen")
	geenBrowser := fl.Bool("geen-browser", false, "open de browser niet automatisch")
	fl.Usage = func() {
		fmt.Fprint(fout, `PlanB72 startprogramma / launcher

Start een lokale webserver voor de PlanB72-site en opent de browser.
Starts a local web server for the PlanB72 site and opens your browser.

Gebruik / Usage: planb72-start [opties]

`)
		fl.PrintDefaults()
		fmt.Fprint(fout, `
Voorbeeld / Example:
  planb72-start --hotspot          (anderen op hetzelfde wifi/hotspot lezen mee)
  planb72-start --map D:\planb72 --geen-browser
`)
	}
	if err := fl.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return 0
		}
		return 2
	}
	if *poort < 1 || *poort > 65535 {
		return fataal(stdin, fout, fmt.Errorf("ongeldige poort %d (kies 1-65535)", *poort))
	}

	exe, err := exePad()
	if err != nil && *mapFlag == "" {
		return fataal(stdin, fout, fmt.Errorf("kan de locatie van dit programma niet bepalen: %v\nGebruik --map <map met de site>", err))
	}
	siteMap, err := zoekMap(*mapFlag, exe)
	if err != nil {
		return fataal(stdin, fout, err)
	}

	host := "127.0.0.1"
	if *hotspot {
		host = "0.0.0.0"
	}
	ln, gekozen, err := luisterVanaf(host, *poort)
	if err != nil {
		return fataal(stdin, fout, fmt.Errorf("kan geen poort openen: %v", err))
	}
	if gekozen != *poort {
		fmt.Fprintf(uit, "Poort %d is bezet, gebruik poort %d.\n", *poort, gekozen)
	}

	srv := &http.Server{
		Handler:           nieuweHandler(siteMap, !*hotspot),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
		// Bewust geen WriteTimeout: kaartbestanden kunnen groot zijn.
	}

	url := fmt.Sprintf("http://127.0.0.1:%d", gekozen)
	fmt.Fprintf(uit, "PlanB72 draait op %s — sluit dit venster om te stoppen.\n", url)
	fmt.Fprintf(uit, "Site: %s\n", siteMap)
	if *hotspot {
		adressen := lanAdressen()
		if len(adressen) == 0 {
			fmt.Fprintln(uit, "Hotspot-modus, maar geen netwerkadres gevonden. Zet eerst wifi of de hotspot aan.")
		} else {
			fmt.Fprintln(uit, "Anderen in de buurt kunnen meelezen via:")
			for _, a := range adressen {
				fmt.Fprintf(uit, "  http://%s:%d\n", a, gekozen)
			}
		}
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	fouten := make(chan error, 1)
	go func() { fouten <- srv.Serve(ln) }()

	if !*geenBrowser {
		go func() {
			if err := openBrowser(url); err != nil {
				fmt.Fprintf(uit, "Kon de browser niet openen (%v). Open zelf: %s\n", err, url)
			}
		}()
	}

	select {
	case err := <-fouten:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fataal(stdin, fout, fmt.Errorf("serverfout: %v", err))
		}
	case <-ctx.Done():
		fmt.Fprintln(uit, "\nPlanB72 stopt...")
		sctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := srv.Shutdown(sctx); err != nil {
			_ = srv.Close() // lopende grote downloads afkappen
		}
	}
	return 0
}

// fataal toont de fout en wacht op Enter, zodat het venster bij dubbelklikken
// niet meteen sluit.
func fataal(stdin *os.File, fout *os.File, err error) int {
	fmt.Fprintf(fout, "\nFout: %v\n\nDruk op Enter om te sluiten.\n", err)
	if stdin != nil {
		_, _ = bufio.NewReader(stdin).ReadString('\n')
	}
	return 1
}

// exePad geeft het echte pad van het uitvoerbare bestand (symlinks opgelost).
func exePad() (string, error) {
	p, err := os.Executable()
	if err != nil {
		return "", err
	}
	if r, err := filepath.EvalSymlinks(p); err == nil {
		p = r
	}
	return filepath.Abs(p)
}

func isMap(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.IsDir()
}

func isBestand(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.Mode().IsRegular()
}

// zoekMap bepaalt de map met de site: eerst de --map-flag, anders `planb72`
// of `site` naast het uitvoerbare bestand, anders de map van het bestand zelf
// als daar een index.html staat. Binnen een macOS .app-bundel wordt ook naast
// de .app gezocht.
func zoekMap(flagWaarde, exe string) (string, error) {
	if flagWaarde != "" {
		abs, err := filepath.Abs(flagWaarde)
		if err != nil {
			return "", err
		}
		if !isMap(abs) {
			return "", fmt.Errorf("de map uit --map bestaat niet: %s", abs)
		}
		return abs, nil
	}

	exeMap := filepath.Dir(exe)
	bases := []string{exeMap}
	// Binnen Naam.app/Contents/MacOS/: ook naast de .app zoeken.
	if i := strings.Index(exeMap, ".app"+string(filepath.Separator)+"Contents"); i >= 0 {
		bases = append(bases, filepath.Dir(exeMap[:i+len(".app")]))
	}
	for _, b := range bases {
		for _, naam := range []string{"planb72", "site"} {
			if p := filepath.Join(b, naam); isMap(p) {
				return p, nil
			}
		}
		if isBestand(filepath.Join(b, "index.html")) {
			return b, nil
		}
	}

	msg := fmt.Sprintf("de map met de PlanB72-site is niet gevonden.\n"+
		"Gezocht naast het programma (%s) naar een map `planb72` of `site`, of een index.html.\n"+
		"Zet het programma naast de map `planb72`, of start met: --map <pad naar de map>.", exeMap)
	if strings.Contains(exeMap, "AppTranslocation") {
		msg += "\n\nmacOS draait dit programma vanuit een tijdelijke, afgeschermde locatie (Gatekeeper)." +
			"\nSleep het programma samen met de map `planb72` eerst naar een gewone map (bv. Bureaublad)," +
			"\nof start het via de Terminal met --map."
	}
	return "", errors.New(msg)
}

// luisterVanaf luistert op host:start, of de eerstvolgende vrije poort.
func luisterVanaf(host string, start int) (net.Listener, int, error) {
	var laatste error
	for p := start; p < start+maxPoortPogingen && p <= 65535; p++ {
		ln, err := net.Listen("tcp", net.JoinHostPort(host, strconv.Itoa(p)))
		if err == nil {
			return ln, p, nil
		}
		laatste = err
	}
	return nil, 0, laatste
}

// lanAdressen geeft de IPv4-adressen van alle actieve LAN-interfaces.
func lanAdressen() []string {
	var uit []string
	ifs, err := net.Interfaces()
	if err != nil {
		return nil
	}
	for _, i := range ifs {
		if i.Flags&net.FlagUp == 0 || i.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := i.Addrs()
		if err != nil {
			continue
		}
		for _, a := range addrs {
			ipn, ok := a.(*net.IPNet)
			if !ok {
				continue
			}
			if ip4 := ipn.IP.To4(); ip4 != nil && !ip4.IsLinkLocalUnicast() {
				uit = append(uit, ip4.String())
			}
		}
	}
	return uit
}

func openBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		return err
	}
	go func() { _ = cmd.Wait() }()
	return nil
}

// veiligFS verbergt verborgen bestanden (.git e.d.) en mappen zonder
// index.html, zodat er nooit een mapoverzicht getoond wordt.
type veiligFS struct{ root http.Dir }

func (v veiligFS) Open(naam string) (http.File, error) {
	for _, deel := range strings.Split(path.Clean("/"+naam), "/") {
		if strings.HasPrefix(deel, ".") {
			return nil, fs.ErrNotExist
		}
	}
	f, err := v.root.Open(naam)
	if err != nil {
		return nil, err
	}
	st, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, err
	}
	if st.IsDir() {
		idx, err := v.root.Open(path.Join(naam, "index.html"))
		if err != nil {
			f.Close()
			return nil, fs.ErrNotExist
		}
		idx.Close()
	}
	return f, nil
}

const pagina404 = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>Niet gevonden</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:32em;margin:3em auto;padding:0 1em">
<h1>Niet gevonden</h1><p>Deze pagina bestaat niet. <a href="/">Terug naar PlanB72</a></p>
</body></html>
`

// nieuweHandler serveert de map. Met alleenLokaal wordt een Host-header die
// niet naar de eigen machine wijst geweigerd (bescherming tegen DNS-rebinding).
func nieuweHandler(dir string, alleenLokaal bool) http.Handler {
	fsys := veiligFS{http.Dir(dir)}
	files := http.FileServer(fsys)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if alleenLokaal && !lokaleHost(r.Host) {
			http.Error(w, "Verboden / Forbidden", http.StatusForbidden)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "Methode niet toegestaan", http.StatusMethodNotAllowed)
			return
		}
		p := path.Clean("/" + r.URL.Path)
		f, err := fsys.Open(p)
		if err != nil {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache")
			w.WriteHeader(http.StatusNotFound)
			if r.Method != http.MethodHead {
				_, _ = w.Write([]byte(pagina404))
			}
			return
		}
		f.Close()

		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		ext := strings.ToLower(path.Ext(p))
		if ext == ".html" || ext == ".htm" || ext == "" || strings.HasSuffix(r.URL.Path, "/") {
			h.Set("Cache-Control", "no-cache")
		}
		files.ServeHTTP(w, r)
	})
}

func lokaleHost(hostPoort string) bool {
	h := hostPoort
	if hh, _, err := net.SplitHostPort(hostPoort); err == nil {
		h = hh
	}
	h = strings.Trim(strings.ToLower(h), "[]")
	return h == "127.0.0.1" || h == "localhost" || h == "::1"
}
