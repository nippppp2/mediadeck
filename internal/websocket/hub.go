package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"mediadeck/internal/database"
	"mediadeck/internal/models"
)

type Hub struct {
	mu         sync.RWMutex
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	store      *database.Store
}

func NewHub(store *database.Store) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		store:      store,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

			// Send full initial state snapshot to newly connected client
			h.SendSnapshot(client)
			h.BroadcastOutputStatus()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

			h.BroadcastOutputStatus()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastMessage sends a message to all connected clients
func (h *Hub) BroadcastMessage(msg models.WSMessage) {
	bytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS Hub] Error marshaling message: %v", err)
		return
	}
	h.broadcast <- bytes
}

// SendSnapshot sends complete state, media items, and playlist to a specific client
func (h *Hub) SendSnapshot(client *Client) {
	state := h.store.GetState()
	media := h.store.GetMediaItems()
	playlist := h.store.GetPlaylist()

	snapshot := map[string]interface{}{
		"state":           state,
		"mediaItems":      media,
		"playlist":        playlist,
		"outputConnected": h.IsOutputConnected(),
	}

	msg := models.NewWSMessage("STATE_SNAPSHOT", snapshot)
	bytes, err := json.Marshal(msg)
	if err == nil {
		client.send <- bytes
	}
}

// IsOutputConnected checks if at least one output display window is connected
func (h *Hub) IsOutputConnected() bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.clientType == "output" {
			return true
		}
	}
	return false
}

// GetConnectedCounts returns total connected clients and output status
func (h *Hub) GetConnectedCounts() (int, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := len(h.clients)
	outputActive := false
	for client := range h.clients {
		if client.clientType == "output" {
			outputActive = true
		}
	}
	return total, outputActive
}

// BroadcastOutputStatus sends updated output status to all clients
func (h *Hub) BroadcastOutputStatus() {
	total, outputActive := h.GetConnectedCounts()
	h.BroadcastMessage(models.NewWSMessage("OUTPUT_STATUS", map[string]interface{}{
		"outputConnected":  outputActive,
		"connectedClients": total,
	}))
}

// HandleClientCommand processes an incoming command from either Laptop or Mobile
func (h *Hub) HandleClientCommand(client *Client, raw []byte) {
	var msg models.WSMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		log.Printf("[WS Hub] Invalid message JSON: %v", err)
		return
	}

	switch msg.Type {
	case "CUE_MEDIA":
		var payload struct {
			MediaID string `json:"mediaId"`
		}
		if err := json.Unmarshal(mustMarshal(msg.Payload), &payload); err == nil {
			newState := h.store.UpdateState(func(s *models.PlaybackState) {
				s.NextMediaID = payload.MediaID
			})
			h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))
		}

	case "TAKE_OUTPUT":
		var payload struct {
			Transition string `json:"transition"`
			DurationMs int    `json:"durationMs"`
		}
		_ = json.Unmarshal(mustMarshal(msg.Payload), &payload)

		currentState := h.store.GetState()
		if currentState.NextMediaID == "" {
			return // Nothing to take
		}

		nextMedia, found := h.store.GetMediaItem(currentState.NextMediaID)
		if !found {
			return
		}

		transitionMode := currentState.TransitionMode
		if payload.Transition != "" {
			transitionMode = models.TransitionMode(payload.Transition)
		}
		durationMs := currentState.FadeDurationMs
		if payload.DurationMs > 0 {
			durationMs = payload.DurationMs
		}

		// Update state: activeMediaId becomes nextMediaId
		newState := h.store.UpdateState(func(s *models.PlaybackState) {
			s.ActiveMediaID = s.NextMediaID
			s.TransitionMode = transitionMode
			s.FadeDurationMs = durationMs
			s.CurrentTime = 0
			if nextMedia.Type == models.MediaTypeVideo {
				s.IsPlaying = true
			}
			// If black screen was active, disable it when new media is taken
			s.IsBlackScreen = false
		})

		// Broadcast TAKE_EXECUTED with transition details for Output Display A/B Deck
		h.BroadcastMessage(models.NewWSMessage("TAKE_EXECUTED", map[string]interface{}{
			"activeMedia": nextMedia,
			"transition":  transitionMode,
			"durationMs":  durationMs,
			"state":       newState,
		}))
		h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))

	case "PLAY":
		newState := h.store.UpdateState(func(s *models.PlaybackState) {
			s.IsPlaying = true
		})
		h.BroadcastMessage(models.NewWSMessage("PLAYBACK_CMD", map[string]interface{}{"command": "PLAY"}))
		h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))

	case "PAUSE":
		newState := h.store.UpdateState(func(s *models.PlaybackState) {
			s.IsPlaying = false
		})
		h.BroadcastMessage(models.NewWSMessage("PLAYBACK_CMD", map[string]interface{}{"command": "PAUSE"}))
		h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))

	case "TOGGLE_LOOP":
		var payload struct {
			Enabled bool `json:"enabled"`
		}
		if err := json.Unmarshal(mustMarshal(msg.Payload), &payload); err == nil {
			newState := h.store.UpdateState(func(s *models.PlaybackState) {
				s.IsLoop = payload.Enabled
			})
			h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))
		}

	case "TOGGLE_BLACK":
		var payload struct {
			Enabled bool `json:"enabled"`
		}
		if err := json.Unmarshal(mustMarshal(msg.Payload), &payload); err == nil {
			newState := h.store.UpdateState(func(s *models.PlaybackState) {
				s.IsBlackScreen = payload.Enabled
			})
			h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))
		}

	case "SET_TRANSITION":
		var payload struct {
			Mode       models.TransitionMode `json:"mode"`
			DurationMs int                   `json:"durationMs"`
		}
		if err := json.Unmarshal(mustMarshal(msg.Payload), &payload); err == nil {
			newState := h.store.UpdateState(func(s *models.PlaybackState) {
				if payload.Mode != "" {
					s.TransitionMode = payload.Mode
				}
				if payload.DurationMs > 0 {
					s.FadeDurationMs = payload.DurationMs
				}
			})
			h.BroadcastMessage(models.NewWSMessage("STATE_CHANGED", newState))
		}

	case "SEEK":
		var payload struct {
			TimeSeconds float64 `json:"timeSeconds"`
		}
		if err := json.Unmarshal(mustMarshal(msg.Payload), &payload); err == nil {
			h.store.UpdateState(func(s *models.PlaybackState) {
				s.CurrentTime = payload.TimeSeconds
			})
			h.BroadcastMessage(models.NewWSMessage("SEEK_CMD", payload))
		}

	case "SYNC_REQUEST":
		h.SendSnapshot(client)

	case "PING":
		client.send <- mustMarshal(models.NewWSMessage("PONG", nil))
	}
}

func mustMarshal(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}
