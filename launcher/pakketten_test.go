package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestDataPad(t *testing.T) {
	goed := map[string]string{
		"data/eu-z6.pmtiles":  "eu-z6.pmtiles",
		"data/be/aed.geojson": "be/aed.geojson",
		"data/a/b/c.pmtiles":  "a/b/c.pmtiles",
	}
	for in, want := range goed {
		got, err := dataPad(in)
		if err != nil || got != want {
			t.Errorf("%q: got %q, %v; verwacht %q", in, got, err, want)
		}
	}
	slecht := []string{
		"", "../x", "/etc/x", "data/../../x", "kaart/x", "data/", "data",
		"data/../x", "data/./x", "data//x", "data/x/", "data\\..\\x", "data/..\\..\\x",
		"C:/x", "c:\\windows\\x", "data/c:x", "\\\\server\\share\\x",
		"data/.git/config", "data/.verborgen", "data/x.pmtiles.deel", "data/pakketten.json",
		"Data/x", "./data/x", "data/x\x00y",
	}
	for _, in := range slecht {
		if got, err := dataPad(in); err == nil {
			t.Errorf("%q: geweigerd verwacht, got %q", in, got)
		}
	}
}

func TestBronToegestaan(t *testing.T) {
	var extra bronLijst
	if err := extra.Set("planb72.bram-664.workers.dev, http://127.0.0.1:8123"); err != nil {
		t.Fatal(err)
	}
	if err := extra.Set("spiegel.example.org:8443"); err != nil {
		t.Fatal(err)
	}
	cases := map[string]bool{
		"https://planb72.org/data/x":               true,
		"https://PlanB72.org/data/x":               true,
		"https://cdn.planb72.org/data/x":           true,
		"https://planb72.org:443/data/x":           true,
		"http://planb72.org/data/x":                false,
		"ftp://planb72.org/data/x":                 false,
		"https://evilplanb72.org/x":                false,
		"https://planb72.org.evil.com/x":           false,
		"https://user@planb72.org/x":               false,
		"https://planb72.bram-664.workers.dev/x":   true,
		"https://x.planb72.bram-664.workers.dev/x": false,
		"http://planb72.bram-664.workers.dev/x":    false,
		"http://127.0.0.1:8123/x":                  true,
		"http://127.0.0.1:8124/x":                  false,
		"https://127.0.0.1:8123/x":                 false,
		"https://spiegel.example.org:8443/x":       true,
		"https://spiegel.example.org/x":            false,
		"https://ander.example.org/x":              false,
	}
	for in, want := range cases {
		u, err := url.Parse(in)
		if err != nil {
			t.Fatal(err)
		}
		if got := bronToegestaan(u, extra); got != want {
			t.Errorf("%s: got %v, verwacht %v", in, got, want)
		}
	}
	// Zonder extra bronnen geen lokale testserver.
	u, _ := url.Parse("http://127.0.0.1:8123/x")
	if bronToegestaan(u, nil) {
		t.Error("127.0.0.1 zonder --bron-toestaan toegelaten")
	}

	for _, slecht := range []string{"http://example.org", "ftp://x.org", "https://x.org/pad", "a@b.org", "https://"} {
		var b bronLijst
		if err := b.Set(slecht); err == nil {
			t.Errorf("--bron-toestaan %q: fout verwacht", slecht)
		}
	}
}

// testBron is een downloadserver die Range ondersteunt en aanvragen bijhoudt.
type testBron struct {
	*httptest.Server
	mu        sync.Mutex
	bestanden map[string][]byte
	aanvragen []string // "pad|Range"
	geenRange bool
}

func nieuweTestBron(t *testing.T) *testBron {
	t.Helper()
	b := &testBron{bestanden: map[string][]byte{}}
	b.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b.mu.Lock()
		b.aanvragen = append(b.aanvragen, r.URL.Path+"|"+r.Header.Get("Range"))
		inhoud, ok := b.bestanden[r.URL.Path]
		geenRange := b.geenRange
		b.mu.Unlock()
		if !ok {
			http.NotFound(w, r)
			return
		}
		if geenRange {
			r.Header.Del("Range")
		}
		http.ServeContent(w, r, "", time.Time{}, bytes.NewReader(inhoud))
	}))
	t.Cleanup(b.Close)
	return b
}

func (b *testBron) zet(pad string, inhoud []byte) string {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.bestanden[pad] = inhoud
	return b.URL + pad
}

func (b *testBron) lijst() []string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]string(nil), b.aanvragen...)
}

func (b *testBron) toestaan(t *testing.T) bronLijst {
	t.Helper()
	var l bronLijst
	if err := l.Set(b.URL); err != nil {
		t.Fatal(err)
	}
	return l
}

func inhoud(n int, zaad byte) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = byte(i*7) ^ zaad
	}
	return b
}

func shaHex(b []byte) *string {
	s := sha256.Sum256(b)
	h := hex.EncodeToString(s[:])
	return &h
}

