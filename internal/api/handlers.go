package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"mediadeck/internal/database"
	"mediadeck/internal/models"
	"mediadeck/internal/websocket"
)

type Handler struct {
	store    *database.Store
	hub      *websocket.Hub
	mediaDir string
	port     int
}

func NewHandler(store *database.Store, hub *websocket.Hub, mediaDir string, port int) *Handler {
	return &Handler{
		store:    store,
		hub:      hub,
		mediaDir: mediaDir,
		port:     port,
	}
}

// EnableCORS middleware
func (h *Handler) EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// GetSystemInfo returns detected local IPs, QR URLs, and output connection status
func (h *Handler) GetSystemInfo(w http.ResponseWriter, r *http.Request) {
	localIPs := getLocalIPAddresses()
	primaryIP := "localhost"
	if len(localIPs) > 0 {
		primaryIP = localIPs[0]
	}

	totalClients, outputActive := h.hub.GetConnectedCounts()

	info := models.SystemInfo{
		LocalIPs:         localIPs,
		Port:             h.port,
		MobileRemoteURL:  fmt.Sprintf("http://%s:%d/remote", primaryIP, h.port),
		OutputDisplayURL: fmt.Sprintf("http://localhost:%d/output", h.port),
		DashboardURL:     fmt.Sprintf("http://localhost:%d/", h.port),
		ConnectedClients: totalClients,
		OutputConnected:  outputActive,
	}

	writeJSON(w, http.StatusOK, info)
}

// GetMediaList returns all media items
func (h *Handler) GetMediaList(w http.ResponseWriter, r *http.Request) {
	items := h.store.GetMediaItems()
	writeJSON(w, http.StatusOK, items)
}

// UploadMedia handles file upload or adding web URL
func (h *Handler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	contentType := r.Header.Get("Content-Type")

	// If JSON request (e.g. adding a Web URL or external image/video link)
	if strings.Contains(contentType, "application/json") {
		var req struct {
			Name        string           `json:"name"`
			Type        models.MediaType `json:"type"`
			URL         string           `json:"url"`
			ThumbnailURL string          `json:"thumbnailUrl"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		if req.URL == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		id := uuid.New().String()
		name := req.Name
		if name == "" {
			name = req.URL
		}

		thumb := req.ThumbnailURL
		if thumb == "" {
			thumb = "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=320&q=80"
		}

		item := models.MediaItem{
			ID:           id,
			Name:         name,
			Type:         req.Type,
			FilePath:     req.URL,
			ThumbnailURL: thumb,
			Duration:     0,
			AspectRatio:  "16:9",
			CreatedAt:    time.Now().UnixMilli(),
		}

		h.store.AddMediaItem(item)
		h.hub.BroadcastMessage(models.NewWSMessage("MEDIA_ADDED", item))
		writeJSON(w, http.StatusCreated, item)
		return
	}

	// Multipart file upload
	if err := r.ParseMultipartForm(500 << 20); err != nil { // 500 MB max
		http.Error(w, "Failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File is required: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	id := uuid.New().String()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	cleanFileName := fmt.Sprintf("%s%s", id, ext)
	targetPath := filepath.Join(h.mediaDir, cleanFileName)

	dst, err := os.Create(targetPath)
	if err != nil {
		http.Error(w, "Failed to save file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Detect media type
	mediaType := models.MediaTypeImage
	isVideo := ext == ".mp4" || ext == ".webm" || ext == ".mov" || ext == ".mkv"
	if isVideo {
		mediaType = models.MediaTypeVideo
	}

	filePath := fmt.Sprintf("/media/%s", cleanFileName)
	thumbnailUrl := filePath
	if isVideo {
		// Use placeholder video thumbnail or custom icon
		thumbnailUrl = "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=320&q=80"
	}

	// If Supabase is active, upload to cloud storage
	if sb := h.store.GetSupabase(); sb != nil {
		if f, err := os.Open(targetPath); err == nil {
			if publicURL, err := sb.UploadFile(cleanFileName, f, header.Header.Get("Content-Type")); err == nil {
				filePath = publicURL
				if !isVideo {
					thumbnailUrl = publicURL
				}
			}
			f.Close()
		}
	}

	name := r.FormValue("name")
	if name == "" {
		name = header.Filename
	}

	item := models.MediaItem{
		ID:           id,
		Name:         name,
		Type:         mediaType,
		FilePath:     filePath,
		ThumbnailURL: thumbnailUrl,
		Duration:     0,
		AspectRatio:  "16:9",
		CreatedAt:    time.Now().UnixMilli(),
	}

	h.store.AddMediaItem(item)
	h.hub.BroadcastMessage(models.NewWSMessage("MEDIA_ADDED", item))

	writeJSON(w, http.StatusCreated, item)
}

// DeleteMedia deletes a media item by ID
func (h *Handler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/media/")
	if id == "" {
		http.Error(w, "ID required", http.StatusBadRequest)
		return
	}

	item, found := h.store.GetMediaItem(id)
	if found {
		// If stored in local media dir, try removing file
		if strings.HasPrefix(item.FilePath, "/media/") {
			filename := strings.TrimPrefix(item.FilePath, "/media/")
			_ = os.Remove(filepath.Join(h.mediaDir, filename))
		}
		h.store.DeleteMediaItem(id)
		h.hub.BroadcastMessage(models.NewWSMessage("MEDIA_DELETED", map[string]string{"id": id}))
	}

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// GetPlaylist returns current playlist
func (h *Handler) GetPlaylist(w http.ResponseWriter, r *http.Request) {
	playlist := h.store.GetPlaylist()
	writeJSON(w, http.StatusOK, playlist)
}

// UpdatePlaylist updates whole playlist
func (h *Handler) UpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	var playlist []models.PlaylistItem
	if err := json.NewDecoder(r.Body).Decode(&playlist); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	h.store.SetPlaylist(playlist)
	h.hub.BroadcastMessage(models.NewWSMessage("PLAYLIST_UPDATED", playlist))
	writeJSON(w, http.StatusOK, playlist)
}

// AddToPlaylist adds a media item to playlist
func (h *Handler) AddToPlaylist(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MediaID string `json:"mediaId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	playlist := h.store.GetPlaylist()
	newItem := models.PlaylistItem{
		ID:      uuid.New().String(),
		MediaID: req.MediaID,
		Order:   len(playlist),
	}
	playlist = append(playlist, newItem)

	h.store.SetPlaylist(playlist)
	h.hub.BroadcastMessage(models.NewWSMessage("PLAYLIST_UPDATED", playlist))
	writeJSON(w, http.StatusCreated, newItem)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// getLocalIPAddresses finds suitable Wi-Fi or Hotspot local IP addresses
func getLocalIPAddresses() []string {
	var ips []string
	ifaces, err := net.Interfaces()
	if err != nil {
		return []string{"127.0.0.1"}
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue // interface down or loopback
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.IsLoopback() {
				continue
			}
			ip = ip.To4()
			if ip == nil {
				continue // skip IPv6 for simple mobile URL
			}
			// Prioritize 192.168.x.x (typical Wi-Fi or Windows Mobile Hotspot 192.168.137.x)
			ips = append(ips, ip.String())
		}
	}

	if len(ips) == 0 {
		return []string{"127.0.0.1"}
	}
	return ips
}
