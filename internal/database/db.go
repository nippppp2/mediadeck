package database

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"mediadeck/internal/models"
)

type StoreData struct {
	MediaItems []models.MediaItem    `json:"mediaItems"`
	Playlist   []models.PlaylistItem `json:"playlist"`
	State      models.PlaybackState  `json:"state"`
}

type Store struct {
	mu       sync.RWMutex
	filePath string
	data     StoreData
	supabase *SupabaseClient
}

// SetSupabase configures the Supabase client and syncs data
func (s *Store) SetSupabase(client *SupabaseClient) {
	s.mu.Lock()
	s.supabase = client
	s.mu.Unlock()
	s.SyncWithSupabase()
}

// GetSupabase returns the active Supabase client if any
func (s *Store) GetSupabase() *SupabaseClient {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.supabase
}

// SyncWithSupabase pulls latest media and playlist from Supabase
func (s *Store) SyncWithSupabase() {
	if s.supabase == nil {
		return
	}

	// Pull media items
	items, err := s.supabase.GetMediaItems()
	if err == nil && len(items) > 0 {
		s.mu.Lock()
		s.data.MediaItems = items
		s.mu.Unlock()
		_ = s.save()
	}

	// Pull playlist items
	playlist, err := s.supabase.GetPlaylist()
	if err == nil && len(playlist) > 0 {
		s.mu.Lock()
		s.data.Playlist = playlist
		s.mu.Unlock()
		_ = s.save()
	}
}

// MigrateLocalMediaToSupabase scans for items with local /media/ path and uploads them to Supabase Storage
func (s *Store) MigrateLocalMediaToSupabase(mediaDir string) {
	if s.supabase == nil {
		return
	}

	s.mu.RLock()
	items := make([]models.MediaItem, len(s.data.MediaItems))
	copy(items, s.data.MediaItems)
	s.mu.RUnlock()

	for _, item := range items {
		if strings.HasPrefix(item.FilePath, "/media/") {
			fileName := strings.TrimPrefix(item.FilePath, "/media/")
			localFilePath := filepath.Join(mediaDir, fileName)
			fileInfo, err := os.Stat(localFilePath)
			if err == nil && !fileInfo.IsDir() {
				fmt.Printf("☁️ [Supabase Cloud] Mengunggah file lokal '%s' (%.1f MB) ke Supabase Storage...\n", item.Name, float64(fileInfo.Size())/(1024*1024))
				f, err := os.Open(localFilePath)
				if err == nil {
					contentType := "video/mp4"
					if item.Type == models.MediaTypeImage {
						contentType = "image/jpeg"
					}
					publicURL, uploadErr := s.supabase.UploadFile(fileName, f, contentType)
					f.Close()

					if uploadErr == nil {
						fmt.Printf("✅ [Supabase Cloud] Berhasil migrasi '%s' ke Supabase Storage!\n   URL: %s\n", item.Name, publicURL)
						s.mu.Lock()
						for i := range s.data.MediaItems {
							if s.data.MediaItems[i].ID == item.ID {
								s.data.MediaItems[i].FilePath = publicURL
								if item.Type != models.MediaTypeVideo {
									s.data.MediaItems[i].ThumbnailURL = publicURL
								}
								_ = s.supabase.InsertMediaItem(s.data.MediaItems[i])
								break
							}
						}
						s.mu.Unlock()
						_ = s.save()
					} else {
						fmt.Printf("⚠️ [Supabase Cloud] Gagal upload '%s': %v\n", item.Name, uploadErr)
					}
				}
			}
		}
	}
}

// NewID generates a random UUID string
func NewID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// NewStore creates a new Store given a data directory path
func NewStore(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	mediaDir := filepath.Join(dataDir, "media")
	if err := os.MkdirAll(mediaDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create media dir: %w", err)
	}

	storeFilePath := filepath.Join(dataDir, "mediadeck_store.json")
	return Open(storeFilePath)
}

