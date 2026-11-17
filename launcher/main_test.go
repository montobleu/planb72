package main

import (
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func maakBestand(t *testing.T, p string, inhoud string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(inhoud), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestZoekMap(t *testing.T) {
	t.Run("flag wint", func(t *testing.T) {
		d := t.TempDir()
		eigen := filepath.Join(d, "ergens")
		os.MkdirAll(eigen, 0o755)
		os.MkdirAll(filepath.Join(d, "planb72"), 0o755)
		got, err := zoekMap(eigen, filepath.Join(d, "start"))
		if err != nil || got != eigen {
			t.Fatalf("got %q, %v", got, err)
		}
	})
	t.Run("flag bestaat niet", func(t *testing.T) {
		if _, err := zoekMap(filepath.Join(t.TempDir(), "nope"), "/x/start"); err == nil {
			t.Fatal("fout verwacht")
		}
	})
	t.Run("planb72 voor site", func(t *testing.T) {
		d := t.TempDir()
		os.MkdirAll(filepath.Join(d, "planb72"), 0o755)
		os.MkdirAll(filepath.Join(d, "site"), 0o755)
		got, err := zoekMap("", filepath.Join(d, "start"))
		if err != nil || got != filepath.Join(d, "planb72") {
			t.Fatalf("got %q, %v", got, err)
		}
	})
	t.Run("site", func(t *testing.T) {
		d := t.TempDir()
		os.MkdirAll(filepath.Join(d, "site"), 0o755)
		got, err := zoekMap("", filepath.Join(d, "start"))
		if err != nil || got != filepath.Join(d, "site") {
			t.Fatalf("got %q, %v", got, err)
		}
	})
	t.Run("eigen map met index.html", func(t *testing.T) {
		d := t.TempDir()
		maakBestand(t, filepath.Join(d, "index.html"), "x")
		got, err := zoekMap("", filepath.Join(d, "start"))
		if err != nil || got != d {
			t.Fatalf("got %q, %v", got, err)
		}
	})
	t.Run("macOS .app", func(t *testing.T) {
		d := t.TempDir()
		os.MkdirAll(filepath.Join(d, "planb72"), 0o755)
		macos := filepath.Join(d, "PlanB72.app", "Contents", "MacOS")
		os.MkdirAll(macos, 0o755)
		got, err := zoekMap("", filepath.Join(macos, "start"))
		if err != nil || got != filepath.Join(d, "planb72") {
			t.Fatalf("got %q, %v", got, err)
		}
	})
	t.Run("niet gevonden", func(t *testing.T) {
		_, err := zoekMap("", filepath.Join(t.TempDir(), "start"))
		if err == nil || !strings.Contains(err.Error(), "niet gevonden") {
			t.Fatalf("duidelijke fout verwacht, got %v", err)
		}
	})
}

func testSite(t *testing.T) *httptest.Server {
	t.Helper()
	d := t.TempDir()
	maakBestand(t, filepath.Join(d, "index.html"), "<h1>hoi</h1>")
	maakBestand(t, filepath.Join(d, "kaart", "wereld.pmtiles"), "0123456789abcdefghij")
	maakBestand(t, filepath.Join(d, "leeg", "bestand.txt"), "geen index")
	maakBestand(t, filepath.Join(d, "app", "index.html"), "app")
	maakBestand(t, filepath.Join(d, ".geheim"), "nee")
	for ext := range mimeTypes {
		maakBestand(t, filepath.Join(d, "t", "bestand"+ext), "x")
	}
	srv := httptest.NewServer(nieuweHandler(d, true))
	t.Cleanup(srv.Close)
	return srv
}

func TestMIMETypes(t *testing.T) {
	srv := testSite(t)
	verwacht := map[string]string{
		".pmtiles":     "application/octet-stream",
		".webmanifest": "application/manifest+json",
		".js":          "text/javascript",
		".mjs":         "text/javascript",
		".wasm":        "application/wasm",
		".json":        "application/json",
		".geojson":     "application/geo+json",
		".svg":         "image/svg+xml",
		".avif":        "image/avif",
		".html":        "text/html",
	}
	for ext, want := range verwacht {
		resp, err := http.Get(srv.URL + "/t/bestand" + ext)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if got := resp.Header.Get("Content-Type"); !strings.HasPrefix(got, want) {
			t.Errorf("%s: Content-Type %q, verwacht %q", ext, got, want)
		}
	}
}

func TestRangePMTiles(t *testing.T) {
	srv := testSite(t)
	req, _ := http.NewRequest("GET", srv.URL+"/kaart/wereld.pmtiles", nil)
	req.Header.Set("Range", "bytes=5-9")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusPartialContent {
		t.Fatalf("status %d, verwacht 206", resp.StatusCode)
	}
	if string(b) != "56789" {
		t.Errorf("body %q", b)
	}
	if cr := resp.Header.Get("Content-Range"); cr != "bytes 5-9/20" {
		t.Errorf("Content-Range %q", cr)
	}
}

func TestPaden(t *testing.T) {
	srv := testSite(t)
	cases := []struct {
		pad    string
		status int
		cache  string
	}{
		{"/", 200, "no-cache"},
		{"/app/", 200, "no-cache"},
		{"/leeg/", 404, ""}, // geen mapoverzicht
		{"/leeg", 404, ""},  //
		{"/bestaat-niet", 404, ""},
		{"/.geheim", 404, ""},
		{"/kaart/wereld.pmtiles", 200, ""},
	}
	for _, c := range cases {
		resp, err := http.Get(srv.URL + c.pad)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != c.status {
			t.Errorf("%s: status %d, verwacht %d", c.pad, resp.StatusCode, c.status)
		}
		if c.cache != "" && resp.Header.Get("Cache-Control") != c.cache {
			t.Errorf("%s: Cache-Control %q", c.pad, resp.Header.Get("Cache-Control"))
		}
		if strings.Contains(string(b), "geen index") || strings.Contains(string(b), "bestand.txt") {
			t.Errorf("%s: lekt mapinhoud", c.pad)
		}
	}
}

func TestHostControle(t *testing.T) {
	srv := testSite(t)
	req, _ := http.NewRequest("GET", srv.URL+"/", nil)
	req.Host = "kwaadaardig.example"
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("status %d, verwacht 403", resp.StatusCode)
	}
}

func TestPoortFallback(t *testing.T) {
	bezet, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer bezet.Close()
	start := bezet.Addr().(*net.TCPAddr).Port

	ln, gekozen, err := luisterVanaf("127.0.0.1", start)
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	if gekozen == start {
		t.Fatalf("bezette poort %d opnieuw gekozen", start)
	}
	if gekozen < start || gekozen >= start+maxPoortPogingen {
		t.Errorf("onverwachte poort %d (start %d)", gekozen, start)
	}
	if ln.Addr().(*net.TCPAddr).Port != gekozen {
		t.Error("gemelde poort klopt niet met de listener")
	}
}
