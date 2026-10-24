package models

import "time"

// MediaType represents the type of media: video, image, or web
type MediaType string

const (
	MediaTypeVideo MediaType = "video"
	MediaTypeImage MediaType = "image"
	MediaTypeWeb   MediaType = "web"
)

// TransitionMode represents CUT or FADE transition
type TransitionMode string

const (
	TransitionCut  TransitionMode = "CUT"
	TransitionFade TransitionMode = "FADE"
)

// MediaItem represents an item in the media library
type MediaItem struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Type         MediaType `json:"type"`
	FilePath     string    `json:"filePath"`     // URL path e.g. /media/xxx.mp4 or web URL
	ThumbnailURL string    `json:"thumbnailUrl"` // /media/thumbnails/xxx.jpg or placeholder
	Duration     float64   `json:"duration"`     // in seconds for video
	AspectRatio  string    `json:"aspectRatio"`  // e.g. "16:9"
	CreatedAt    int64     `json:"createdAt"`    // unix epoch ms
}

// PlaylistItem represents an item in the show sequence
type PlaylistItem struct {
	ID      string `json:"id"`
	MediaID string `json:"mediaId"`
	Order   int    `json:"order"`
}

// PlaybackState represents real-time synchronized state
type PlaybackState struct {
	ActiveMediaID  string         `json:"activeMediaId"`  // Media currently on PROGRAM (Live)
	NextMediaID    string         `json:"nextMediaId"`    // Media cued for Next Preview
	TransitionMode TransitionMode `json:"transitionMode"` // CUT or FADE
	FadeDurationMs int            `json:"fadeDurationMs"` // 250, 500, 1000, 2000
	IsPlaying      bool           `json:"isPlaying"`      // For video
	IsLoop         bool           `json:"isLoop"`         // Video loop
	IsBlackScreen  bool           `json:"isBlackScreen"`  // Emergency black screen
	CurrentTime    float64        `json:"currentTime"`    // Current video progress in seconds
	UpdatedAt      int64          `json:"updatedAt"`
}

// SystemInfo gives network addresses and stats
type SystemInfo struct {
	LocalIPs         []string `json:"localIps"`
	Port             int      `json:"port"`
	MobileRemoteURL  string   `json:"mobileRemoteUrl"`
	OutputDisplayURL string   `json:"outputDisplayUrl"`
	DashboardURL     string   `json:"dashboardUrl"`
	ConnectedClients int      `json:"connectedClients"`
	OutputConnected  bool     `json:"outputConnected"`
}

// WSMessage format
type WSMessage struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

func NewWSMessage(msgType string, payload interface{}) WSMessage {
	return WSMessage{
		Type:      msgType,
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}
}
