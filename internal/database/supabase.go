package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"mediadeck/internal/models"
)

type SupabaseClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewSupabaseClient(url, apiKey string) *SupabaseClient {
	cleanURL := strings.TrimRight(url, "/")
	return &SupabaseClient{
		baseURL: cleanURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 300 * time.Second,
		},
	}
}

func (c *SupabaseClient) setHeaders(req *http.Request) {
	req.Header.Set("apikey", c.apiKey)
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
}

// GetMediaItems fetches all media items from Supabase PostgreSQL
func (c *SupabaseClient) GetMediaItems() ([]models.MediaItem, error) {
	reqURL := fmt.Sprintf("%s/rest/v1/media_items?select=*&order=createdAt.desc", c.baseURL)
	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(body))
	}

	var items []models.MediaItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

// InsertMediaItem inserts or upserts a media item in Supabase
func (c *SupabaseClient) InsertMediaItem(item models.MediaItem) error {
	reqURL := fmt.Sprintf("%s/rest/v1/media_items", c.baseURL)
	payload, err := json.Marshal(item)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, reqURL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	c.setHeaders(req)
	req.Header.Set("Prefer", "resolution=merge-duplicates")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase insert error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

// DeleteMediaItem deletes a media item by ID from Supabase
func (c *SupabaseClient) DeleteMediaItem(id string) error {
	reqURL := fmt.Sprintf("%s/rest/v1/media_items?id=eq.%s", c.baseURL, id)
	req, err := http.NewRequest(http.MethodDelete, reqURL, nil)
	if err != nil {
		return err
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase delete error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

// GetPlaylist fetches playlist items from Supabase
func (c *SupabaseClient) GetPlaylist() ([]models.PlaylistItem, error) {
	reqURL := fmt.Sprintf("%s/rest/v1/playlist_items?select=*&order=order.asc", c.baseURL)
	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("supabase playlist error %d: %s", resp.StatusCode, string(body))
	}

	var items []models.PlaylistItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

// SetPlaylist overwrites the playlist in Supabase
func (c *SupabaseClient) SetPlaylist(playlist []models.PlaylistItem) error {
	// First delete all
	delURL := fmt.Sprintf("%s/rest/v1/playlist_items?id=neq.none", c.baseURL)
	delReq, err := http.NewRequest(http.MethodDelete, delURL, nil)
	if err == nil {
		c.setHeaders(delReq)
		delResp, err := c.httpClient.Do(delReq)
		if err == nil {
			delResp.Body.Close()
		}
	}

	if len(playlist) == 0 {
		return nil
	}

	// Insert new playlist
	reqURL := fmt.Sprintf("%s/rest/v1/playlist_items", c.baseURL)
	payload, err := json.Marshal(playlist)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, reqURL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase set playlist error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

// UploadFile uploads a file to Supabase Storage and returns its public URL
func (c *SupabaseClient) UploadFile(filename string, fileReader io.Reader, contentType string) (string, error) {
	reqURL := fmt.Sprintf("%s/storage/v1/object/mediadeck/%s", c.baseURL, filename)
	req, err := http.NewRequest(http.MethodPost, reqURL, fileReader)
	if err != nil {
		return "", err
	}
	req.Header.Set("apikey", c.apiKey)
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("x-upsert", "true")
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("supabase storage upload error %d: %s", resp.StatusCode, string(body))
	}

	// Supabase public URL format
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/mediadeck/%s", c.baseURL, filename)
	return publicURL, nil
}