func schrijfManifest(t *testing.T, m pakketManifest) string {
	t.Helper()
	if m.Formaat == "" {
		m.Formaat = manifestFormaat
	}
	if m.Versie == 0 {
		m.Versie = 1
	}
	b, err := json.Marshal(m)
	if err != nil {
		t.Fatal(err)
	}
	p := filepath.Join(t.TempDir(), "planb72-pakketten.json")
	if err := os.WriteFile(p, b, 0o644); err != nil {
		t.Fatal(err)
	}
	return p
}

func ophalen(t *testing.T, manifest, site string, extra bronLijst) (samenvatting, string) {
	t.Helper()
	var uit bytes.Buffer
	sam, err := haalPakketten(context.Background(), manifest, site, extra, &uit)
	if err != nil {
		t.Fatalf("haalPakketten: %v\n%s", err, uit.String())
	}
	return sam, uit.String()
}

func leesOf(t *testing.T, p string) []byte {
	t.Helper()
	b, err := os.ReadFile(p)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func bestaat(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

func TestOphalenGewoon(t *testing.T) {
	bron := nieuweTestBron(t)
	kaart := inhoud(300_000, 1)
	aed := inhoud(12_345, 2)
	site := t.TempDir()
	m := pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/eu-z6.pmtiles", URL: bron.zet("/data/eu-z6.pmtiles", kaart), Bytes: int64(len(kaart))},
		{Pad: "data/be/aed.geojson", URL: bron.zet("/data/be/aed.geojson", aed), Bytes: int64(len(aed)), SHA256: shaHex(aed)},
	}}
	mp := schrijfManifest(t, m)
	sam, uit := ophalen(t, mp, site, bron.toestaan(t))
	if sam.Gelukt != 2 || sam.Mislukt != 0 || sam.Overgeslagen != 0 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "eu-z6.pmtiles")), kaart) {
		t.Error("kaart klopt niet")
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "be", "aed.geojson")), aed) {
		t.Error("aed klopt niet")
	}
	if bestaat(filepath.Join(site, "data", "be", "aed.geojson.deel")) {
		t.Error(".deel blijft staan na succes")
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "pakketten.json")), leesOf(t, mp)) {
		t.Error("data/pakketten.json is niet het gebruikte manifest")
	}
	if !strings.Contains(uit, "2 gelukt / done") || !strings.Contains(uit, "MB") {
		t.Errorf("uitvoer mist samenvatting of voortgang:\n%s", uit)
	}
}

func TestOphalenHervat(t *testing.T) {
	bron := nieuweTestBron(t)
	data := inhoud(200_000, 3)
	site := t.TempDir()
	maakBestand(t, filepath.Join(site, "data", "x.pmtiles.deel"), string(data[:80_000]))
	mp := schrijfManifest(t, pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/x.pmtiles", URL: bron.zet("/x.pmtiles", data), Bytes: int64(len(data)), SHA256: shaHex(data)},
	}})
	sam, uit := ophalen(t, mp, site, bron.toestaan(t))
	if sam.Gelukt != 1 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if got := bron.lijst(); len(got) != 1 || got[0] != "/x.pmtiles|bytes=80000-" {
		t.Errorf("aanvragen %q, verwacht één Range bytes=80000-", got)
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "x.pmtiles")), data) {
		t.Error("hervat bestand klopt niet")
	}
	if !strings.Contains(uit, "hervat") {
		t.Errorf("geen melding van hervatten:\n%s", uit)
	}
}

func TestOphalenServerZonderRange(t *testing.T) {
	bron := nieuweTestBron(t)
	bron.geenRange = true
	data := inhoud(50_000, 4)
	site := t.TempDir()
	// Een fout deel: de server negeert Range (200), dus opnieuw beginnen.
	maakBestand(t, filepath.Join(site, "data", "y.bin.deel"), strings.Repeat("z", 10_000))
	mp := schrijfManifest(t, pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/y.bin", URL: bron.zet("/y.bin", data), Bytes: int64(len(data)), SHA256: shaHex(data)},
	}})
	sam, uit := ophalen(t, mp, site, bron.toestaan(t))
	if sam.Gelukt != 1 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "y.bin")), data) {
		t.Error("bestand klopt niet na herstart")
	}
}

func TestOphalenOverslaan(t *testing.T) {
	bron := nieuweTestBron(t)
	a := inhoud(1000, 5)
	b := inhoud(2000, 6)
	site := t.TempDir()
	maakBestand(t, filepath.Join(site, "data", "a.bin"), string(a))
	maakBestand(t, filepath.Join(site, "data", "b.bin"), string(b))
	mp := schrijfManifest(t, pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/a.bin", URL: bron.zet("/a.bin", a), Bytes: int64(len(a)), SHA256: shaHex(a)},
		{Pad: "data/b.bin", URL: bron.zet("/b.bin", b), Bytes: int64(len(b))}, // alleen grootte
	}})
	sam, uit := ophalen(t, mp, site, bron.toestaan(t))
	if sam.Overgeslagen != 2 || sam.Gelukt != 0 || sam.Mislukt != 0 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if n := len(bron.lijst()); n != 0 {
		t.Errorf("%d aanvragen, verwacht geen", n)
	}

	// Zelfde grootte maar andere inhoud: sha256 klopt niet, dus opnieuw ophalen.
	maakBestand(t, filepath.Join(site, "data", "a.bin"), string(inhoud(1000, 9)))
	sam, uit = ophalen(t, mp, site, bron.toestaan(t))
	if sam.Gelukt != 1 || sam.Overgeslagen != 1 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if !bytes.Equal(leesOf(t, filepath.Join(site, "data", "a.bin")), a) {
		t.Error("beschadigd bestand niet vervangen")
	}
}