// Open initializes or loads the store from a specific JSON file path
func Open(path string) (*Store, error) {
	s := &Store{
		filePath: path,
		data: StoreData{
			MediaItems: make([]models.MediaItem, 0),
			Playlist:   make([]models.PlaylistItem, 0),
			State: models.PlaybackState{
				ActiveMediaID:  "",
				NextMediaID:    "",
				TransitionMode: models.TransitionCut,
				FadeDurationMs: 500,
				IsPlaying:      false,
				IsLoop:         true,
				IsBlackScreen:  false,
				CurrentTime:    0,
				UpdatedAt:      time.Now().UnixMilli(),
			},
		},
	}

	raw, err := os.ReadFile(path)
	if err == nil {
		if err := json.Unmarshal(raw, &s.data); err != nil {
			return nil, fmt.Errorf("database korup: %w", err)
		}
	} else if os.IsNotExist(err) {
		// Initialize default sample media
		s.seedDefaults()
		if saveErr := s.save(); saveErr != nil {
			return nil, fmt.Errorf("failed to save initial store: %w", saveErr)
		}
	} else {
		return nil, err
	}

	return s, nil
}

// Atomic save using temporary file
func (s *Store) save() error {
	raw, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.filePath + ".tmp"
	if err := os.WriteFile(tmp, raw, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, s.filePath)
}

func (s *Store) seedDefaults() {
	now := time.Now().UnixMilli()
	s.data.MediaItems = []models.MediaItem{
		{
			ID:           "demo-slide-1",
			Name:         "Welcome Screen — MediaDeck",
			Type:         models.MediaTypeImage,
			FilePath:     "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80",
			ThumbnailURL: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=320&q=80",
			Duration:     0,
			AspectRatio:  "16:9",
			CreatedAt:    now - 3000,
		},
		{
			ID:           "demo-video-1",
			Name:         "Intro Motion Loop (Sample)",
			Type:         models.MediaTypeVideo,
			FilePath:     "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
			ThumbnailURL: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=320&q=80",
			Duration:     15,
			AspectRatio:  "16:9",
			CreatedAt:    now - 2000,
		},
		{
			ID:           "demo-slide-2",
			Name:         "Sponsor & Schedule Showcase",
			Type:         models.MediaTypeImage,
			FilePath:     "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1920&q=80",
			ThumbnailURL: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=320&q=80",
			Duration:     0,
			AspectRatio:  "16:9",
			CreatedAt:    now - 1000,
		},
		{
			ID:           "demo-web-1",
			Name:         "Live Clock / Web Display",
			Type:         models.MediaTypeWeb,
			FilePath:     "https://time.is",
			ThumbnailURL: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=320&q=80",
			Duration:     0,
			AspectRatio:  "16:9",
			CreatedAt:    now,
		},
	}

	s.data.Playlist = []models.PlaylistItem{
		{ID: "pl-1", MediaID: "demo-slide-1", Order: 0},
		{ID: "pl-2", MediaID: "demo-video-1", Order: 1},
		{ID: "pl-3", MediaID: "demo-slide-2", Order: 2},
		{ID: "pl-4", MediaID: "demo-web-1", Order: 3},
	}

	s.data.State.ActiveMediaID = "demo-slide-1"
	s.data.State.NextMediaID = "demo-video-1"
}

// GetState returns current playback state
func (s *Store) GetState() models.PlaybackState {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.State
}

// UpdateState safely mutates state and persists to disk
func (s *Store) UpdateState(fn func(*models.PlaybackState)) models.PlaybackState {
	s.mu.Lock()
	defer s.mu.Unlock()

	fn(&s.data.State)
	s.data.State.UpdatedAt = time.Now().UnixMilli()
	_ = s.save()
	return s.data.State
}

// GetMediaItems returns all media items
func (s *Store) GetMediaItems() []models.MediaItem {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]models.MediaItem, len(s.data.MediaItems))
	copy(items, s.data.MediaItems)
	return items
}

// Media is an alias for GetMediaItems
func (s *Store) Media() []models.MediaItem {
	return s.GetMediaItems()
}

// GetMediaItem returns a media item by ID
func (s *Store) GetMediaItem(id string) (models.MediaItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, m := range s.data.MediaItems {
		if m.ID == id {
			return m, true
		}
	}
	return models.MediaItem{}, false
}

// GetMedia is an alias for GetMediaItem
func (s *Store) GetMedia(id string) (models.MediaItem, bool) {
	return s.GetMediaItem(id)
}

