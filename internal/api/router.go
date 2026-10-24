package api

import (
	"io/fs"
	"net/http"
	"os"
	"strings"

	"mediadeck/internal/streamer"
	"mediadeck/internal/websocket"
)

type Router struct {
	handler  *Handler
	streamer *streamer.MediaStreamer
	hub      *websocket.Hub
	staticFS fs.FS
}

func NewRouter(handler *Handler, streamer *streamer.MediaStreamer, hub *websocket.Hub, staticFS fs.FS) *Router {
	return &Router{
		handler:  handler,
		streamer: streamer,
		hub:      hub,
		staticFS: staticFS,
	}
}

func (r *Router) SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	// WebSocket route
	mux.HandleFunc("/ws", func(w http.ResponseWriter, req *http.Request) {
		websocket.ServeWs(r.hub, w, req)
	})

	// REST API routes
	mux.HandleFunc("/api/system/info", r.handler.EnableCORS(r.handler.GetSystemInfo))

	mux.HandleFunc("/api/media", r.handler.EnableCORS(func(w http.ResponseWriter, req *http.Request) {
		switch req.Method {
		case http.MethodGet:
			r.handler.GetMediaList(w, req)
		case http.MethodPost:
			r.handler.UploadMedia(w, req)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/media/", r.handler.EnableCORS(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == http.MethodDelete {
			r.handler.DeleteMedia(w, req)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))

	mux.HandleFunc("/api/playlist", r.handler.EnableCORS(func(w http.ResponseWriter, req *http.Request) {
		switch req.Method {
		case http.MethodGet:
			r.handler.GetPlaylist(w, req)
		case http.MethodPost:
			r.handler.UpdatePlaylist(w, req)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/playlist/add", r.handler.EnableCORS(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == http.MethodPost {
			r.handler.AddToPlaylist(w, req)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))

	// Media streaming route (HTTP 206 Partial Content)
	mux.Handle("/media/", http.StripPrefix("/media/", r.streamer))

	// Static UI File Server with SPA Fallback (for /remote, /output, etc.)
	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		path := req.URL.Path

		// If staticFS is available (production embedded)
		if r.staticFS != nil {
			trimmedPath := strings.TrimPrefix(path, "/")
			if trimmedPath == "" {
				trimmedPath = "index.html"
			}

			// Try to open file from embedded FS
			f, err := r.staticFS.Open(trimmedPath)
			if err == nil {
				_ = f.Close()
				http.FileServer(http.FS(r.staticFS)).ServeHTTP(w, req)
				return
			}

			// SPA Fallback: if not found and doesn't have file extension, serve index.html
			if !strings.Contains(filepathBase(path), ".") {
				req.URL.Path = "/"
				http.FileServer(http.FS(r.staticFS)).ServeHTTP(w, req)
				return
			}
			http.NotFound(w, req)
			return
		}

		// Development fallback: check if web/dist exists on disk
		if _, err := os.Stat("web/dist/index.html"); err == nil {
			fsrv := http.FileServer(http.Dir("web/dist"))
			// Check if file exists
			f, err := os.Open("web/dist" + path)
			if err == nil {
				_ = f.Close()
				fsrv.ServeHTTP(w, req)
				return
			}
			// SPA fallback
			http.ServeFile(w, req, "web/dist/index.html")
			return
		}

		// If during dev Vite dev server is running separately
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<!DOCTYPE html><html><body style="background:#111318;color:#F4F5F7;font-family:sans-serif;padding:40px;">
		<h2>MediaDeck Backend API is Running!</h2>
		<p>Vite frontend dev server: <a style="color:#20B8A6;" href="http://localhost:5173">http://localhost:5173</a></p>
		<p>Endpoints: <code>/api/system/info</code>, <code>/ws</code>, <code>/media/</code></p>
		</body></html>`))
	})

	return mux
}

func filepathBase(path string) string {
	parts := strings.Split(path, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}
