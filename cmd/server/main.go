package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"mediadeck/internal/api"
	"mediadeck/internal/database"
	"mediadeck/internal/streamer"
	"mediadeck/internal/websocket"
	"mediadeck/web"
)

func main() {
	port := flag.Int("port", 8080, "Port for MediaDeck server")
	dataDir := flag.String("data", "./data", "Directory for media storage and database")
	flag.Parse()

	// Check if PORT environment variable is set (used by cloud platforms like Render)
	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			*port = p
		}
	}

	log.Println("==================================================")
	log.Println("           MediaDeck Server v2.0                  ")
	log.Println("  Dual-Screen & Remote Multimedia Controller     ")
	log.Println("==================================================")

	// Initialize local database & store
	store, err := database.NewStore(*dataDir)
	if err != nil {
		log.Fatalf("[Error] Failed to initialize store: %v", err)
	}

	// Initialize WebSocket hub
	hub := websocket.NewHub(store)
	go hub.Run()

	// Initialize media streamer (HTTP 206 Range support)
	mediaDir := *dataDir + "/media"
	mediaStreamer := streamer.NewMediaStreamer(mediaDir)

	// Initialize API handlers
	handler := api.NewHandler(store, hub, mediaDir, *port)

	// Router with embedded web frontend
	router := api.NewRouter(handler, mediaStreamer, hub, web.GetFS())
	httpHandler := router.SetupRoutes()

	// Detect primary IP for display
	localIP := getPrimaryLocalIP()

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", *port),
		Handler:      httpHandler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Server runner
	go func() {
		fmt.Printf("\n🚀 MediaDeck Server successfully started on port %d!\n", *port)
		fmt.Printf("💻 Laptop Dashboard:      http://localhost:%d/\n", *port)
		fmt.Printf("🖥️  Audience Output:       http://localhost:%d/output\n", *port)
		fmt.Printf("📱 Mobile Stage Remote:   http://%s:%d/remote\n\n", localIP, *port)
		fmt.Printf("📁 Data directory:        %s\n", *dataDir)
		fmt.Printf("📡 WebSocket Endpoint:    ws://localhost:%d/ws\n\n", *port)
		fmt.Println("Press Ctrl+C to stop the server.")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Error] Server failed: %v", err)
		}
	}()

	// Graceful shutdown on SIGINT or SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("\n[MediaDeck] Shutting down server gracefully...")
}

func getPrimaryLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ip := ipNet.IP.To4(); ip != nil {
				return ip.String()
			}
		}
	}
	return "localhost"
}