// AddMediaItem adds a new media item
func (s *Store) AddMediaItem(item models.MediaItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.MediaItems = append(s.data.MediaItems, item)
	_ = s.save()
	if s.supabase != nil {
		go func(m models.MediaItem) {
			_ = s.supabase.InsertMediaItem(m)
		}(item)
	}
}

// AddMedia adds a media item and returns error
func (s *Store) AddMedia(item models.MediaItem) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.MediaItems = append(s.data.MediaItems, item)
	err := s.save()
	if s.supabase != nil {
		go func(m models.MediaItem) {
			_ = s.supabase.InsertMediaItem(m)
		}(item)
	}
	return err
}

// DeleteMediaItem removes a media item and cleans up playlist
func (s *Store) DeleteMediaItem(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	filteredMedia := make([]models.MediaItem, 0, len(s.data.MediaItems))
	for _, m := range s.data.MediaItems {
		if m.ID != id {
			filteredMedia = append(filteredMedia, m)
		}
	}
	s.data.MediaItems = filteredMedia

	filteredPlaylist := make([]models.PlaylistItem, 0, len(s.data.Playlist))
	order := 0
	for _, p := range s.data.Playlist {
		if p.MediaID != id {
			p.Order = order
			filteredPlaylist = append(filteredPlaylist, p)
			order++
		}
	}
	s.data.Playlist = filteredPlaylist

	if s.data.State.ActiveMediaID == id {
		s.data.State.ActiveMediaID = ""
	}
	if s.data.State.NextMediaID == id {
		s.data.State.NextMediaID = ""
	}

	_ = s.save()
	if s.supabase != nil {
		go func(delID string) {
			_ = s.supabase.DeleteMediaItem(delID)
		}(id)
	}
}

// DeleteMedia removes a media item and returns the deleted item
func (s *Store) DeleteMedia(id string) (models.MediaItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, m := range s.data.MediaItems {
		if m.ID == id {
			idx = i
			break
		}
	}
	if idx < 0 {
		return models.MediaItem{}, errors.New("media tidak ditemukan")
	}

	item := s.data.MediaItems[idx]
	s.data.MediaItems = append(s.data.MediaItems[:idx], s.data.MediaItems[idx+1:]...)

	kept := make([]models.PlaylistItem, 0, len(s.data.Playlist))
	for _, p := range s.data.Playlist {
		if p.MediaID != id {
			p.Order = len(kept)
			kept = append(kept, p)
		}
	}
	s.data.Playlist = kept

	if s.data.State.ActiveMediaID == id {
		s.data.State.ActiveMediaID = ""
	}
	if s.data.State.NextMediaID == id {
		s.data.State.NextMediaID = ""
	}

	err := s.save()
	if s.supabase != nil {
		go func(delID string) {
			_ = s.supabase.DeleteMediaItem(delID)
		}(id)
	}
	return item, err
}

// GetPlaylist returns current playlist items
func (s *Store) GetPlaylist() []models.PlaylistItem {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]models.PlaylistItem, len(s.data.Playlist))
	copy(items, s.data.Playlist)
	return items
}

// Playlist is an alias for GetPlaylist
func (s *Store) Playlist() []models.PlaylistItem {
	return s.GetPlaylist()
}

// SetPlaylist updates the playlist items
func (s *Store) SetPlaylist(playlist []models.PlaylistItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Playlist = playlist
	_ = s.save()
	if s.supabase != nil {
		go func(pl []models.PlaylistItem) {
			_ = s.supabase.SetPlaylist(pl)
		}(playlist)
	}
}

// SetPlaylistIDs updates playlist using a slice of media IDs
func (s *Store) SetPlaylistIDs(mediaIDs []string) ([]models.PlaylistItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	valid := make(map[string]bool)
	for _, m := range s.data.MediaItems {
		valid[m.ID] = true
	}

	pl := make([]models.PlaylistItem, 0, len(mediaIDs))
	for _, id := range mediaIDs {
		if valid[id] {
			pl = append(pl, models.PlaylistItem{ID: NewID(), MediaID: id, Order: len(pl)})
		}
	}
	s.data.Playlist = pl

	out := make([]models.PlaylistItem, len(pl))
	copy(out, pl)
	return out, s.save()
}
