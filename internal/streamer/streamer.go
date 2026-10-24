package streamer

import (
	"net/http"
	"os"
	"path/filepath"
)

type MediaStreamer struct {
	mediaDir string
}

func NewMediaStreamer(mediaDir string) *MediaStreamer {
	return &MediaStreamer{
		mediaDir: mediaDir,
	}
}

// ServeHTTP handles media files with HTTP 206 Partial Content support for video scrubbing
func (ms *MediaStreamer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for local dev
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range, Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Path relative to /media/
	relPath := r.URL.Path
	if len(relPath) > 0 && relPath[0] == '/' {
		relPath = relPath[1:]
	}

	fullPath := filepath.Join(ms.mediaDir, relPath)

	// Prevent directory traversal
	cleanPath := filepath.Clean(fullPath)
	if !filepath.IsAbs(cleanPath) {
		absDir, _ := filepath.Abs(ms.mediaDir)
		absClean, _ := filepath.Abs(cleanPath)
		if len(absClean) < len(absDir) || absClean[:len(absDir)] != absDir {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
	}

	info, err := os.Stat(cleanPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if info.IsDir() {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Set cache control for performance
	w.Header().Set("Cache-Control", "public, max-age=86400")

	// http.ServeFile automatically handles Range requests (HTTP 206 Partial Content)
	http.ServeFile(w, r, cleanPath)
}