func TestOphalenShaFout(t *testing.T) {
	bron := nieuweTestBron(t)
	echt := inhoud(5000, 7)
	goed := inhoud(3000, 8)
	site := t.TempDir()
	mp := schrijfManifest(t, pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/fout.bin", URL: bron.zet("/fout.bin", echt), Bytes: int64(len(echt)), SHA256: shaHex([]byte("iets anders"))},
		{Pad: "data/goed.bin", URL: bron.zet("/goed.bin", goed), Bytes: int64(len(goed)), SHA256: shaHex(goed)},
	}})
	sam, uit := ophalen(t, mp, site, bron.toestaan(t))
	if sam.Mislukt != 1 || sam.Gelukt != 1 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if bestaat(filepath.Join(site, "data", "fout.bin")) || bestaat(filepath.Join(site, "data", "fout.bin.deel")) {
		t.Error("bestand met verkeerde sha256 of .deel blijft staan")
	}
	if !strings.Contains(uit, "sha256 klopt niet") || !strings.Contains(uit, "1 mislukt / failed") {
		t.Errorf("uitvoer:\n%s", uit)
	}
}

func TestOphalenWeigert(t *testing.T) {
	ander := nieuweTestBron(t)
	ander.zet("/x", inhoud(100, 1))
	// Toegestane bron die doorverwijst naar een niet-toegestane.
	omleider := httptest.NewServer(http.RedirectHandler(ander.URL+"/x", http.StatusFound))
	t.Cleanup(omleider.Close)
	var extra bronLijst
	if err := extra.Set(omleider.URL); err != nil {
		t.Fatal(err)
	}
	site := t.TempDir()
	buiten := filepath.Join(filepath.Dir(site), "buiten-"+filepath.Base(site))
	t.Cleanup(func() { os.RemoveAll(buiten) })
	mp := schrijfManifest(t, pakketManifest{Bestanden: []pakketBestand{
		{Pad: "data/../../" + filepath.Base(buiten), URL: omleider.URL + "/x", Bytes: 100},
		{Pad: "kaart/x", URL: omleider.URL + "/x", Bytes: 100},
		{Pad: "data/nietok.bin", URL: ander.URL + "/x", Bytes: 100}, // host niet toegestaan
		{Pad: "data/omleiding.bin", URL: omleider.URL + "/x", Bytes: 100},
	}})
	sam, uit := ophalen(t, mp, site, extra)
	if sam.Mislukt != 4 || sam.Gelukt != 0 {
		t.Fatalf("samenvatting %+v\n%s", sam, uit)
	}
	if n := len(ander.lijst()); n != 0 {
		t.Errorf("niet-toegestane bron kreeg %d aanvragen", n)
	}
	if bestaat(buiten) || bestaat(filepath.Join(site, "kaart")) || bestaat(filepath.Join(site, "data", "omleiding.bin")) {
		t.Error("bestand geschreven buiten data/ of via omleiding")
	}
	if !strings.Contains(uit, "niet-toegestane bron") || !strings.Contains(uit, "--bron-toestaan") {
		t.Errorf("uitvoer:\n%s", uit)
	}
}

func TestManifestWeigeren(t *testing.T) {
	d := t.TempDir()
	cases := map[string]string{
		"ander formaat": `{"formaat":"iets-anders","versie":1,"bestanden":[{"pad":"data/x","url":"https://planb72.org/x","bytes":1}]}`,
		"te nieuw":      `{"formaat":"planb72-pakketten","versie":2,"bestanden":[{"pad":"data/x","url":"https://planb72.org/x","bytes":1}]}`,
		"geen versie":   `{"formaat":"planb72-pakketten","bestanden":[{"pad":"data/x","url":"https://planb72.org/x","bytes":1}]}`,
		"leeg":          `{"formaat":"planb72-pakketten","versie":1,"bestanden":[]}`,
		"geen json":     `<html>`,
	}
	for naam, inh := range cases {
		p := filepath.Join(d, strings.ReplaceAll(naam, " ", "-")+".json")
		maakBestand(t, p, inh)
		var uit bytes.Buffer
		if _, err := haalPakketten(context.Background(), p, t.TempDir(), nil, &uit); err == nil {
			t.Errorf("%s: fout verwacht", naam)
		} else if naam == "te nieuw" && !strings.Contains(err.Error(), "nieuwer") {
			t.Errorf("%s: onduidelijke fout %v", naam, err)
		}
	}
}
